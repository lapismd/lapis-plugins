import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  canonicalJson,
  createNip29ReleaseMessageTemplate,
} from "@lapismd/lapis-community/protocol";

const textEncoder = new TextEncoder();

export async function createNostrReleaseCandidate(options) {
  const release = options.release;
  const packageRoot = options.packageRoot;
  const releasedAt = required(options.releasedAt, "releasedAt");
  const createdAt = Math.floor(new Date(releasedAt).valueOf() / 1_000);
  if (!Number.isSafeInteger(createdAt) || createdAt < 0) {
    throw new Error(`Invalid release timestamp: ${releasedAt}`);
  }

  const [manifest, packageJson, registry, lapisRelease] = await Promise.all([
    json(path.join(packageRoot, "manifest.json")),
    json(path.join(packageRoot, "package.json")),
    json(path.join(packageRoot, "registry.json")),
    json(path.resolve(options.releaseManifestPath)),
  ]);
  const sourceCommit = required(lapisRelease.source?.commit, "source commit");
  const repository = required(options.repository, "repository");
  const releaseTag = required(release.releaseTag, "release tag");
  const payloadName = required(release.payloadName, "payload name");
  const releaseBase = `https://github.com/${repository}/releases/download/${encodeURIComponent(
    releaseTag
  )}/`;
  const artifactUrl = new URL(payloadName, releaseBase).toString();
  const manifestName = `${payloadName}.manifest.json`;
  const manifestUrl = new URL(manifestName, releaseBase).toString();
  const platforms = lapisRelease.compatibility.platforms;
  const ownerUrl = repositoryUrl(packageJson.repository);
  const owner = {
    name: manifest.author,
    verified: true,
    ...(ownerUrl ? { url: ownerUrl } : {}),
  };
  const contributes = isObject(manifest.contributes)
    ? manifest.contributes
    : {};

  const nostrManifest = {
    schema: "lapis.registry.nip29-release/1",
    plugin: {
      schema: "lapis.registry.plugin/1",
      pluginId: manifest.id,
      name: manifest.name,
      description: manifest.description,
      channel: "official",
      status: "active",
      index: {
        schemaVersion: 1,
        author: manifest.author,
        ...(manifest.authorUrl ? { authorUrl: manifest.authorUrl } : {}),
        ...(manifest.authorAvatarUrl
          ? { authorAvatarUrl: manifest.authorAvatarUrl }
          : {}),
        minAppVersion: manifest.minAppVersion,
        platforms,
        categories: registry.categories,
        highlights: registry.highlights,
        badges: ["official", "verified"],
        owner,
        contributes,
        source: repository,
      },
      detail: {
        schemaVersion: 1,
        author: manifest.author,
        ...(manifest.authorUrl ? { authorUrl: manifest.authorUrl } : {}),
        ...(manifest.authorAvatarUrl
          ? { authorAvatarUrl: manifest.authorAvatarUrl }
          : {}),
        owner,
        ...(packageJson.license ? { license: packageJson.license } : {}),
        links: links(packageJson, registry),
        highlights: registry.highlights,
        contributes,
        manifest,
        registry,
        sourceDirectory: `packages/${options.directory}`,
        sourceCommit,
      },
    },
    release: {
      schema: "lapis.registry.release/1",
      pluginId: manifest.id,
      version: manifest.version,
      minAppVersion: manifest.minAppVersion,
      platforms,
      releasedAt,
      artifact: {
        url: artifactUrl,
        downloadUrl: artifactUrl,
        sha256: release.payload.sha256,
        size: release.payload.size,
      },
      metadata: {
        lapisRelease,
        packageName: packageJson.name,
        sourceCommit,
        sourceRepository: repository,
      },
    },
  };
  const manifestContent = `${canonicalJson(nostrManifest)}\n`;
  const manifestBytes = textEncoder.encode(manifestContent);
  const manifestSha256 = digest(manifestBytes);
  const attachment = {
    url: manifestUrl,
    mimeType: "application/json",
    sha256: manifestSha256,
    size: manifestBytes.byteLength,
    filename: manifestName,
  };
  const candidateCoordinates = {
    pluginId: manifest.id,
    version: manifest.version,
    sourceCommit,
    artifactSha256: release.payload.sha256,
    artifactSize: release.payload.size,
    manifestSha256,
    manifestSize: manifestBytes.byteLength,
  };
  const candidateId = digest(
    textEncoder.encode(canonicalJson(candidateCoordinates))
  );
  const signingRequest = {
    schema: "lapis.registry.publisher-signing-request/1",
    purpose: "publisher-release",
    candidateId,
    repository,
    sourceCommit,
    pluginId: manifest.id,
    version: manifest.version,
    createdAt,
    attachment,
    message: `${manifest.name} ${manifest.version} is ready for curator review.`,
  };
  const expectedEventTemplate = createNip29ReleaseMessageTemplate(
    manifest.id,
    attachment,
    createdAt,
    signingRequest.message
  );

  const releaseDirectory = path.dirname(options.releaseManifestPath);
  const manifestPath = path.join(releaseDirectory, manifestName);
  const requestPath = path.join(
    releaseDirectory,
    `${payloadName}.publisher-request.json`
  );
  await Promise.all([
    writeFile(manifestPath, manifestContent),
    writeFile(requestPath, `${canonicalJson(signingRequest)}\n`),
  ]);
  return {
    candidateId,
    manifestPath,
    requestPath,
    manifestSha256,
    manifestSize: manifestBytes.byteLength,
    expectedEventTemplate,
  };
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function json(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function links(packageJson, registry) {
  return Object.fromEntries(
    Object.entries({
      homepage: packageJson.homepage,
      repository: repositoryUrl(packageJson.repository),
      documentation: registry.documentationUrl,
      issues:
        typeof packageJson.bugs === "string"
          ? packageJson.bugs
          : packageJson.bugs?.url,
    }).filter(([, value]) => typeof value === "string" && value.length > 0)
  );
}

function repositoryUrl(value) {
  const raw = typeof value === "string" ? value : value?.url;
  return typeof raw === "string"
    ? raw.replace(/^git\+/u, "").replace(/\.git$/u, "")
    : undefined;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function required(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required`);
  }
  return value;
}
