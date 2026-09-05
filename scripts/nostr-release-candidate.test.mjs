import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createNostrReleaseCandidate } from "./lib/nostr-release-candidate.mjs";

test("binds a rootless payload and release manifest into a deterministic Nostr candidate", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-nostr-candidate-"));
  const packageRoot = path.join(root, "package");
  const releaseRoot = path.join(root, "release");
  await Promise.all([
    mkdir(packageRoot, { recursive: true }),
    mkdir(releaseRoot, { recursive: true }),
  ]);
  const manifest = {
    id: "example",
    name: "Example",
    version: "1.2.3",
    minAppVersion: "0.1.0",
    description: "Example plugin",
    author: "Lapis Notes",
    authorAvatarUrl: "https://example.com/avatar.png",
    isDesktopOnly: false,
  };
  const packageJson = {
    name: "@lapis-notes/example",
    version: "1.2.3",
    license: "AGPL-3.0-or-later",
    repository: "git+https://github.com/lapismd/lapis-plugins.git",
  };
  const registry = {
    categories: ["productivity"],
    highlights: ["A deterministic example."],
  };
  const lapisRelease = {
    schemaVersion: 1,
    type: "lapis.plugin.release",
    pluginId: "example",
    version: "1.2.3",
    channel: "official",
    source: { package: "@lapis-notes/example", commit: "abc123" },
    compatibility: { minAppVersion: "0.1.0", platforms: ["web", "desktop"] },
    runtime: { entries: { workspace: { path: "main.mjs", format: "esm" } } },
    files: [],
  };
  const releaseManifestPath = path.join(releaseRoot, "release.json");
  await Promise.all([
    writeFile(
      path.join(packageRoot, "manifest.json"),
      JSON.stringify(manifest)
    ),
    writeFile(
      path.join(packageRoot, "package.json"),
      JSON.stringify(packageJson)
    ),
    writeFile(
      path.join(packageRoot, "registry.json"),
      JSON.stringify(registry)
    ),
    writeFile(releaseManifestPath, JSON.stringify(lapisRelease)),
  ]);
  const release = {
    releaseTag: "example@1.2.3",
    assetName: "example-1.2.3.lapis-plugin",
    payloadName: "example-1.2.3.payload.zip",
    payload: { sha256: "a".repeat(64), size: 1234 },
  };
  const options = {
    release,
    packageRoot,
    directory: "example",
    releaseManifestPath,
    repository: "lapismd/lapis-plugins",
    releasedAt: "2026-09-05T00:00:00.000Z",
  };

  const first = await createNostrReleaseCandidate(options);
  const firstManifest = await readFile(first.manifestPath, "utf8");
  const firstRequest = JSON.parse(await readFile(first.requestPath, "utf8"));
  const second = await createNostrReleaseCandidate(options);

  assert.equal(second.candidateId, first.candidateId);
  assert.equal(await readFile(second.manifestPath, "utf8"), firstManifest);
  assert.equal(firstRequest.purpose, "publisher-release");
  assert.equal(firstRequest.candidateId, first.candidateId);
  assert.equal(firstRequest.attachment.sha256, first.manifestSha256);
  assert.equal(first.expectedEventTemplate.kind, 9);
  assert.equal(
    first.expectedEventTemplate.tags.some(
      (tag) => tag[0] === "t" && tag[1] === "plugin:example"
    ),
    true
  );
  const nostrManifest = JSON.parse(firstManifest);
  assert.equal(nostrManifest.release.artifact.sha256, "a".repeat(64));
  assert.equal(
    nostrManifest.release.artifact.url,
    "https://github.com/lapismd/lapis-plugins/releases/download/example%401.2.3/example-1.2.3.payload.zip"
  );
  assert.deepEqual(nostrManifest.release.metadata.lapisRelease, lapisRelease);
  assert.equal(Object.hasOwn(firstRequest, "event"), false);

  await rm(root, { recursive: true, force: true });
});
