#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CI_IMAGE_MANIFEST,
  dependencyImageTag,
  sha256File,
  validateCiImageManifest,
} from "./lib/ci-images.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pinnedWorkflowPaths = [
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
];

export async function updateCiImageManifest({
  root = repositoryRoot,
  digest,
  workflowPaths = pinnedWorkflowPaths,
} = {}) {
  if (!/^sha256:[a-f0-9]{64}$/.test(digest ?? "")) {
    throw new Error("Dependency image digest must be a SHA-256 value.");
  }

  const manifestPath = path.join(root, CI_IMAGE_MANIFEST);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const previousReference = `${manifest.dependencies.image}@${manifest.dependencies.digest}`;
  const nextReference = `${manifest.dependencies.image}@${digest}`;
  const workflowUpdates = [];

  for (const relativePath of workflowPaths) {
    const workflowPath = path.join(root, relativePath);
    const source = await readFile(workflowPath, "utf8");
    if (!source.includes(previousReference)) {
      throw new Error(`${relativePath} does not pin ${previousReference}.`);
    }
    workflowUpdates.push([workflowPath, source.replaceAll(previousReference, nextReference)]);
  }

  const lockfileSha256 = await sha256File(path.join(root, "pnpm-lock.yaml"));
  manifest.dependencies.tag = dependencyImageTag(lockfileSha256);
  manifest.dependencies.lockfileSha256 = lockfileSha256;
  manifest.dependencies.digest = digest;

  for (const [workflowPath, source] of workflowUpdates) {
    await writeFile(workflowPath, source);
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await validateCiImageManifest(root, { requireDependencyDigest: true });

  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const digest = process.argv[2];
  if (!digest) {
    throw new Error("Usage: update-ci-image-manifest.mjs sha256:<digest>");
  }
  const manifest = await updateCiImageManifest({ digest });
  console.log(`Pinned dependency image ${manifest.dependencies.image}@${digest}.`);
}
