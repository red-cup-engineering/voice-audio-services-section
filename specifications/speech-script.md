# Speech script and sound score projection

## Purpose, ownership and source

The Leader's 2026-11-01 Dreamworld request requires prose fabrication that can
serve a continuous radioplay without treating every work as an ebook. This
contract implements only the reusable speech data boundary. Language Generation
owns prose. Voice Audio owns speech-bearing score data. Systems Publishing owns
provider calls, rendering, measurements and artifact production. Public Audio
and the producing content owner retain listening acceptance and release.

The predecessor is Voice Audio commit
`79bd38b1fc47b2f570121e880fb06808414020e8`, especially `audioplay-model.mjs`.
Its score grammar already supports narrated speech and silence; its source
anchors unnecessarily require ebook chapter coordinates. The original
`scoreFromNarrationLayer` remains the ebook adapter.

## Requirements and design decision

| ID | Machine guarantee | Falsifying observation |
| --- | --- | --- |
| SS-1 | Admit a provider-independent JSON speech script without a chapter, StoryBible, cover or inferred voice. | A valid radio, announcement or dialogue script needs any such field. |
| SS-2 | Preserve each exact text, explicit speaker, source pointer and pause in input order. | A value changes, is omitted, or is inferred during projection. |
| SS-3 | Bind the source resource, exact revision and script digest to the score. | Changing any binding preserves the complete score identity. |
| SS-4 | Admit generic anchors separately from the legacy manuscript form. | An anchor mixes resource/pointer and chapter coordinates. |
| SS-5 | Reject malformed/non-JSON/oversized inputs before returning a score. | An accessor runs, unsupported value survives, or partial result returns. |
| SS-6 | Retain original ebook score and cast behavior. | Existing suite or unchanged legacy score identity changes. |

Alternatives: requiring fake chapters violates SS-1; a parallel radio score
duplicates the existing grammar; extending the existing sound owner with a
generic source anchor preserves its composition and cast capabilities. The
selected design adds one script adapter and one shared source-anchor validator.
No renderer, station loop, provider or publication mechanism is added here.

## Input and output

`admitSpeechScript(candidate)` takes a runtime JSON value conforming to
`speech-script.schema.json`. It returns a deeply immutable
`{ type: "AdmittedSpeechScript", version: 1, script, digest }`. `script` is an
admitted copy, not the caller's mutable object. No field is defaulted. Every
segment has a unique nonblank `id`, an explicit nonblank `speakerId`, nonblank
`text`, a `sourcePointer` and a finite nonnegative `pauseAfterSeconds`.

`source.resource` is an absolute ASCII URI reference under the RFC 3986 generic
URI grammar, including valid component delimiters, percent escapes, numeric
ports and IPv6/IPvFuture literals. An optional fragment is allowed; relative
references are not. This is generic syntax admission, not scheme-specific
validation, normalization, resource access or proof of existence.
`source.revision` uses the existing URI owner's canonical RFC 6920
SHA-256 NI form. A pointer uses the RFC 6901 JSON string representation: the
empty pointer is valid, `/` selects an empty member name, `~0` and `~1` retain
their standard meanings, and URI fragment pointers beginning with `#` refuse.
Pointers are preserved verbatim. Syntax admission does not fetch a resource,
resolve its pointer, verify its bytes or certify the text's source relationship.

`scoreFromSpeechScript(candidate, { seed = 561 } = {})` takes the original
script value, admits it, and returns the original `AdmittedSoundScore` type.
It emits one `narrate` expression then one `silence` expression per segment,
including zero-duration silence. The narration anchor is exactly
`{resource, revision, pointer}`. The score metadata binds the script's digest,
resource and revision. Existing `admitAudioplayCast` consumes its speaker IDs;
no synthetic voice is chosen by this projection.

Unknown fields refuse at script, source, segment and generic-anchor boundaries.
Segment ID uniqueness is an additional semantic rule beyond JSON Schema's
structural validation. Source URI and NI validation likewise use their runtime
contracts. Canonical JSON uses the original JSON owner and RFC 8785 semantics,
including the normalization of numeric negative zero to zero.

## Resource envelope and refusals

Scripts and new anchors use the original JSON owner's admission before domain
traversal: at most 1 MiB canonical JSON, depth 16, 20,000 nodes, 32 members per
object, 1,024 array elements, 65,536 UTF-8 bytes per string and 128 bytes per key.
These are computation bounds, not a recommended passage duration or performance
pace. JSON admission refuses custom prototypes, accessors, symbols, sparse
arrays, cycles, nonfinite numbers, unsupported runtime values and lone Unicode
surrogates. It returns a frozen copy without invoking ordinary property getters.

Domain refusals are `TypeError` with `code: "INVALID_SPEECH_SCRIPT"` and a
JSON Pointer `path`; upstream JSON refusals retain their original code/path.
Generic anchor domain refusals use `INVALID_SOURCE_ANCHOR`, and sound-score
admission reports these at the affected score path with `INVALID_SOUND_SCORE`.
All operations are pure and return no partial artifact on refusal.

## Compatibility and acceptance boundary

The legacy `{chapter, paragraph, sentence, ...}` anchor remains supported;
negative paragraph/sentence indices used for credits and optional
`contentDigest` remain valid. An anchor cannot combine either form's fields.
The existing audiobook source description, mastering policy and independent
listening-proof requirement are unchanged.

An admitted script or score establishes structural conformance and exact
bindings. It is still a candidate for editorial and performance assessment.
It proves neither synthesis, rendered pause timing, low arousal, sleep benefit,
playout admission, a working broadcaster nor permission to publish.

## Verification and standards

The contract cases were derived before the adapter implementation. They cover
speech conservation, order, zero/fractional pauses, pointer escaping, source
revision changes, cast completeness, immutable snapshots, unsupported fields,
mixed anchors, malformed JSON values, bounds and original ebook controls.
Root-level independent review and a Language Generation consumer exercise are
separate receiving evidence.

- [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901), sections 3 and 5:
  JSON Pointer grammar and string representation.
- [RFC 6920](https://www.rfc-editor.org/rfc/rfc6920): content names; the original
  URI package supplies the narrower canonical SHA-256 NI contract.
- [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785): JSON canonicalization;
  the original JSON package supplies admission and canonical bytes.
- [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/json-schema-core):
  interoperable structural description. This document states the supplemental
  semantic and runtime conditions that the schema alone cannot express.

The source-anchor URI predicate follows RFC 3986 Appendix A and the existing
[JSON issue-11 repair](https://github.com/red-cup-engineering/json-engineering-services-section/pull/12)
at `33e684fdad31169f13b775d0c30494d2c22a4936`, specialized to this boundary's
schemed references. That draft's private CloudEvents helper is not a released
generic networking supplier. This package therefore qualifies its own bounded
predicate and uses Node's original `isIP` for IPv6 validation. The JSON Schema
pattern describes component grammar; valid IP literals are additionally checked
at runtime. No URL parser is allowed to repair or normalize the supplied source.
