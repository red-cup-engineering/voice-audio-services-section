// Copied into an isolated installation before execution. Bare imports below
// must resolve to the real installed archive and its original registry suppliers.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { canonicalJson } from "@red-cup-engineering/json-services-section/canonical-json";
import { resolveJsonPointer } from "@red-cup-engineering/json-services-section/resolve-json-pointer";
import { admitSpeechScript, scoreFromSpeechScript } from "@red-cup-engineering/voice-audio-services-section/speech-script";
import { admitAudioplayCast, admitSoundScore, contentDigest, createAudioplayProductionManifest } from "@red-cup-engineering/voice-audio-services-section/audioplay-model";
import schema from "@red-cup-engineering/voice-audio-services-section/speech-script-schema" with { type: "json" };

const installation = JSON.parse(await readFile(new URL("./installation.json", import.meta.url), "utf8"));
const sourceDocument = {
  status: "pending-editorial-review",
  candidate: {
    paragraphs: [
      { text: "  The blue cup waited under a folded afternoon.\n" },
      { text: "The shelf remembered the word «almost»." },
    ],
    "aside/label~": { text: "A small cloud carried the label また明日." },
  },
};
const sourceRevision = "ni:///sha-256;" + createHash("sha256").update(canonicalJson(sourceDocument), "utf8").digest("base64url");
const makeScript = () => ({
  kind: "speech-script/v1", id: "urn:example:quiet-shelf", title: "The quiet shelf", language: "en-US",
  source: { resource: "urn:example:voice-audio-consumer:source", revision: sourceRevision },
  segments: [
    { id: "line-1", speakerId: "narrator", text: sourceDocument.candidate.paragraphs[0].text, sourcePointer: "/candidate/paragraphs/0/text", pauseAfterSeconds: 1.25 },
    { id: "line-2", speakerId: "keeper", text: sourceDocument.candidate.paragraphs[1].text, sourcePointer: "/candidate/paragraphs/1/text", pauseAfterSeconds: 0 },
    { id: "line-3", speakerId: "narrator", text: sourceDocument.candidate["aside/label~"].text, sourcePointer: "/candidate/aside~1label~0/text", pauseAfterSeconds: 0.5 },
  ],
});
// These are explicit structural descriptors, not implemented provider stubs or
// evidence that an adapter, voice or renderer has been installed or invoked.
const makeCast = () => ({
  type: "AudioplayCast", version: 1,
  members: [
    { speakerId: "narrator", voice: { adapter: "urn:example:unrendered-adapter", voice: "urn:example:narrator-voice" } },
    { speakerId: "keeper", voice: { adapter: "urn:example:unrendered-adapter", voice: "urn:example:keeper-voice" } },
  ],
});

test("installed public speech, score and schema exports belong to the packed package", async () => {
  for (const entry of ["speech-script", "audioplay-model", "speech-script-schema"]) {
    const path = await realpath(fileURLToPath(import.meta.resolve(`${installation.packageName}/${entry}`)));
    assert.ok(path.startsWith(installation.installedRoot + sep), `${entry} must resolve inside the installed archive`);
  }
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties.kind.const, "speech-script/v1");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual([...schema.$defs.sourceAnchor.required].sort(), ["pointer", "resource", "revision"]);
  assert.equal(contentDigest(sourceDocument), sourceRevision, "source NI must identify the original canonical JSON bytes");
});

test("installed adapter preserves ordered speech, explicit speakers, canonical source pointers and all pauses", () => {
  const input = makeScript();
  const before = structuredClone(input);
  const admitted = admitSpeechScript(input);
  const score = scoreFromSpeechScript(input, { seed: 19 });
  assert.deepEqual(input, before);
  assert.equal(score.type, "AdmittedSoundScore");
  assert.equal(score.score[1].seed, 19);
  assert.deepEqual(score.score[1].source, { kind: "speech-script", digest: admitted.digest, ...input.source });
  assert.deepEqual(score.score[2].slice(1).map(([tag]) => tag), ["narrate", "silence", "narrate", "silence", "narrate", "silence"]);
  for (const [index, segment] of input.segments.entries()) {
    const narration = score.score[2][1 + index * 2][1];
    assert.deepEqual(narration, { id: segment.id, speakerId: segment.speakerId, text: segment.text, anchor: { ...input.source, pointer: segment.sourcePointer } });
    assert.equal(resolveJsonPointer(sourceDocument, narration.anchor.pointer), narration.text);
    assert.equal(score.score[2][2 + index * 2][1].durationSeconds, segment.pauseAfterSeconds);
    assert.equal(Object.isFrozen(narration.anchor), true);
  }
  assert.deepEqual(admitSoundScore(score.score), score, "the projected score must reach the existing independent score entry");
  assert.equal(admitted.digest, contentDigest(input));
  assert.equal(score.digest, contentDigest(score.score));
});

test("installed speech score reaches the existing explicit cast and digest-bound production manifest", () => {
  const score = scoreFromSpeechScript(makeScript());
  const cast = admitAudioplayCast(makeCast(), score);
  const manifest = createAudioplayProductionManifest({
    score, cast,
    renderer: { id: "urn:example:unrendered-score", version: 1 },
    projections: [],
    extensions: { readAlong: { status: "designed", anchors: "resource/revision/pointer", format: null } },
  });
  assert.deepEqual(cast.members, makeCast().members);
  assert.equal(manifest.scoreDigest, score.digest);
  assert.equal(manifest.castDigest, cast.digest);
  const { digest, ...body } = manifest;
  assert.equal(digest, contentDigest(body));
  assert.equal(Object.isFrozen(manifest.renderer), true);
  assert.deepEqual(manifest.projections, []);
  assert.equal(manifest.extensions.readAlong.anchors, "resource/revision/pointer");
  assert.equal(manifest.extensions.livePlayer.status, "designed");
});

test("installed consumer refuses missing voices, malformed pointers and mixed source anchors", () => {
  const score = scoreFromSpeechScript(makeScript());
  const missingVoice = makeCast(); missingVoice.members.pop();
  assert.throws(() => admitAudioplayCast(missingVoice, score), /missing voice assignments for keeper/u);
  for (const pointer of ["#/candidate/paragraphs/0/text", "/bad~2escape"]) {
    const invalid = makeScript(); invalid.segments[0].sourcePointer = pointer;
    assert.throws(() => scoreFromSpeechScript(invalid), { code: "INVALID_SPEECH_SCRIPT" });
  }
  const unknownField = makeScript(); unknownField.segments[0].voice = "inferred";
  assert.throws(() => admitSpeechScript(unknownField), { code: "INVALID_SPEECH_SCRIPT" });
  const mixed = structuredClone(score.score);
  Object.assign(mixed[2][1][1].anchor, { chapter: "01.md", paragraph: 0, sentence: 0 });
  assert.throws(() => admitSoundScore(mixed), { code: "INVALID_SOUND_SCORE" });
});

test("installed admission leaves source resolution and editorial or playout acceptance to separate consumers", () => {
  const unresolved = makeScript();
  unresolved.segments[0].sourcePointer = "/candidate/absent/text";
  const score = scoreFromSpeechScript(unresolved);
  assert.equal(score.type, "AdmittedSoundScore", "syntax admission must not pretend to resolve a source");
  assert.equal(resolveJsonPointer(sourceDocument, score.score[2][1][1].anchor.pointer), undefined);
  const mismatched = makeScript(); mismatched.source.revision = contentDigest({ other: "source" });
  assert.notEqual(scoreFromSpeechScript(mismatched).score[1].source.revision, sourceRevision);
  assert.equal(Object.hasOwn(score, "accepted"), false);
  assert.equal(Object.hasOwn(score, "audio"), false);
  assert.equal(sourceDocument.status, "pending-editorial-review");
});

test("installed score replay is deterministic and a changed pause changes only its primitive and score identity", () => {
  const input = makeScript();
  const before = scoreFromSpeechScript(input);
  assert.deepEqual(scoreFromSpeechScript(JSON.parse(JSON.stringify(input))), before);
  input.segments[1].pauseAfterSeconds = 2;
  const after = scoreFromSpeechScript(input);
  assert.notEqual(after.digest, before.digest);
  const changedIndex = 3;
  for (const [index, primitive] of before.primitiveAddresses.entries()) {
    if (index === changedIndex) assert.notEqual(after.primitiveAddresses[index].address, primitive.address);
    else assert.equal(after.primitiveAddresses[index].address, primitive.address);
  }
});
