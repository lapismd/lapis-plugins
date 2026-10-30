#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseOptions, selectReleases } from "./publish-approved-release.mjs";
const options = parseOptions(process.argv.slice(2));
const plan = JSON.parse(
  await readFile(
    new URL("../.release/release-plan.json", import.meta.url),
    "utf8"
  )
);
if (
  !plan.production ||
  process.env.LAPIS_PUBLICATION_APPROVED !== "true" ||
  !process.env.REGISTRY_GITHUB_TOKEN
)
  throw new Error("Static registry publication gate is closed.");
for (const release of selectReleases(plan.releases, options.selectors)) {
  if (release.trust !== "static-ed25519")
    throw new Error("Expected a static release plan.");
  const response = await fetch(
    "https://api.github.com/repos/lapismd/plugin-registry/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REGISTRY_GITHUB_TOKEN}`,
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
    }
  );
  if (!response.ok)
    throw new Error(`Static registry dispatch failed: ${response.status}`);
}
