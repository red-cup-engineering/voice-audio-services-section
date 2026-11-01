// Receive the selected source through its real packed public package. This is
// a structural data consumer; it neither substitutes nor calls a speech provider.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceRoot = fileURLToPath(new URL("../../", import.meta.url));
const packageName = "@red-cup-engineering/voice-audio-services-section";
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + "\n");

function successful(command, args, cwd) {
  const env = { ...process.env };
  // An inherited Node test context can suppress an otherwise successful child
  // runner. Every child, including npm's own Node process, gets a fresh context.
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", timeout: 45_000, maxBuffer: 4 * 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.signal, null, `${command} terminated by ${result.signal}`);
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  return result;
}

test("packed Voice Audio reaches the installed speech, score, cast and manifest consumer", { timeout: 180_000 }, async (t) => {
  const manifest = await readJson(join(sourceRoot, "package.json"));
  const lock = await readJson(join(sourceRoot, "package-lock.json"));
  assert.equal(manifest.name, packageName);
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages[""].version, manifest.version);
  assert.deepEqual(lock.packages[""].dependencies, manifest.dependencies);
  const cache = successful("npm", ["config", "get", "cache"], sourceRoot).stdout.trim();
  const registry = successful("npm", ["config", "get", "registry"], sourceRoot).stdout.trim();
  const sandbox = await mkdtemp(join(tmpdir(), "voice-audio-consumer-"));
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  const consumer = join(sandbox, "consumer");
  await mkdir(consumer);

  const packed = JSON.parse(successful("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", sandbox, "--cache", cache], sourceRoot).stdout);
  assert.equal(packed.length, 1);
  assert.equal(packed[0].name, packageName);
  assert.equal(packed[0].version, manifest.version);
  const tarball = join(sandbox, packed[0].filename);
  const archiveBytes = await readFile(tarball);
  const archiveSha256 = createHash("sha256").update(archiveBytes).digest("hex");
  assert.equal(packed[0].integrity, "sha512-" + createHash("sha512").update(archiveBytes).digest("base64"));

  const archiveReference = `file:../${packed[0].filename}`;
  const dependencies = { ...manifest.dependencies, [packageName]: archiveReference };
  const consumerManifest = { name: "voice-audio-installed-consumer", version: "1.0.0", private: true, type: "module", dependencies };
  const suppliers = Object.fromEntries(Object.entries(lock.packages).filter(([path]) => path !== ""));
  assert.ok(Object.keys(suppliers).length > 0, "the original locked supplier closure is required");
  for (const [path, record] of Object.entries(suppliers)) {
    assert.match(path, /^node_modules\//u);
    assert.equal(typeof record.resolved, "string", `${path} needs its original resolved artifact`);
    assert.equal(typeof record.integrity, "string", `${path} needs its original artifact integrity`);
    assert.equal(record.link, undefined, "supplier source symlinks cannot replace installed registry artifacts");
  }
  // Only the receiving root and newly packed producer are added. Every supplier
  // version, URL, integrity and dependency edge is carried verbatim from the
  // source-owned lock; npm ci then verifies and installs that exact closure.
  const consumerLock = {
    name: consumerManifest.name, version: consumerManifest.version, lockfileVersion: 3, requires: true,
    packages: {
      "": { name: consumerManifest.name, version: consumerManifest.version, dependencies },
      ...suppliers,
      [`node_modules/${packageName}`]: {
        version: manifest.version, resolved: archiveReference, integrity: packed[0].integrity,
        license: manifest.license, dependencies: manifest.dependencies, engines: manifest.engines,
      },
    },
  };
  await writeJson(join(consumer, "package.json"), consumerManifest);
  await writeJson(join(consumer, "package-lock.json"), consumerLock);
  successful("npm", ["ci", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", "--cache", cache, "--registry", registry], consumer);
  assert.equal(createHash("sha256").update(await readFile(tarball)).digest("hex"), archiveSha256);
  assert.deepEqual(await readJson(join(consumer, "package-lock.json")), consumerLock, "installation must retain the selected dependency closure");
  const installedRoot = join(consumer, "node_modules", packageName);
  assert.equal((await lstat(installedRoot)).isSymbolicLink(), false);
  assert.deepEqual(await readJson(join(installedRoot, "package.json")), manifest);
  for (const [path, record] of Object.entries(suppliers)) {
    assert.equal((await lstat(join(consumer, path))).isSymbolicLink(), false);
    assert.equal((await readJson(join(consumer, path, "package.json"))).version, record.version);
  }

  await copyFile(new URL("./fixtures/speech-script-consumer.mjs", import.meta.url), join(consumer, "contract.test.mjs"));
  await writeJson(join(consumer, "installation.json"), { packageName, version: manifest.version, installedRoot: await realpath(installedRoot) });
  const received = successful(process.execPath, ["--test", "--test-isolation=none", "--test-reporter=tap", "contract.test.mjs"], consumer);
  const summary = (name) => {
    const match = received.stdout.match(new RegExp(`^# ${name} (\\d+)$`, "mu"));
    assert.ok(match, `the installed consumer must report an executed TAP ${name} count`);
    return Number(match[1]);
  };
  assert.equal(summary("tests"), 6);
  assert.equal(summary("pass"), 6);
  for (const name of ["fail", "cancelled", "skipped", "todo"]) assert.equal(summary(name), 0);
  for (const line of received.stdout.trim().split("\n")) t.diagnostic(line);
  t.diagnostic(JSON.stringify({
    package: packageName, version: manifest.version, archiveSha256,
    installedConsumerTests: summary("tests"),
    qualification: "structural script/score/cast/manifest receiving only; no speech rendering, editorial approval, listening or playout acceptance",
  }));
});
