#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  verifyNostrReleaseProof,
} from "@lapismd/lapis-community/protocol";
import { createHash } from "node:crypto";
import { selectReleases } from "./publish-approved-release.mjs";
import { parseNostrPluginBundle } from "./lib/plugin-bundle.mjs";
import { createCurationCandidate } from "./nostr-release.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plan = JSON.parse(
  await readFile(path.join(root, ".release/release-plan.json"), "utf8")
);
const curatorPubkey = process.env.LAPIS_NOSTR_CURATOR_PUBKEY?.trim();
if (!curatorPubkey) throw new Error("LAPIS_NOSTR_CURATOR_PUBKEY is required.");

const pluginArgumentIndex = process.argv.indexOf("--plugins");
const selectors =
  pluginArgumentIndex === -1
    ? ["all"]
    : (process.argv[pluginArgumentIndex + 1] ?? "").split(",").filter(Boolean);
for (const release of selectReleases(plan.releases, selectors)) {
  const directory = path.join(root, path.dirname(release.payload.path));
  const proof = JSON.parse(
    await readFile(
      path.join(directory, `${release.assetName}.proof.json`),
      "utf8"
    )
  );
  const curation = JSON.parse(
    await readFile(
      path.join(directory, `${release.assetName}.curation.json`),
      "utf8"
    )
  );
  const expectedCuration = createCurationCandidate(
    release,
    proof.releaseEvent
  );
  if (canonicalJson(curation) !== canonicalJson(expectedCuration)) {
    throw new Error(
      `${release.pluginId}@${release.version}: curation candidate differs.`
    );
  }
  const artifact = await readFile(path.join(root, release.payload.path));
  const verified = verifyNostrReleaseProof(proof, {
    artifact,
    trustedCuratorPubkeys: new Set([curatorPubkey]),
  });
  if (
    verified.pluginId !== release.pluginId ||
    verified.version !== release.version ||
    verified.artifactSha256 !== release.payload.sha256
  ) {
    throw new Error(
      `${release.pluginId}@${release.version}: proof coordinates differ.`
    );
  }
  const bundlePath = path.join(directory, release.assetName);
  const bundle = await readFile(bundlePath);
  const sealed = parseNostrPluginBundle(bundle);
  if (
    !sealed.payload.equals(artifact) ||
    JSON.stringify(sealed.proof) !== JSON.stringify(proof)
  ) {
    throw new Error(
      `${release.pluginId}@${release.version}: offline bundle differs.`
    );
  }
  const expectedBundleSha256 = (
    await readFile(`${bundlePath}.sha256`, "utf8")
  ).split(/\s+/)[0];
  const actualBundleSha256 = createHash("sha256").update(bundle).digest("hex");
  if (expectedBundleSha256 !== actualBundleSha256) {
    throw new Error(`${release.assetName}: offline bundle checksum differs.`);
  }
  console.log(`Verified Nostr proof for ${release.nostr.candidateId}.`);
}
