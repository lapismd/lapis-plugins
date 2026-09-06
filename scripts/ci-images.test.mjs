import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  dependencyImageTag,
  validateCiImageManifest,
} from "./lib/ci-images.mjs";
import { prepareCiDependencyContext } from "./prepare-ci-dependency-context.mjs";
import { updateCiImageManifest } from "./update-ci-image-manifest.mjs";

const digest = "a".repeat(64);

test("dependency image tag is derived from the lockfile hash", () => {
  assert.equal(dependencyImageTag(digest), `lock-${"a".repeat(16)}`);
});

test("dependency context contains manifests and patches but no source", async (t) => {
  const root = await fixtureRepository();
  const outDir = path.join(root, ".ci/context");
  t.after(() => rm(root, { recursive: true, force: true }));

  const metadata = await prepareCiDependencyContext({ root, outDir });

  assert.equal(metadata.tag, dependencyImageTag(metadata.lockfileSha256));
  assert.match(await readFile(path.join(outDir, "packages/ai/package.json"), "utf8"), /lapis-notes\/ai/);
  await assert.rejects(readFile(path.join(outDir, "packages/ai/src/index.ts"), "utf8"));
});

test("image manifest rejects a stale lockfile hash", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "pnpm-lock.yaml"), "changed\n");
  await assert.rejects(validateCiImageManifest(root), /stale/);
});

test("dependency context derives a new image tag while the checked-in pin is stale", async (t) => {
  const root = await fixtureRepository();
  const outDir = path.join(root, ".ci/context");
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "pnpm-lock.yaml"), "changed\n");

  const metadata = await prepareCiDependencyContext({ root, outDir });

  assert.equal(metadata.tag, dependencyImageTag(metadata.lockfileSha256));
});

test("digest pinning updates the manifest and every consuming workflow", async (t) => {
  const root = await fixtureRepository();
  const oldDigest = `sha256:${digest}`;
  const nextDigest = `sha256:${"b".repeat(64)}`;
  const manifestPath = path.join(root, ".ci/images.json");
  const workflowPaths = [
    ".github/workflows/ci.yml",
    ".github/workflows/release.yml",
  ];
  t.after(() => rm(root, { recursive: true, force: true }));

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.dependencies.digest = oldDigest;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  for (const relativePath of workflowPaths) {
    const workflowPath = path.join(root, relativePath);
    await mkdir(path.dirname(workflowPath), { recursive: true });
    await writeFile(workflowPath, `image: ${manifest.dependencies.image}@${oldDigest}\n`);
  }
  await writeFile(path.join(root, "pnpm-lock.yaml"), "changed\n");

  const updated = await updateCiImageManifest({
    root,
    digest: nextDigest,
    workflowPaths,
  });

  assert.equal(updated.dependencies.digest, nextDigest);
  assert.equal(
    updated.dependencies.tag,
    dependencyImageTag(updated.dependencies.lockfileSha256),
  );
  for (const relativePath of workflowPaths) {
    assert.match(await readFile(path.join(root, relativePath), "utf8"), new RegExp(nextDigest));
  }
});

async function fixtureRepository() {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-plugin-ci-images-"));
  await mkdir(path.join(root, ".ci"), { recursive: true });
  await mkdir(path.join(root, "scripts"), { recursive: true });
  await mkdir(path.join(root, "packages/ai/src"), { recursive: true });
  await mkdir(path.join(root, "patches"), { recursive: true });
  await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  const lockfileSha256 = await import("node:crypto").then(({ createHash }) =>
    createHash("sha256").update("lockfileVersion: '9.0'\n").digest("hex"),
  );
  await writeFile(path.join(root, "package.json"), '{"name":"fixture"}\n');
  await writeFile(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "packages/*"\n');
  await writeFile(path.join(root, "patches/example.patch"), "patch\n");
  await writeFile(path.join(root, "packages/ai/package.json"), '{"name":"@lapis-notes/ai"}\n');
  await writeFile(path.join(root, "packages/ai/src/index.ts"), "export {};\n");
  await writeFile(path.join(root, "scripts/package-catalog.mjs"), 'export const pluginPackages = [{ directory: "ai" }];\n');
  await writeFile(path.join(root, ".ci/dependency-image.Dockerfile"), "FROM scratch\n");
  await writeFile(
    path.join(root, ".ci/images.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      base: {
        image: "ghcr.io/lapismd/lapis-ci",
        tag: "test",
        digest: `sha256:${digest}`,
      },
      dependencies: {
        image: "ghcr.io/lapismd/lapis-plugins-ci",
        tag: dependencyImageTag(lockfileSha256),
        lockfileSha256,
        digest: null,
      },
    }, null, 2)}\n`,
  );
  return root;
}
