import assert from "node:assert/strict";
import test from "node:test";
import { admitSpeechScript, scoreFromSpeechScript } from "../src/speech-script.mjs";
import { admitSourceAnchor } from "../src/source-anchor.mjs";

const revision = `ni:///sha-256;${"A".repeat(43)}`;
const script = (resource = "urn:example:review") => ({
  kind: "speech-script/v1", id: "review", title: "Review", language: "en-US",
  source: { resource, revision },
  segments: [{ id: "line", speakerId: "reader", text: "The cup rested.", sourcePointer: "", pauseAfterSeconds: 0 }],
});

// Independent grammar examples from RFC 3986 sections 3.2, 3.3, and 3.5.
// These are syntax refusals, not network availability or authorization rules.
test("independent review: malformed URI component structure refuses", () => {
  for (const resource of [
    "urn:example:review#first#second",
    "https://[invalid/path",
    "https://example.org/a[b]",
    "urn:example:review?x=[y]",
    "https://user@@example.org/path",
    "https://example.org:letters/path",
    "https://[not-an-ipv6]/path",
    "https://[2001:db8::g]/path",
    "https://[v1.]/path",
    "http://[fe80::1%eth0]/path",
    "http://[fe80::1%zz]/path",
    "http://[fe80::1%25eth0]/path",
  ]) {
    assert.throws(() => admitSourceAnchor({ resource, revision, pointer: "" }), TypeError, resource);
    assert.throws(() => scoreFromSpeechScript(script(resource)), TypeError, resource);
  }
});

test("independent review: URI delimiters in their valid components survive verbatim", () => {
  for (const resource of [
    "urn:example:review",
    "urn:example:review#one%23two",
    "https://user:pass@[2001:db8::1]:8042/a%5Bb%5D?q=%5Bok%5D#one/two?three",
    "custom+scheme://host.example/a:b@c;d!e$f&g'h(i)j*k+l,m=n",
    "file:///tmp/source.json",
    "mailto:reader@example.org",
    "custom://[v1.future:address]/path",
    "custom://[Vf.UPPERCASE]/path",
    "http://[::ffff:192.0.2.1]:80/path",
  ]) {
    assert.equal(scoreFromSpeechScript(script(resource)).score[1].source.resource, resource);
  }
});

test("independent review: malformed SEN-shaped array must refuse without invoking its child getter", () => {
  let calls = 0;
  const tail = ["pair", 1, null];
  Object.defineProperty(tail, "0", { enumerable: true, get() { calls++; return "pair"; } });
  const candidate = script();
  candidate.segments = ["pair", 0, tail];
  assert.throws(() => admitSpeechScript(candidate), TypeError);
  assert.equal(calls, 0, "JSON admission must inspect the child descriptor before recognizing a SEN spine");
});
