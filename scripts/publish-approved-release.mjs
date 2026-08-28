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
const options = parseOptions(process.argv.slice(2));
requireApproval();
const plan = JSON.parse(
  await readFile(path.join(root, ".release/release-plan.json"), "utf8"),
);
if (!plan.production) throw new Error("Refusing to publish a non-production release plan.");
const releases = options.plugin === "all"
  ? plan.releases
  : plan.releases.filter((release) =>
      [release.packageName, release.pluginId, release.releaseTag.split("@")[0]].includes(options.plugin),
    );
if (!releases.length) throw new Error(`No release matches ${options.plugin}.`);

for (const release of releases) {
  await publishNpm(release);
  await publishGitHubRelease(release);
  await dispatchRegistry(release);
  console.log(`Published and dispatched ${release.packageName}@${release.version}.`);
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
  const expectedIntegrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  const existing = await npmIntegrity(release);
  if (existing) {
    if (existing !== expectedIntegrity) {
      throw new Error(`${release.packageName}@${release.version} exists with different npm integrity.`);
    }
    console.log(`${release.packageName}@${release.version} already matches npm.`);
    return;
  }
  await execFileAsync(
    "npm",
    ["publish", tarball, "--access", "public", "--provenance"],
    { cwd: root, env: process.env, maxBuffer: 20 * 1024 * 1024 },
  );
}

async function npmIntegrity(release) {
  try {
    const { stdout } = await execFileAsync(
      "npm",
      ["view", `${release.packageName}@${release.version}`, "dist.integrity", "--json"],
      { cwd: root, env: process.env },
    );
    return JSON.parse(stdout);
  } catch (error) {
    if (error?.code === 1) return undefined;
    throw error;
  }
}

async function publishGitHubRelease(release) {
  const archive = path.join(root, release.archive.path);
  const checksum = path.join(root, release.archive.checksumPath);
  const exists = await commandSucceeds("gh", ["release", "view", release.releaseTag]);
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
      { cwd: root, env: process.env, maxBuffer: 20 * 1024 * 1024 },
    );
    return;
  }

  const directory = await mkdtemp(path.join(tmpdir(), "lapis-release-assets-"));
  try {
    await execFileAsync(
      "gh",
      ["release", "download", release.releaseTag, "--dir", directory],
      { cwd: root, env: process.env, maxBuffer: 20 * 1024 * 1024 },
    );
    for (const expected of [archive, checksum]) {
      const remote = path.join(directory, path.basename(expected));
      const [expectedBytes, remoteBytes] = await Promise.all([
        readFile(expected),
        readFile(remote),
      ]);
      if (!expectedBytes.equals(remoteBytes)) {
        throw new Error(`${release.releaseTag} has a different ${path.basename(expected)} asset.`);
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function dispatchRegistry(release) {
  const repository = process.env.LAPIS_REGISTRY_REPOSITORY ?? "lapismd/plugin-registry";
  const response = await fetch(`https://api.github.com/repos/${repository}/dispatches`, {
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
  });
  if (!response.ok) {
    throw new Error(`Registry dispatch failed: ${response.status} ${await response.text()}`);
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

function parseOptions(args) {
  const options = { plugin: "all" };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--plugin") options.plugin = args[++index];
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}
