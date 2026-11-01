# Speech script qualification

Source candidate: `@red-cup-engineering/voice-audio-services-section@0.2.0`,
derived from original commit `79bd38b1fc47b2f570121e880fb06808414020e8`.
This is local source and installed-artifact evidence, not registry issuance,
runtime deployment or audience receiving.

## Executed scope

Node.js 24.22.1; package dependencies were installed through native npm from
the configured `https://registry.561.group`. The new native `package-lock.json`
records exact artifact integrities for original JSON 0.4.2-dev.270, URI 0.1.1
and its Cryptographic Data 0.3.1 dependency. The JSON pin receives an existing
upstream repair, described below; no supplier implementation was substituted.

| Check | Observed result |
| --- | --- |
| Four shipped implementation modules, `npm run check` | Passed |
| Initial named native suite, `npm test` | 54 passed; zero failed, skipped, cancelled or todo; additional independent regressions and compatibility cases are included in the final gate |
| Original ebook/score tests retained | Four named tests passed within that suite |
| JSON Schema 2020-12 through separately implemented Hyperjump validator | 17 valid/invalid cases agree with runtime; schema compilation passed |
| Original score, cast and production manifest compared with exact base source | Deep equality and identical score digest |
| `npm pack --ignore-scripts`, fresh native installed consumer | Public script and schema exports load; ordered text and pauses, exact digest binding, existing cast and refusal case pass |
| Source-owned `npm run test:consumer` | One native orchestration test passed after six named installed-package contract tests passed; zero failures, skips, cancellations or todo in either runner |

The speech contract test file was authored from the requirements before the
adapter source. The schema engine is an independent standards implementation;
the test-case authorship is not an independent editorial or code review. The
coordinating consumer and reviewer must provide their own receiving evidence.

The existing test command originally reported two file-level results in this
environment. The candidate uses Node's `--test-isolation=none` and TAP reporter
so the enrolled named tests and their individual results are visible rather
than inferred from successful test-file launches. The exact final count and
commit are retained by the native merge-gate receipt and source pull request.

## Repeatable installed-package consumer

`npm run test:consumer` is a distinct native test command for the original
merge gate. Its source is `test/consumer/installed-package.test.mjs`; the
receiving contract is `test/consumer/fixtures/speech-script-consumer.mjs`.
The command packs the current source into a fresh temporary directory, installs
that archive through native `npm ci`, then executes the copied receiving
contract from inside the isolated consumer. Bare package imports are checked
against the installed archive's real path, and source symlinks refuse.

The temporary consumer lock retains every supplier version, resolved artifact
URL, integrity and dependency edge from the source-owned lock. Only the
consumer root and packed Voice Audio entry are added. Installation checks
the archive SHA-512 integrity, records its SHA-256 digest, verifies the
installed manifests and preserves the selected lock. It uses the configured
npm registry and cache. The isolated install is offline: first populate the
same writable cache through the original native `npm ci --ignore-scripts
--no-audit --no-fund`. A missing cached supplier fails the check; it is not
replaced with a fixture or another version. If selecting a cache with
`npm_config_cache`, keep that setting for both commands.

The child runner receives an environment with inherited `NODE_TEST_CONTEXT`
removed. The outer test requires six completed, passing native TAP cases
with no skipped, cancelled or todo cases; an empty successful child launch
cannot satisfy this check. The six cases cover public script/score/schema
exports; exact speech, speakers, zero and fractional pauses; canonical source
revision and RFC 6901 pointer resolution against the supplied fixture;
existing cast and production-manifest binding; malformed inputs and missing
voices; deterministic replay and selective primitive changes. One case also
demonstrates the explicit structural limit: a well-formed but unresolved
pointer or mismatched source revision can be admitted, so a receiving owner
must separately resolve and verify the cited source.

The local execution used Node.js 24.22.1 and npm 11.9.0. The restricted shell
route refused native child-process spawning with `EPERM`; the supported
execution route ran the same unchanged command successfully. No network
fetch was needed for the offline consumer installation. This is source-owned
consumer execution, not an independent assurance verdict or an exact-commit
merge-gate receipt; the coordinator runs that gate after selecting the final
source commit.

## Relevant observations

The new adapter preserves whitespace and Unicode in speech, escaped JSON
pointers, explicit speakers, fractional pauses and zero pauses. Unknown fields,
duplicate segment IDs, malformed source names/pointers, mixed anchor forms,
oversized scripts, non-JSON values and ordinary property getters refuse. The
getter counter remains zero on the exercised refusal cases.

The original JSON owner's canonical admission now supplies immutable score
options directly, replacing `structuredClone` followed by a freezer. This
rejects accessors before they can execute and retains the old score/cast/
manifest values and canonical identities for ordinary JSON fixtures.

Schema validation is structural. Runtime additionally enforces the byte/node
envelope, canonical JSON runtime model and unique segment IDs. Neither route
resolves a source pointer or proves that its text matches a cited resource.

## Independent review and original supplier repair

Independent review exercised exact legacy score/cast/manifest and ebook
projections against source commit `79bd38b1fc47b2f570121e880fb06808414020e8`.
It also found malformed URI component structure admitted by the first source
identifier predicate. The corrected predicate follows RFC 3986 component
grammar, separately validates IPv6/IPvFuture and refuses IPv6 zone syntax
outside that grammar. Independent cases preserve valid source strings verbatim
and refuse extra fragment markers, invalid hosts/ports and misplaced delimiters.

A second counterexample exposed the original JSON supplier's old SEN-tail
recognizer executing a child getter before refusal. This was already repaired
in [JSON PR 7](https://github.com/red-cup-engineering/json-engineering-services-section/pull/7)
and subsequently received in
[PR 10](https://github.com/red-cup-engineering/json-engineering-services-section/pull/10).
The actual stable 0.4.1 archive still fails two of the original 23 identity/spine
cases and invokes the getter in this exact audio-shaped case. The actual
0.4.2-dev.270 archive passes all 23 and refuses with zero getter calls. Its
canonicalizer Git blob `d17d296aabb32668f8620d123f123ed0df56f3ec` matches
original main; its archive SHA-256 is
`e4e1803e1d0bf6eeda07a9ea8a20d38fc59d9cefc277e0f672e79d624ad2f163`.

This candidate explicitly pins that original prerelease and records its registry
integrity in the native lock. The regression remains in this owner's source
suite so an unsafe future dependency selection is visible here as well. The
version is not represented as stable, and a successful source gate is not a
new JSON release.

## Remaining receiving

Language Generation now owns the paired installed-package exercise in its
`test:consumer` command; the paired source qualification records that result.
A renderer must separately
produce and measure real audio. Editorial/listening review, continuous playout,
fallback/restart tests, listener evaluation and publication remain distinct.

No generated waveform, live speech-provider call, broadcast, sleep benefit,
registry publication or independent listening acceptance is asserted here.
