#!/usr/bin/env node
import { pluginPackages, pluginPackageBySelector } from "./package-catalog.mjs";

export function metadataDispatchPayload(plugin, sourceCommit) {
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) {
    throw new Error("Metadata dispatch requires a full Git source commit ID.");
  }
  return {
    event_type: "plugin_metadata",
    client_payload: {
      repository: "lapismd/lapis-plugins",
      package_name: plugin.packageName,
      plugin_id: plugin.pluginId,
      source_commit: sourceCommit,
    },
  };
}

export function selectPlugins(selector) {
  if (selector === "all") return pluginPackages;
  const plugin = pluginPackageBySelector(selector);
  if (!plugin) throw new Error(`Unknown plugin selector: ${selector}.`);
  return [plugin];
}

export async function dispatchPluginMetadata({
  selector = "all",
  sourceCommit,
  token,
  registryRepository = "lapismd/plugin-registry",
  fetchImpl = fetch,
  dryRun = false,
}) {
  const payloads = selectPlugins(selector).map((plugin) =>
    metadataDispatchPayload(plugin, sourceCommit),
  );
  if (dryRun) return payloads;
  if (!token) throw new Error("REGISTRY_GITHUB_TOKEN is required.");
  for (const payload of payloads) {
    const response = await fetchImpl(
      `https://api.github.com/repos/${registryRepository}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      throw new Error(
        `Registry metadata dispatch failed for ${payload.client_payload.plugin_id}: ${response.status} ${await response.text()}`,
      );
    }
  }
  return payloads;
}

function parseArgs(args) {
  const options = { selector: "all", dryRun: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--plugin") options.selector = args[++index];
    else if (arg === "--source-commit") options.sourceCommit = args[++index];
    else if (arg === "--dry-run") options.dryRun = true;
    else throw new Error(`Unknown option: ${arg}.`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const payloads = await dispatchPluginMetadata({
    ...options,
    sourceCommit:
      options.sourceCommit ??
      process.env.LAPIS_SOURCE_COMMIT ??
      process.env.GITHUB_SHA ??
      "",
    token: process.env.REGISTRY_GITHUB_TOKEN,
    registryRepository:
      process.env.LAPIS_REGISTRY_REPOSITORY ?? "lapismd/plugin-registry",
  });
  console.log(JSON.stringify(payloads, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
