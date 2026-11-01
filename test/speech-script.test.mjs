import assert from "node:assert/strict";
import test from "node:test";
import { admitSpeechScript, scoreFromSpeechScript } from "../src/speech-script.mjs";
import { admitAudioplayCast, admitSoundScore, contentDigest } from "../src/audioplay-model.mjs";

const revision = `ni:///sha-256;${"A".repeat(43)}`;
const script = () => ({
  kind: "speech-script/v1", id: "quiet-platform", title: "A quiet platform", language: "en-US",
  source: { resource: "urn:example:dreamworld:passage:1", revision },
  segments: [
    { id: "line-1", speakerId: "narrator", text: "  The shelf remembered a small blue cup.\n", sourcePointer: "/paragraphs/0/text", pauseAfterSeconds: 1.25 },
    { id: "line-2", speakerId: "porter", text: "The cup had no appointment.", sourcePointer: "/paragraphs/a~1b~0c/text", pauseAfterSeconds: 0 },
  ],
});
const soundScore = (anchor) => ["score", { type: "SoundScore", version: 1, id: "fixture", title: "Fixture", language: "en", seed: 561 }, ["narrate", { id: "line", speakerId: "reader", text: "One line.", anchor }]];

test("SS-1/2 speech script projects exact ordered speech and every pause without ebook matter", () => {
  const input = script();
  const score = scoreFromSpeechScript(input);
  assert.equal(score.type, "AdmittedSoundScore");
  assert.deepEqual(score.score[2].slice(1).map(([tag]) => tag), ["narrate", "silence", "narrate", "silence"]);
  for (let index = 0; index < input.segments.length; index++) {
    const segment = input.segments[index];
    const narration = score.score[2][1 + index * 2][1];
    assert.equal(narration.id, segment.id);
    assert.equal(narration.speakerId, segment.speakerId);
    assert.equal(narration.text, segment.text);
    assert.deepEqual(narration.anchor, { ...input.source, pointer: segment.sourcePointer });
    assert.equal(score.score[2][2 + index * 2][1].durationSeconds, segment.pauseAfterSeconds);
  }
  assert.equal(JSON.stringify(score).includes("chapter"), false);
  assert.equal(JSON.stringify(score).includes("audiobook"), false);
  assert.equal(score.score[1].seed, 561);
});

test("SS-3 score binds exact source revision and admitted script identity", () => {
  const input = script();
  const admitted = admitSpeechScript(input);
  const before = scoreFromSpeechScript(input, { seed: 17 });
  assert.equal(admitted.digest, contentDigest(input));
  assert.equal(before.score[1].source.digest, admitted.digest);
  assert.equal(before.score[1].source.resource, input.source.resource);
  assert.equal(before.score[1].source.revision, input.source.revision);
  const edited = script(); edited.source.revision = contentDigest("new revision");
  assert.notEqual(before.digest, scoreFromSpeechScript(edited, { seed: 17 }).digest);
  assert.deepEqual(before, scoreFromSpeechScript(JSON.parse(JSON.stringify(input)), { seed: 17 }));
});

test("SS-2 script admission returns an independent deeply frozen snapshot", () => {
  const input = script(); const before = structuredClone(input); const admitted = admitSpeechScript(input);
  assert.deepEqual(admitted.script, before);
  assert.notEqual(admitted.script, input);
  assert.ok(Object.isFrozen(admitted) && Object.isFrozen(admitted.script.segments[0]));
  assert.equal(Object.isFrozen(input), false);
  input.segments[0].text = "changed later";
  assert.equal(admitted.script.segments[0].text, before.segments[0].text);
});

test("SS-1 existing cast admission consumes explicit speakers and still refuses missing assignments", () => {
  const score = scoreFromSpeechScript(script());
  const cast = { type: "AudioplayCast", version: 1, members: [{ speakerId: "narrator", voice: { adapter: "fixture", voice: "one" } }] };
  assert.throws(() => admitAudioplayCast(cast, score), /porter/);
  cast.members.push({ speakerId: "porter", voice: { adapter: "fixture", voice: "two" } });
  assert.equal(admitAudioplayCast(cast, score).members.length, 2);
});

for (const pointer of ["", "/", "/a~0b/~1/~01", "/日本語/0", "/%2F", "/01", "/-"]) {
  test(`SS-2 valid RFC6901 string pointer is retained: ${JSON.stringify(pointer)}`, () => {
    const input = script(); input.segments[0].sourcePointer = pointer;
    assert.equal(scoreFromSpeechScript(input).score[2][1][1].anchor.pointer, pointer);
  });
}
for (const pointer of ["#", "#/paragraphs/0", "paragraphs/0", "/bad~", "/bad~2", 0, null]) {
  test(`SS-5 malformed or fragment pointer refuses: ${JSON.stringify(pointer)}`, () => {
    const input = script(); input.segments[0].sourcePointer = pointer;
    assert.throws(() => admitSpeechScript(input), TypeError);
  });
}
for (const [name, edit] of [
  ["unknown script field", x => x.accepted = true],
  ["unknown source field", x => x.source.chapter = "01.md"],
  ["unknown segment field", x => x.segments[0].voice = "invented"],
  ["missing explicit pause", x => delete x.segments[0].pauseAfterSeconds],
  ["empty segments", x => x.segments = []],
  ["duplicate segment id", x => x.segments[1].id = x.segments[0].id],
  ["blank id", x => x.id = "\t"],
  ["blank speaker", x => x.segments[0].speakerId = " "],
  ["blank text", x => x.segments[0].text = "\n "],
  ["wrong kind", x => x.kind = "speech-script/v2"],
  ["relative source", x => x.source.resource = "passage.json"],
  ["source contains whitespace", x => x.source.resource = "urn:example:bad resource"],
  ["source has a final newline", x => x.source.resource = "urn:example:bad\n"],
  ["source malformed percent escape", x => x.source.resource = "urn:example:bad%q1"],
  ["wrong revision scheme", x => x.source.revision = "sha256:" + "a".repeat(64)],
  ["noncanonical NI pad bits", x => x.source.revision = `ni:///sha-256;${"A".repeat(42)}B`],
  ["negative pause", x => x.segments[0].pauseAfterSeconds = -0.1],
  ["infinite pause", x => x.segments[0].pauseAfterSeconds = Infinity],
]) {
  test(`SS-5 ${name} refuses without result`, () => {
    const input = script(); edit(input);
    assert.throws(() => admitSpeechScript(input), TypeError);
    assert.throws(() => scoreFromSpeechScript(input), TypeError);
  });
}

test("SS-5 strict JSON admission rejects an accessor before it runs", () => {
  const input = script(); let calls = 0;
  Object.defineProperty(input.segments[0], "text", { enumerable: true, get() { calls++; return "Not JSON"; } });
  assert.throws(() => admitSpeechScript(input), TypeError);
  assert.equal(calls, 0);
});
for (const [name, make] of [
  ["custom prototype", () => Object.assign(Object.create({ inherited: true }), script())],
  ["symbol property", () => Object.assign(script(), { [Symbol("secret")]: true })],
  ["undefined", () => ({ ...script(), ignored: undefined })],
  ["bigint", () => ({ ...script(), ignored: 1n })],
  ["sparse segments", () => ({ ...script(), segments: new Array(1) })],
  ["lone surrogate", () => ({ ...script(), title: "bad\ud800" })],
  ["cyclic value", () => { const x = script(); x.loop = x; return x; }],
]) {
  test(`SS-5 non-JSON ${name} refuses`, () => assert.throws(() => admitSpeechScript(make()), TypeError));
}

test("SS-5 exact array and UTF-8 string limits refuse oversized work", () => {
  const tooMany = script(); tooMany.segments = Array.from({ length: 1025 }, (_, i) => ({ ...tooMany.segments[0], id: `line-${i}` }));
  assert.throws(() => admitSpeechScript(tooMany), TypeError);
  const tooLong = script(); tooLong.segments[0].text = "é".repeat(32769);
  assert.throws(() => admitSpeechScript(tooLong), TypeError);
  const atLimit = script(); atLimit.segments[0].text = "é".repeat(32768);
  assert.equal(admitSpeechScript(atLimit).script.segments[0].text, atLimit.segments[0].text);
});

test("SS-5 total canonical size limit bounds a script of individually valid segments", () => {
  const input = script();
  input.segments = Array.from({ length: 100 }, (_, index) => ({ ...input.segments[0], id: `line-${index}`, text: "x".repeat(11000) }));
  assert.throws(() => admitSpeechScript(input), { code: "canonical-limit" });
});

test("SS-4 new generic anchor is accepted without manuscript coordinates", () => {
  const anchor = { resource: "urn:example:script", revision, pointer: "/segments/0" };
  assert.deepEqual(admitSoundScore(soundScore(anchor)).score[2][1].anchor, anchor);
});
test("SS-4 mixed generic/manuscript anchors are refused in either direction", () => {
  for (const anchor of [
    { resource: "urn:example:script", revision, pointer: "", chapter: "one" },
    { chapter: "one", paragraph: 0, sentence: 0, resource: "urn:example:script" },
    { chapter: "one", paragraph: 0, sentence: 0, pointer: "" },
  ]) assert.throws(() => admitSoundScore(soundScore(anchor)), TypeError);
});
test("SS-4 generic anchor validation does not execute accessors before refusing", () => {
  let calls = 0; const anchor = { resource: "urn:example:script", revision };
  Object.defineProperty(anchor, "pointer", { enumerable: true, get() { calls++; return ""; } });
  assert.throws(() => admitSoundScore(soundScore(anchor)), TypeError);
  assert.equal(calls, 0);
});
test("SS-6 legacy manuscript credit coordinates and digest are preserved", () => {
  const anchor = { chapter: "01.md", paragraph: -1, sentence: -1, contentDigest: revision };
  assert.deepEqual(admitSoundScore(soundScore(anchor)).score[2][1].anchor, anchor);
});
