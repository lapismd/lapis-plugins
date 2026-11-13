import assert from "node:assert/strict";
import { createHash, generateKeyPairSync } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { registryChangelogFromMarkdown } from "@lapis-notes/api/registry/schema";
import { packageOfficialPlugin } from "./plugin-release.mjs";
import { prepareStaticReleaseCandidate } from "./lib/static-release-candidate.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("static candidates bind npm and signed deterministic archives without Nostr configuration", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lapis-static-candidate-"));
  try {
    const sourceCommit = "a".repeat(40);
    const plugin = {
      pluginId: "lapis-graph",
      directory: "graph",
      packageName: "@lapis-notes/graph",
    };
    const packageRoot = path.join(root, "packages/graph");
    const inputDir = path.join(root, "runtime");
    await mkdir(packageRoot, { recursive: true });
    await mkdir(inputDir, { recursive: true });
    const manifest = {
      id: plugin.pluginId,
      name: "Graph",
      version: "1.0.0",
      minAppVersion: "0.1.0",
      lapis: {
        runtime: {
          entries: { workspace: { path: "main.mjs", format: "esm" } },
        },
      },
    };
    await writeFile(
      path.join(inputDir, "manifest.json"),
      JSON.stringify(manifest)
    );
    await writeFile(
      path.join(inputDir, "main.mjs"),
      "export default class Graph {}\n"
    );
    await writeFile(path.join(inputDir, "styles.css"), "");
    await writeFile(
      path.join(packageRoot, "package.json"),
      JSON.stringify({ name: plugin.packageName, version: "1.0.0" })
    );
    await writeFile(
      path.join(packageRoot, "registry.json"),
      JSON.stringify({ schemaVersion: 2 })
    );
    await writeFile(
      path.join(packageRoot, "CHANGELOG.md"),
      "## 1.0.0\n- Fast graphs.\n"
    );
    await packageOfficialPlugin({
      pluginId: plugin.pluginId,
      version: "1.0.0",
      inputDir,
      outDir: path.join(root, ".release/plugins"),
      packageName: plugin.packageName,
      commit: sourceCommit,
    });
    const { privateKey } = generateKeyPairSync("ed25519");
    const privateKeyFile = path.join(root, "key.pem");
    await writeFile(
      privateKeyFile,
      privateKey.export({ type: "pkcs8", format: "pem" }),
      { mode: 0o600 }
    );
    const tarball = "package.tgz";
    const npmBytes = Buffer.from("immutable npm candidate");
    await writeFile(path.join(root, tarball), npmBytes);
    const npmArtifact = {
      packageName: plugin.packageName,
      version: "1.0.0",
      tarball,
      sha256: createHash("sha256").update(npmBytes).digest("hex"),
    };
    const options = {
      root,
      plugin,
      npmArtifact,
      privateKeyFile,
      keyId: "lapis-plugin-release-test",
      sourceCommit,
    };
    const first = await prepareStaticReleaseCandidate(options);
    const bytes = await readFile(path.join(root, first.bundle.path));
    const second = await prepareStaticReleaseCandidate(options);
    assert.deepEqual(first, second);
    assert.deepEqual(
      bytes,
      await readFile(path.join(root, second.bundle.path))
    );
    assert.equal(first.trust, "static-ed25519");
    assert.equal("nostr" in first, false);
    assert.match(first.assetName, /\.lapis-plugin$/u);
    assert.equal(first.changelog.description, "- Fast graphs.");
    await assert.rejects(
      prepareStaticReleaseCandidate({
        ...options,
        sourceCommit: "b".repeat(40),
      }),
      /coordinates/
    );
    await assert.rejects(
      prepareStaticReleaseCandidate({
        ...options,
        npmArtifact: { ...npmArtifact, sha256: "0".repeat(64) },
      }),
      /checksum/
    );
    await writeFile(
      path.join(packageRoot, "CHANGELOG.md"),
      `## 1.0.0\n${"x".repeat(4001)}\n`
    );
    await assert.rejects(prepareStaticReleaseCandidate(options), /4000/);
    await writeFile(
      path.join(packageRoot, "registry.json"),
      JSON.stringify({
        schemaVersion: 2,
        releases: {
          "1.0.0": {
            changelog: {
              title: "Graph 1.0.0",
              tags: ["feature"],
              description: "Bounded override.",
            },
          },
        },
      })
    );
    const overridden = await prepareStaticReleaseCandidate(options);
    assert.equal(overridden.changelog.description, "Bounded override.");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Canvas 0.3.0 ships a bounded registry changelog override", async () => {
  const markdown = await readFile(
    path.join(repoRoot, "packages/canvas/CHANGELOG.md"),
    "utf8"
  );
  const registry = JSON.parse(
    await readFile(path.join(repoRoot, "packages/canvas/registry.json"), "utf8")
  );
  assert.throws(
    () => registryChangelogFromMarkdown("Canvas", "0.3.0", markdown),
    /4000/
  );
  const notes = registryChangelogFromMarkdown(
    "Canvas",
    "0.3.0",
    markdown,
    registry.releases["0.3.0"].changelog
  );
  assert.equal(notes.title, "Canvas 0.3.0");
  assert.ok(notes.description.length <= 4000);
  assert.deepEqual(notes.tags, ["feature", "fix"]);
});
