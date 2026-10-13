import { generateKeyPairSync, sign } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeRegistryCatalogDetail,
  normalizeRegistryCatalogEntry,
  normalizeRegistryCatalogIndex,
} from "@lapis-notes/api/registry/schema";
import { pluginPackages } from "./package-catalog.mjs";
import { canonicalJson } from "./plugin-release.mjs";
import { prepareStaticReleaseCandidate } from "./lib/static-release-candidate.mjs";
import { resolveSourceCommit } from "./lib/source-commit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(
  root,
  process.argv[2] ?? ".release/registry-acceptance",
);
const sourceCommit = await resolveSourceCommit({ cwd: root });
const generatedAt = new Date().toISOString();
const artifactOrigin = "https://registry.local.lapis.md";
const registryKey = generateKeyPairSync("ed25519");
const releaseKey = generateKeyPairSync("ed25519");
const privateKeyFile = path.join(out, ".ephemeral-release-key.pem");
await mkdir(path.join(out, "v2", "plugins"), { recursive: true });
await mkdir(path.join(out, "v2", "bundles"), { recursive: true });
const npmEntries = JSON.parse(
  await readFile(path.join(root, ".release/npm/manifest.json"), "utf8"),
);
await writeFile(
  privateKeyFile,
  releaseKey.privateKey.export({ type: "pkcs8", format: "pem" }),
  { mode: 0o600 },
);
const plugins = [];
const releases = [];
try {
  for (const plugin of pluginPackages) {
    const packageRoot = path.join(root, "packages", plugin.directory);
    const manifest = JSON.parse(
      await readFile(path.join(packageRoot, "manifest.json"), "utf8"),
    );
    const metadata = JSON.parse(
      await readFile(path.join(packageRoot, "registry.json"), "utf8"),
    );
    const candidate = await prepareStaticReleaseCandidate({
      root,
      plugin,
      sourceCommit,
      privateKeyFile,
      keyId: "lapis-ci-release",
      npmArtifact: npmEntries.find(
        (entry) => entry.packageName === plugin.packageName,
      ),
    });
    releases.push(candidate);
    const archivePath = `v2/bundles/${candidate.assetName}`;
    await copyFile(
      path.resolve(root, candidate.bundle.path),
      path.join(out, archivePath),
    );
    const platforms = manifest.isDesktopOnly ? ["desktop"] : ["web", "desktop"];
    const detail = normalizeRegistryCatalogDetail({
      schemaVersion: 2,
      id: plugin.pluginId,
      name: manifest.name,
      description: manifest.description,
      author: manifest.author,
      authorUrl: manifest.authorUrl,
      channel: "official",
      status: "active",
      owner: { name: "Lapis Notes", verified: true },
      latestVersion: manifest.version,
      highlights: metadata.highlights,
      appearance: metadata.appearance,
      versions: {
        [manifest.version]: {
          version: manifest.version,
          minAppVersion: manifest.minAppVersion,
          platforms,
          releasedAt: generatedAt,
          changelog: candidate.changelog,
          bundle: {
            url: `${artifactOrigin}/${archivePath}`,
            sha256: candidate.bundle.sha256,
            size: candidate.bundle.size,
          },
        },
      },
    });
    plugins.push(
      normalizeRegistryCatalogEntry({
        ...detail,
        detail: `plugins/${plugin.pluginId}.json`,
        categories: metadata.categories,
        minAppVersion: manifest.minAppVersion,
        platforms,
      }),
    );
    await writeSigned(
      path.join(out, "v2", "plugins", `${plugin.pluginId}.json`),
      detail,
    );
  }
  await writeSigned(
    path.join(out, "v2", "index.json"),
    normalizeRegistryCatalogIndex({ schemaVersion: 2, generatedAt, plugins }),
  );
  await writeSigned(path.join(out, "v2", "revoked.json"), {
    schemaVersion: 1,
    generatedAt,
    revoked: [],
  });
  const trustedKeys = [
    ["lapis-ci-registry", registryKey],
    ["lapis-ci-release", releaseKey],
  ].map(([keyId, key]) => ({
    keyId,
    alg: "ed25519",
    publicKey: key.publicKey
      .export({ type: "spki", format: "der" })
      .subarray(-32)
      .toString("base64"),
    trustTier: "official",
  }));
  await writeFile(
    path.join(out, "fixture.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        sourceCommit,
        artifactOrigin,
        trustedKeys,
        pluginCount: plugins.length,
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    path.join(root, ".release/release-plan.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        production: false,
        generatedFrom: sourceCommit,
        releases,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Prepared ${plugins.length} test-signed registry releases from ${sourceCommit}.`,
  );
} finally {
  await rm(privateKeyFile, { force: true });
}

async function writeSigned(file, value) {
  const clean = JSON.parse(JSON.stringify(value));
  const signature = sign(
    null,
    Buffer.from(canonicalJson(clean)),
    registryKey.privateKey,
  ).toString("base64");
  await writeFile(
    file,
    JSON.stringify(
      {
        ...clean,
        signatures: [
          { keyId: "lapis-ci-registry", alg: "ed25519", sig: signature },
        ],
      },
      null,
      2,
    ) + "\n",
  );
}
