#!/usr/bin/env node
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { pluginPackages } from "./package-catalog.mjs";
import {
  npmErrorCode,
  parseOptions,
  selectReleases,
} from "./publish-approved-release.mjs";

const execFileAsync = promisify(execFile);
export const expectedPublisher = {
  repository: "lapismd/lapis-plugins",
  file: "release.yml",
  environment: "first-publication",
};

// npm 11 prints consecutive JSON objects when a package has multiple connections.
export function parseTrustConfigurations(source) {
  const configurations = [];
  let start = 0;
  while (start < source.length) {
    while (/\s/.test(source[start] ?? "") && start < source.length) start++;
    if (start === source.length) break;
    if (!"[{".includes(source[start]))
      throw new Error("Invalid npm trust JSON.");
    let depth = 0;
    let quoted = false;
    let escaped = false;
    let end = start;
    for (; end < source.length; end++) {
      const char = source[end];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if ("[{".includes(char)) depth++;
      else if ("]}".includes(char) && --depth === 0) {
        end++;
        break;
      }
    }
    const value = JSON.parse(source.slice(start, end));
    const values = Array.isArray(value) ? value : [value];
    if (
      values.some(
        (item) => !item || typeof item !== "object" || Array.isArray(item),
      )
    )
      throw new Error("Invalid npm trust configuration.");
    configurations.push(...values);
    start = end;
  }
  return configurations;
}

export function matchingPublisher(configurations) {
  return configurations.find((configuration) => {
    const claims = configuration.claims ?? configuration;
    return (
      configuration.type === "github" &&
      claims.repository === expectedPublisher.repository &&
      (claims.workflow_ref?.file ?? claims.file) === expectedPublisher.file &&
      claims.environment === expectedPublisher.environment &&
      Array.isArray(configuration.permissions) &&
      configuration.permissions.includes("createPackage") &&
      configuration.status?.toLowerCase() !== "expired" &&
      configuration.expired !== true
    );
  });
}

export async function checkTrustedPublishers(
  packages,
  {
    readTrust = async (packageName) => {
      const { stdout } = await execFileAsync(
        "npm",
        [
          "trust",
          "list",
          packageName,
          "--json",
          "--registry=https://registry.npmjs.org/",
        ],
        { maxBuffer: 1024 * 1024 },
      );
      return parseTrustConfigurations(stdout);
    },
    log = console.log,
  } = {},
) {
  const failures = [];
  for (const { packageName } of packages) {
    try {
      if (!matchingPublisher(await readTrust(packageName))) {
        failures.push(
          `${packageName}: no matching, unexpired GitHub connection with npm publish permission`,
        );
        continue;
      }
      log(
        `${packageName}: publisher tuple and direct-publish permission match.`,
      );
    } catch (error) {
      failures.push(
        `${packageName}: npm trust inspection failed [${npmErrorCode(error)}]; authenticate interactively with npm trust list first`,
      );
    }
  }
  if (failures.length) throw new Error(failures.join("\n"));
  log(
    "Operator configuration check only: npm CLI may omit activation/expiry status. Confirm status on npmjs.com; only a real trusted publish validates OIDC. New connections must publish successfully within two days.",
  );
}

export async function main(args) {
  const options = parseOptions(args);
  if (options.replaceGithubAssets)
    throw new Error("Asset replacement is not an operator preflight option.");
  const packages = selectReleases(
    pluginPackages.map((plugin) => ({
      ...plugin,
      releaseTag: `${plugin.directory}@preflight`,
    })),
    options.selectors,
  );
  await checkTrustedPublishers(packages);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
