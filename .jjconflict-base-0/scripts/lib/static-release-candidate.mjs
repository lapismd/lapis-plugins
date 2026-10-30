import { createHash, createPublicKey } from "node:crypto";
import { readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { registryChangelogFromMarkdown } from "@lapis-notes/api/registry/schema";
import {
  signReleaseManifest,
  buildSignedPluginBundle,
} from "../plugin-release.mjs";
import { verifyPluginBundle } from "./verify-plugin-release.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function prepareStaticReleaseCandidate({
  root,
  plugin,
  npmArtifact,
  privateKeyFile,
  keyId,
  sourceCommit,
}) {
  const packageRoot = path.join(root, "packages", plugin.directory);
  const packageJson = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8")
  );
  if (packageJson.private === true)
    throw new Error("Private plugin is parked and cannot be released.");
  if (
    !npmArtifact ||
    npmArtifact.version !== packageJson.version ||
    npmArtifact.packageName !== plugin.packageName ||
    packageJson.name !== plugin.packageName
  )
    throw new Error(`${plugin.packageName} has no matching npm candidate.`);
  const npmBytes = await readFile(path.resolve(root, npmArtifact.tarball));
  if (digest(npmBytes) !== npmArtifact.sha256)
    throw new Error("npm candidate checksum mismatch.");
  const directory = path.join(
    root,
    ".release/plugins",
    `${plugin.pluginId}-${packageJson.version}`
  );
  const releasePath = path.join(directory, "release.json");
  const releaseManifest = JSON.parse(await readFile(releasePath, "utf8"));
  if (
    releaseManifest.source?.commit !== sourceCommit ||
    releaseManifest.source?.package !== plugin.packageName ||
    releaseManifest.version !== packageJson.version ||
    releaseManifest.pluginId !== plugin.pluginId
  )
    throw new Error(
      "Static candidate coordinates do not match the selected source."
    );
  const signedReleasePath = path.join(directory, "release.signed.json");
  await signReleaseManifest({
    input: releasePath,
    out: signedReleasePath,
    privateKeyFile,
    keyId,
  });
  const built = await buildSignedPluginBundle({
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseDir: directory,
    signedReleasePath,
  });
  const first = await readFile(built.bundlePath);
  const reproduction = `${built.bundlePath}.reproduction`;
  await buildSignedPluginBundle({
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseDir: directory,
    signedReleasePath,
    out: reproduction,
  });
  const second = await readFile(reproduction);
  await rm(reproduction);
  if (!first.equals(second))
    throw new Error("Static archive reproduction differs.");
  const publicKey = createPublicKey(await readFile(privateKeyFile, "utf8"));
  verifyPluginBundle({ bundleBytes: first, publicKey });
  await writeFile(
    `${built.bundlePath}.sha256`,
    `${digest(first)}  ${path.basename(built.bundlePath)}\n`
  );
  const registry = JSON.parse(
    await readFile(path.join(packageRoot, "registry.json"), "utf8")
  );
  const manifest = JSON.parse(
    await readFile(path.join(directory, "files/manifest.json"), "utf8")
  );
  const changelog = registryChangelogFromMarkdown(
    manifest.name,
    packageJson.version,
    await readFile(path.join(packageRoot, "CHANGELOG.md"), "utf8"),
    registry.releases?.[packageJson.version]?.changelog
  );
  return {
    repository: "lapismd/lapis-plugins",
    packageName: plugin.packageName,
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseTag: `${plugin.directory}@${packageJson.version}`,
    assetName: path.basename(built.bundlePath),
    sourceCommit,
    signingKeyId: keyId,
    trust: "static-ed25519",
    ...(changelog ? { changelog } : {}),
    npm: {
      path: npmArtifact.tarball,
      sha256: digest(npmBytes),
      size: npmBytes.byteLength,
    },
    bundle: {
      path: path.relative(root, built.bundlePath),
      checksumPath: path.relative(root, `${built.bundlePath}.sha256`),
      sha256: digest(first),
      size: first.byteLength,
    },
  };
}
