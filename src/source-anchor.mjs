/** Resource-based source coordinates shared by speech scripts and sound scores. */
import { canonicalizeJson, JSON_RESOURCE_ENVELOPE } from "@red-cup-engineering/json-services-section/canonical-json";
import { parseJsonPointer } from "@red-cup-engineering/json-services-section/resolve-json-pointer";
import { isNiUri } from "@red-cup-engineering/uri-services-section/ni-uri";
import { isIP } from "node:net";

export const SPEECH_SCRIPT_JSON_ENVELOPE = Object.freeze({
  ...JSON_RESOURCE_ENVELOPE,
  maxDepth: 16,
  maxNodes: 20_000,
  maxObjectMembers: 32,
  maxArrayLength: 1_024,
  maxStringBytes: 65_536,
  maxKeyBytes: 128,
});

// RFC 3986 Appendix A, specialized to schemed references with an optional
// fragment. The original JSON owner's issue-11 branch derives this component
// grammar for CloudEvents (33e684fd, scripts/validate-cloudevent.mjs). That
// private helper is not an exported supplier; retain this source-anchor
// predicate here until a public networking/URI admission surface is qualified.
// Do not use WHATWG URL: its repair/normalization would change source identity.
const unreserved = String.raw`[A-Za-z0-9._~-]`;
const pctEncoded = String.raw`%[0-9A-Fa-f]{2}`;
const subDelims = String.raw`[!$&'()*+,;=]`;
const pchar = `(?:${unreserved}|${pctEncoded}|${subDelims}|[:@])`;
const userInfo = `(?:${unreserved}|${pctEncoded}|${subDelims}|:)*`;
const regName = `(?:${unreserved}|${pctEncoded}|${subDelims})*`;
const authority = `(?:${userInfo}@)?(?:${regName}|\\[[^\\[\\]]+\\])(?::[0-9]*)?`;
const pathAbempty = `(?:/${pchar}*)*`;
const pathAbsolute = `/(?:${pchar}+(?:/${pchar}*)*)?`;
const pathRootless = `${pchar}+(?:/${pchar}*)*`;
const hierPart = `(?://${authority}${pathAbempty}|${pathAbsolute}|${pathRootless}|)`;
const queryOrFragment = `(?:${pchar}|[/?])*`;
const resourcePattern = new RegExp(`^[A-Za-z][A-Za-z0-9+.-]*:${hierPart}(?:\\?${queryOrFragment})?(?:#${queryOrFragment})?(?![\\s\\S])`, "u");
const ipFuture = new RegExp(`^[vV][0-9A-Fa-f]+\\.(?:${unreserved}|${subDelims}|:)+(?![\\s\\S])`, "u");

function validResource(value) {
  if (typeof value !== "string" || /[^\x21-\x7e]/u.test(value) || !resourcePattern.test(value)) return false;
  const literal = value.match(/\[([^\[\]]+)\]/u);
  // Node also accepts IPv6 zone identifiers. They are outside the selected
  // RFC 3986 grammar (and raw % can be a malformed escape), so exclude them.
  return !literal || (/^[0-9A-Fa-f:.]+$/u.test(literal[1]) && isIP(literal[1]) === 6) || ipFuture.test(literal[1]);
}

function refuse(path, message) {
  const error = new TypeError(`${path}: ${message}`);
  error.code = "INVALID_SOURCE_ANCHOR";
  error.path = path;
  throw error;
}

/** Admit coordinates, not source truth: no resource is fetched or resolved. */
export function admitSourceAnchor(candidate) {
  const anchor = canonicalizeJson(candidate, SPEECH_SCRIPT_JSON_ENVELOPE).value;
  if (anchor === null || typeof anchor !== "object" || Array.isArray(anchor)) refuse("", "must be a source anchor record");
  const fields = ["resource", "revision", "pointer"];
  if (Object.keys(anchor).length !== fields.length || fields.some((key) => !Object.hasOwn(anchor, key))) refuse("", "needs exactly resource, revision and pointer");
  if (!validResource(anchor.resource)) refuse("/resource", "must be an absolute ASCII RFC 3986 URI reference");
  if (!isNiUri(anchor.revision)) refuse("/revision", "must be a canonical sha-256 NI URI");
  try {
    parseJsonPointer(anchor.pointer, { allowFragment: false });
  } catch {
    refuse("/pointer", "must be an RFC 6901 JSON string pointer");
  }
  return anchor;
}
