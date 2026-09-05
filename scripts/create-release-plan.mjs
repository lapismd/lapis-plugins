#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyPluginPayload } from "./lib/verify-plugin-release.mjs";
import { createNostrReleaseCandidate } from "./lib/nostr-release-candidate.mjs";
import { pluginPackages } from "./package-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const production = process.argv.includes("--production");
const npmManifest = JSON.parse(
  await readFile(path.join(root, ".release/npm/manifest.json"), "utf8")
);
const npmByName = new Map(
  npmManifest.map((entry) => [entry.packageName, entry])
);
const releases = [];
const releasedAt = process.env.LAPIS_RELEASED_AT;
if (!releasedAt) {
  throw new Error(
    "LAPIS_RELEASED_AT is required for deterministic Nostr candidates."
  );
}

for (const plugin of pluginPackages) {
  const packageJson = JSON.parse(
    await readFile(
      path.join(root, "packages", plugin.directory, "package.json"),
      "utf8"
    )
  );
  const npmArtifact = npmByName.get(plugin.packageName);
  if (!npmArtifact || npmArtifact.version !== packageJson.version) {
    throw new Error(
      `${plugin.packageName} is missing its matching npm tarball.`
    );
  }
  const assetName = `${plugin.pluginId}-${packageJson.version}.lapis-plugin`;
  const payloadName = `${plugin.pluginId}-${packageJson.version}.payload.zip`;
  const payloadPath = path.join(
    root,
    ".release/plugins",
    `${plugin.pluginId}-${packageJson.version}`,
    payloadName
  );
  const payloadBytes = await readFile(payloadPath);
  const releaseManifestPath = path.join(
    path.dirname(payloadPath),
    "release.json"
  );
  const releaseManifest = JSON.parse(
    await readFile(releaseManifestPath, "utf8")
  );
  const verified = verifyPluginPayload({
    bundleBytes: payloadBytes,
    releaseManifest,
  });
  const signed = verified.releaseManifest;
  if (
    signed.source?.package !== plugin.packageName ||
    signed.pluginId !== plugin.pluginId ||
    signed.version !== packageJson.version
  ) {
    throw new Error(`${plugin.packageName} signed coordinates do not match.`);
  }
  const payloadChecksum = createHash("sha256")
    .update(payloadBytes)
    .digest("hex");
  const checksumFile = await readFile(`${payloadPath}.sha256`, "utf8");
  if (checksumFile.split(/\s+/)[0] !== payloadChecksum) {
    throw new Error(
      `${plugin.packageName} payload checksum file does not match.`
    );
  }
  const tarballPath = path.resolve(root, npmArtifact.tarball);
  const tarballBytes = await readFile(tarballPath);
  const tarballChecksum = createHash("sha256")
    .update(tarballBytes)
    .digest("hex");
  if (tarballChecksum !== npmArtifact.sha256) {
    throw new Error(
      `${plugin.packageName} npm tarball checksum does not match.`
    );
  }
  const plannedRelease = {
    repository: "lapismd/lapis-plugins",
    packageName: plugin.packageName,
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseTag: `${plugin.directory}@${packageJson.version}`,
    assetName,
    payloadName,
    sourceCommit: signed.source?.commit,
    trust: "nostr-publisher-curator",
    npm: {
      path: path.relative(root, tarballPath),
      sha256: tarballChecksum,
      size: (await stat(tarballPath)).size,
    },
    payload: {
      path: path.relative(root, payloadPath),
      checksumPath: path.relative(root, `${payloadPath}.sha256`),
      sha256: payloadChecksum,
      size: payloadBytes.byteLength,
    },
    releaseManifest: {
      path: path.relative(root, releaseManifestPath),
      sha256: createHash("sha256")
        .update(await readFile(releaseManifestPath))
        .digest("hex"),
      size: (await stat(releaseManifestPath)).size,
    },
  };
  const nostr = await createNostrReleaseCandidate({
    release: plannedRelease,
    packageRoot: path.join(root, "packages", plugin.directory),
    directory: plugin.directory,
    releaseManifestPath,
    repository: plannedRelease.repository,
    releasedAt,
  });
  plannedRelease.nostr = {
    candidateId: nostr.candidateId,
    manifest: {
      path: path.relative(root, nostr.manifestPath),
      sha256: nostr.manifestSha256,
      size: nostr.manifestSize,
    },
    publisherRequestPath: path.relative(root, nostr.requestPath),
  };
  releases.push(plannedRelease);
}

const plan = {
  schemaVersion: 1,
  production,
  generatedFrom: releases[0]?.sourceCommit,
  releases,
};
await writeFile(
  path.join(root, ".release/release-plan.json"),
  `${JSON.stringify(plan, null, 2)}\n`
);
console.log(`Prepared ${releases.length} verified release coordinates.`);
