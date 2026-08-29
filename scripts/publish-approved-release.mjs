#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main(process.argv.slice(2));
}

export async function main(args) {
  const options = parseOptions(args);
  requireApproval();
  const plan = JSON.parse(
    await readFile(path.join(root, ".release/release-plan.json"), "utf8")
  );
  if (!plan.production) {
    throw new Error("Refusing to publish a non-production release plan.");
  }
  const releases = selectReleases(plan.releases, options.selectors);

  for (const release of releases) {
    await publishNpm(release);
    await publishGitHubRelease(release, options);
    await dispatchRegistry(release);
    console.log(
      `Published and dispatched ${release.packageName}@${release.version}.`
    );
  }
}

function requireApproval() {
  if (
    process.env.LAPIS_PUBLICATION_APPROVED !== "true" ||
    process.env.FIRST_PUBLICATION_APPROVED !== "true"
  ) {
    throw new Error("The explicit first-publication approval gate is closed.");
  }
  for (const name of ["GITHUB_TOKEN", "REGISTRY_GITHUB_TOKEN"]) {
    if (!process.env[name]) throw new Error(`${name} is required.`);
  }
}

async function publishNpm(release) {
  const tarball = path.join(root, release.npm.path);
  const bytes = await readFile(tarball);
  const expectedIntegrity = `sha512-${createHash("sha512")
    .update(bytes)
    .digest("base64")}`;
  const existing = await npmIntegrity(release);
  if (existing) {
    if (existing !== expectedIntegrity) {
      throw new Error(
        `${release.packageName}@${release.version} exists with different npm integrity.`
      );
    }
    console.log(
      `${release.packageName}@${release.version} already matches npm.`
    );
    return;
  }
  await execFileAsync(
    "npm",
    ["publish", tarball, "--access", "public", "--provenance"],
    { cwd: root, env: process.env, maxBuffer: 20 * 1024 * 1024 }
  );
}

async function npmIntegrity(release) {
  try {
    const { stdout } = await execFileAsync(
      "npm",
      [
        "view",
        `${release.packageName}@${release.version}`,
        "dist.integrity",
        "--json",
      ],
      { cwd: root, env: process.env }
    );
    return JSON.parse(stdout);
  } catch (error) {
    if (error?.code === 1) return undefined;
    throw error;
  }
}

async function publishGitHubRelease(release, options) {
  const archive = path.join(root, release.archive.path);
  const checksum = path.join(root, release.archive.checksumPath);
  const exists = await commandSucceeds("gh", [
    "release",
    "view",
    release.releaseTag,
  ]);
  if (!exists) {
    await execFileAsync(
      "gh",
      [
        "release",
        "create",
        release.releaseTag,
        archive,
        checksum,
        "--target",
        release.sourceCommit,
        "--title",
        `${release.packageName}@${release.version}`,
        "--notes",
        `First-party Lapis plugin ${release.pluginId} ${release.version}.`,
      ],
      { cwd: root, env: process.env, maxBuffer: 20 * 1024 * 1024 }
    );
    return;
  }

  if (options.replaceGithubAssets) {
    await assertRegistryDoesNotContainRelease(release);
    await execFileAsync(
      "gh",
      ["release", "upload", release.releaseTag, archive, checksum, "--clobber"],
      { cwd: root, env: process.env, maxBuffer: 20 * 1024 * 1024 }
    );
  }

  await verifyGitHubReleaseAssets(release, archive, checksum);
}

async function verifyGitHubReleaseAssets(release, archive, checksum) {
  const directory = await mkdtemp(path.join(tmpdir(), "lapis-release-assets-"));
  try {
    await execFileAsync(
      "gh",
      ["release", "download", release.releaseTag, "--dir", directory],
      { cwd: root, env: process.env, maxBuffer: 20 * 1024 * 1024 }
    );
    for (const expected of [archive, checksum]) {
      const remote = path.join(directory, path.basename(expected));
      const [expectedBytes, remoteBytes] = await Promise.all([
        readFile(expected),
        readFile(remote),
      ]);
      if (!expectedBytes.equals(remoteBytes)) {
        throw new Error(
          `${release.releaseTag} has a different ${path.basename(
            expected
          )} asset.`
        );
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function assertRegistryDoesNotContainRelease(
  release,
  {
    fetchImpl = fetch,
    baseUrl = process.env.LAPIS_REGISTRY_SOURCE_BASE_URL ??
      "https://raw.githubusercontent.com/lapismd/plugin-registry/main/generated/v1/plugins",
  } = {}
) {
  const response = await fetchImpl(
    `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(
      release.pluginId
    )}.json`,
    { headers: { Accept: "application/json" } }
  );
  if (response.status === 404) return;
  if (!response.ok) {
    throw new Error(
      `Cannot verify registry replacement safety for ${release.pluginId}: ${response.status}.`
    );
  }
  const detail = await response.json();
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    throw new Error(
      `Cannot verify registry replacement safety for ${release.pluginId}: invalid detail metadata.`
    );
  }
  if (
    detail.versions &&
    typeof detail.versions === "object" &&
    Object.hasOwn(detail.versions, release.version)
  ) {
    throw new Error(
      `${release.pluginId}@${release.version} is already registry-published; publish a fixed patch instead of replacing its GitHub assets.`
    );
  }
}

async function dispatchRegistry(release) {
  const repository =
    process.env.LAPIS_REGISTRY_REPOSITORY ?? "lapismd/plugin-registry";
  const response = await fetch(
    `https://api.github.com/repos/${repository}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.REGISTRY_GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
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
  if (!response.ok) {
    throw new Error(
      `Registry dispatch failed: ${response.status} ${await response.text()}`
    );
  }
}

async function commandSucceeds(command, args) {
  try {
    await execFileAsync(command, args, { cwd: root, env: process.env });
    return true;
  } catch (error) {
    if (error?.code === 1) return false;
    throw error;
  }
}

export function parseOptions(args) {
  const selectors = [];
  const options = {
    pluginsExplicit: false,
    replaceGithubAssets: false,
    selectors,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--plugin" || arg === "--plugins") {
      const value = args[++index];
      if (!value) throw new Error(`${arg} requires a value.`);
      selectors.push(
        ...value
          .split(",")
          .map((selector) => selector.trim())
          .filter(Boolean)
      );
      options.pluginsExplicit = true;
    } else if (arg === "--replace-github-assets") {
      options.replaceGithubAssets = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!selectors.length) selectors.push("all");
  if (selectors.includes("all") && selectors.length !== 1) {
    throw new Error("Select all or explicit plugins, not both.");
  }
  if (options.replaceGithubAssets && !options.pluginsExplicit) {
    throw new Error(
      "--replace-github-assets requires an explicit --plugins selection."
    );
  }
  return options;
}

export function selectReleases(releases, selectors) {
  if (selectors.length === 1 && selectors[0] === "all") return releases;
  const selected = new Set();
  for (const selector of selectors) {
    const match = releases.find((release) =>
      [
        release.packageName,
        release.pluginId,
        release.releaseTag.split("@")[0],
      ].includes(selector)
    );
    if (!match) throw new Error(`No release matches ${selector}.`);
    selected.add(match);
  }
  return releases.filter((release) => selected.has(release));
}
