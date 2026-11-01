/** Pure, medium-independent speech script admission and sound-score projection. */
import { canonicalizeJson } from "@red-cup-engineering/json-services-section/canonical-json";
import { admitSoundScore, contentDigest } from "./audioplay-model.mjs";
import { admitSourceAnchor, SPEECH_SCRIPT_JSON_ENVELOPE } from "./source-anchor.mjs";

function refuse(path, message) {
  const error = new TypeError(`${path}: ${message}`);
  error.code = "INVALID_SPEECH_SCRIPT";
  error.path = path;
  throw error;
}

function exactRecord(value, names, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) refuse(path, "must be a record");
  if (Object.keys(value).length !== names.length || names.some((name) => !Object.hasOwn(value, name))) refuse(path, `needs exactly ${names.join(", ")}`);
}

function nonblank(value, path) {
  if (typeof value !== "string" || !value.trim()) refuse(path, "must be nonblank text");
}

/** Structural admission is not editorial, listening or broadcast acceptance. */
export function admitSpeechScript(candidate) {
  const script = canonicalizeJson(candidate, SPEECH_SCRIPT_JSON_ENVELOPE).value;
  exactRecord(script, ["kind", "id", "title", "language", "source", "segments"], "");
  if (script.kind !== "speech-script/v1") refuse("/kind", "must be speech-script/v1");
  for (const field of ["id", "title", "language"]) nonblank(script[field], `/${field}`);
  exactRecord(script.source, ["resource", "revision"], "/source");
  if (!Array.isArray(script.segments) || script.segments.length === 0) refuse("/segments", "must be a nonempty array");
  const ids = new Set();
  for (const [index, segment] of script.segments.entries()) {
    const path = `/segments/${index}`;
    exactRecord(segment, ["id", "speakerId", "text", "sourcePointer", "pauseAfterSeconds"], path);
    for (const field of ["id", "speakerId", "text"]) nonblank(segment[field], `${path}/${field}`);
    if (ids.has(segment.id)) refuse(`${path}/id`, "segment ids must be unique");
    ids.add(segment.id);
    if (typeof segment.pauseAfterSeconds !== "number" || !Number.isFinite(segment.pauseAfterSeconds) || segment.pauseAfterSeconds < 0) refuse(`${path}/pauseAfterSeconds`, "must be finite nonnegative seconds");
    try {
      admitSourceAnchor({ ...script.source, pointer: segment.sourcePointer });
    } catch (error) {
      if (error.code !== "INVALID_SOURCE_ANCHOR") throw error;
      const field = error.path === "/pointer" ? `${path}/sourcePointer` : `/source${error.path}`;
      refuse(field, error.message);
    }
  }
  return Object.freeze({ type: "AdmittedSpeechScript", version: 1, script, digest: contentDigest(script) });
}

/** Preserve explicit speech and pauses using the original SoundScore grammar. */
export function scoreFromSpeechScript(candidate, { seed = 561 } = {}) {
  const { script, digest } = admitSpeechScript(candidate);
  const expressions = script.segments.flatMap((segment) => [
    ["narrate", {
      id: segment.id,
      speakerId: segment.speakerId,
      text: segment.text,
      anchor: { ...script.source, pointer: segment.sourcePointer },
    }],
    ["silence", { durationSeconds: segment.pauseAfterSeconds }],
  ]);
  return admitSoundScore(["score", {
    type: "SoundScore", version: 1,
    id: script.id, title: script.title, language: script.language, seed,
    source: { kind: "speech-script", digest, ...script.source },
  }, ["seq", ...expressions]]);
}
