import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { admitSoundScore, admitAudioplayCast, createAudioplayProductionManifest, scoreFromNarrationLayer } from "../src/audioplay-model.mjs";

// Captured independently from the exact original owner module at commit
// 79bd38b1fc47b2f570121e880fb06808414020e8 using its original providers.
// Expected values must not be regenerated from the candidate implementation.
const baseline = JSON.parse(readFileSync(new URL("./fixtures/legacy-identity-observations.json", import.meta.url), "utf8"));

test("SS-6 complete legacy authored score, cast and manifest retain original identity", () => {
  const { input, expected } = baseline.authored;
  const score = admitSoundScore(input.score);
  const cast = admitAudioplayCast(input.cast, score);
  const manifest = createAudioplayProductionManifest({ ...input.manifestOptions, score, cast });
  assert.deepEqual({ score, cast, manifest }, expected);
});

test("SS-6 ebook narration lifting retains original values including credit anchors", () => {
  for (const { seed, expected } of baseline.narration.observations) {
    assert.deepEqual(scoreFromNarrationLayer(baseline.narration.input, { seed }), expected);
  }
});
