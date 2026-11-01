# Voice Audio Services Section

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

Owns pure data and policy specialized to speech-bearing audio. Provider calls,
process execution, filesystem fabrication, mastering, muxing, and transcription
are systems effects and do not live in this data-layer package.

## Speech scripts for radio, dialogue and other spoken media

The `./speech-script` export accepts explicit speech and pauses without ebook
chapters, a StoryBible, cover metadata or provider-specific voices. The original
SoundScore grammar and cast admission remain the common downstream interfaces.

```js
import { admitSpeechScript, scoreFromSpeechScript }
  from '@red-cup-engineering/voice-audio-services-section/speech-script';

const script = {
  kind: 'speech-script/v1',
  id: 'quiet-platform', title: 'A quiet platform', language: 'en-US',
  source: {
    resource: 'urn:example:dreamworld:passage:1',
    revision: 'ni:///sha-256;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  segments: [{
    id: 'line-1', speakerId: 'narrator',
    text: 'The shelf remembered a small blue cup.',
    sourcePointer: '/paragraphs/0/text', pauseAfterSeconds: 1.25,
  }],
};
const admitted = admitSpeechScript(script);
const score = scoreFromSpeechScript(script, { seed: 561 });
// admitted.digest binds the script. score retains its text, source and pause.
// The illustrative revision above is not evidence of a real source artifact.
```

The [JSON Schema](specifications/speech-script.schema.json), also exported as
`./speech-script-schema`, describes the data shape. The [component contract](specifications/speech-script.md)
specifies uniqueness, canonical source identities, strict bounded JSON
admission and the exact preservation guarantees. Source pointers use the RFC
6901 string representation and are preserved verbatim; their resolution is an
independent consumer check.

New narration anchors use `{resource, revision, pointer}`. Existing manuscript
anchors remain valid, and mixed forms refuse. Narration text and explicit
speakers are never inferred or rewritten. Every requested pause, including a
zero pause, becomes a score silence expression. No music, noise or credits are
added.

These pure operations produce structurally admitted candidates. They do not
establish editorial approval, a rendered performance, listening acceptance,
sleep efficacy, playout admission or public delivery. The existing audiobook
renderer still consumes chapter-based narration layers; a generic score
renderer and station operation are separate receiving obligations.

Node.js 24.2 or later is required by the selected original JSON dependency.
Run `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check` and
`npm test` for the complete named native suite. Run `npm run test:consumer`
with the same populated writable npm cache for isolated installed-archive
receiving. The exact JSON `0.4.2-dev.270` pin deliberately receives an
already-merged accessor-admission repair missing from stable 0.4.1; its
original source/artifact comparison and the prerelease limitation are recorded
in [the qualification record](docs/speech-script-qualification.md).

## Audiobook edition records

`src/audiobook-edition.mjs` describes an edition source by content address,
constructs the generic artifact-fabrication specification candidate, defines
the immutable `audiobook-master-v1` mastering record, computes word error rate,
and admits an independent listener's proof. The source binds the ebook owner's
`SoundScoreNarrationLayer`, StoryBible, voice settings, synthesizer provenance,
and mastering specification.

The mastering record requires mono 44.1 kHz audio, 192 kbps CBR chapter MP3s,
RMS from -23 through -18 dBFS, peaks no higher than -3 dBFS, and a noise floor
no higher than -60 dBFS. These values are data interpreted by the publishing
renderer; this package does not invoke ffmpeg or a speech provider.

The effectful interpreter is
`@red-cup-engineering/computer-systems-publishing-engineering-services-section/audiobook-production`.
It groups stable sentence primitives at the provider boundary, renders score
cues, caches synthesis requests by content address, masters chapter files,
muxes the M4B and runs the injected transcription proof. Automated proof is
only a first pass; `acceptAudiobookEdition()` still requires a separate human
or listening agent and exact artifact and edition-input digests.
