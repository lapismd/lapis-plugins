#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginPackages } from "./package-catalog.mjs";
import { parseOptions, selectReleases } from "./publish-approved-release.mjs";
import { prepareStaticReleaseCandidate } from "./lib/static-release-candidate.mjs";
import { assertStaticReleaseKey } from "./lib/static-release-trust.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const production = process.argv.includes("--production");
const options = parseOptions(
  process.argv.slice(2).filter((argument) => argument !== "--production")
);
const selected = selectReleases(
  pluginPackages.map((plugin) => ({
    ...plugin,
    releaseTag: `${plugin.directory}@candidate`,
  })),
  options.selectors
);
const npmEntries = JSON.parse(
  await readFile(path.join(root, ".release/npm/manifest.json"), "utf8")
);
const sourceCommit = process.env.GITHUB_SHA ?? process.env.LAPIS_SOURCE_COMMIT;
if (!/^[0-9a-f]{40}$/u.test(sourceCommit ?? ""))
  throw new Error("A full source commit is required.");
if (
  !process.env.LAPIS_PLUGIN_RELEASE_PRIVATE_KEY_FILE ||
  !process.env.LAPIS_PLUGIN_RELEASE_KEY_ID
)
  throw new Error("Static candidate signing key configuration is missing.");
if (production)
  assertStaticReleaseKey(
    process.env.LAPIS_PLUGIN_RELEASE_KEY_ID,
    await readFile(process.env.LAPIS_PLUGIN_RELEASE_PRIVATE_KEY_FILE, "utf8")
  );
const releases = [];
for (const plugin of selected)
  releases.push(
    await prepareStaticReleaseCandidate({
      root,
      plugin,
      npmArtifact: npmEntries.find(
        (entry) => entry.packageName === plugin.packageName
      ),
      sourceCommit,
      privateKeyFile: process.env.LAPIS_PLUGIN_RELEASE_PRIVATE_KEY_FILE,
      keyId: process.env.LAPIS_PLUGIN_RELEASE_KEY_ID,
    })
  );
await writeFile(
  path.join(root, ".release/release-plan.json"),
  `${JSON.stringify(
    { schemaVersion: 1, production, generatedFrom: sourceCommit, releases },
    null,
    2
  )}\n`
);
console.log(`Prepared ${releases.length} verified static release coordinates.`);
