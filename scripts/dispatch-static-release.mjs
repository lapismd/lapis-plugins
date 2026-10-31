#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseOptions, selectReleases } from "./publish-approved-release.mjs";
import { verifiedPublishedCoordinates } from "./lib/published-static-release.mjs";

export async function dispatchStaticReleases({
  plan,
  selectors,
  approved,
  token,
  fetchImpl = fetch,
  resolve = verifiedPublishedCoordinates,
}) {
  if (!plan.production || !approved || !token)
    throw new Error("Static registry publication gate is closed.");
  const published = [];
  // Verify every selected published asset before sending any registry request.
  for (const release of selectReleases(plan.releases, selectors)) {
    if (release.trust !== "static-ed25519")
      throw new Error("Expected a static release plan.");
    published.push(await resolve(release));
  }
  for (const release of published) {
    const response = await fetchImpl(
      "https://api.github.com/repos/lapismd/plugin-registry/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "plugin_release",
          client_payload: {
            repository: release.repository,
            package_name: release.packageName,
            plugin_id: release.pluginId,
            version: release.version,
            release_tag: release.releaseTag,
            asset_name: release.assetName,
            source_commit: release.sourceCommit,
          },
        }),
      },
    );
    if (!response.ok)
      throw new Error(`Static registry dispatch failed: ${response.status}`);
  }
  return published;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const plan = JSON.parse(
    await readFile(
      new URL("../.release/release-plan.json", import.meta.url),
      "utf8",
    ),
  );
  await dispatchStaticReleases({
    plan,
    selectors: options.selectors,
    approved: process.env.LAPIS_PUBLICATION_APPROVED === "true",
    token: process.env.REGISTRY_GITHUB_TOKEN,
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
