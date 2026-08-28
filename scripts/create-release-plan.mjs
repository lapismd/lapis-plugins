#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyPluginBundle } from "./lib/verify-plugin-release.mjs";
import { pluginPackages } from "./package-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const production = process.argv.includes("--production");
const npmManifest = JSON.parse(
  await readFile(path.join(root, ".release/npm/manifest.json"), "utf8"),
);
const npmByName = new Map(npmManifest.map((entry) => [entry.packageName, entry]));
const publicKey = await readFile(
  path.join(root, ".release/plugin-release-public.pem"),
  "utf8",
);
const releases = [];

for (const plugin of pluginPackages) {
  const packageJson = JSON.parse(
    await readFile(path.join(root, "packages", plugin.directory, "package.json"), "utf8"),
  );
  const npmArtifact = npmByName.get(plugin.packageName);
  if (!npmArtifact || npmArtifact.version !== packageJson.version) {
    throw new Error(`${plugin.packageName} is missing its matching npm tarball.`);
  }
  const archiveName = `${plugin.pluginId}-${packageJson.version}.lapis-plugin`;
  const archivePath = path.join(
    root,
    ".release/plugins",
    `${plugin.pluginId}-${packageJson.version}`,
    archiveName,
  );
  const archiveBytes = await readFile(archivePath);
  const verified = verifyPluginBundle({ bundleBytes: archiveBytes, publicKey });
  const signed = verified.envelope.signed;
  if (
    signed.source?.package !== plugin.packageName ||
    signed.pluginId !== plugin.pluginId ||
    signed.version !== packageJson.version
  ) {
    throw new Error(`${plugin.packageName} signed coordinates do not match.`);
  }
  const keyId = verified.envelope.signatures?.[0]?.keyId;
  if (production && keyId === "lapis-plugin-release-test-only") {
    throw new Error(`${plugin.packageName} uses the test-only release key.`);
  }
  const archiveChecksum = createHash("sha256").update(archiveBytes).digest("hex");
  const checksumFile = await readFile(`${archivePath}.sha256`, "utf8");
  if (checksumFile.split(/\s+/)[0] !== archiveChecksum) {
    throw new Error(`${plugin.packageName} archive checksum file does not match.`);
  }
  const tarballPath = path.resolve(root, npmArtifact.tarball);
  const tarballBytes = await readFile(tarballPath);
  const tarballChecksum = createHash("sha256").update(tarballBytes).digest("hex");
  if (tarballChecksum !== npmArtifact.sha256) {
    throw new Error(`${plugin.packageName} npm tarball checksum does not match.`);
  }
  releases.push({
    repository: "lapismd/lapis-plugins",
    packageName: plugin.packageName,
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseTag: `${plugin.directory}@${packageJson.version}`,
    assetName: archiveName,
    sourceCommit: signed.source?.commit,
    signingKeyId: keyId,
    npm: {
      path: path.relative(root, tarballPath),
      sha256: tarballChecksum,
      size: (await stat(tarballPath)).size,
    },
    archive: {
      path: path.relative(root, archivePath),
      checksumPath: path.relative(root, `${archivePath}.sha256`),
      sha256: archiveChecksum,
      size: archiveBytes.byteLength,
    },
  });
}

const plan = {
  schemaVersion: 1,
  production,
  generatedFrom: releases[0]?.sourceCommit,
  releases,
};
await writeFile(
  path.join(root, ".release/release-plan.json"),
  `${JSON.stringify(plan, null, 2)}\n`,
);
console.log(`Prepared ${releases.length} verified release coordinates.`);
