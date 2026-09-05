import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildNostrPluginBundle,
  buildPluginPayload,
  generateTestEd25519KeyPair,
  packageOfficialPlugin,
  parseArgs,
  signReleaseManifest,
  verifySignedRelease,
} from "./plugin-release.mjs";

test("packages deterministic official plugin release manifest", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-test",
    version: "1.2.3",
  });

  const first = await packageOfficialPlugin({
    pluginId: "lapis-test",
    version: "1.2.3",
    inputDir: dir.input,
    outDir: dir.out,
    packageName: "@lapis-notes/test",
    commit: "abc123",
  });
  const firstRelease = await readFile(first.releasePath, "utf8");

  const second = await packageOfficialPlugin({
    pluginId: "lapis-test",
    version: "1.2.3",
    inputDir: dir.input,
    outDir: dir.out,
    packageName: "@lapis-notes/test",
    commit: "abc123",
  });

  assert.equal(await readFile(second.releasePath, "utf8"), firstRelease);

  const manifest = JSON.parse(firstRelease);
  assert.equal(manifest.pluginId, "lapis-test");
  assert.equal(manifest.version, "1.2.3");
  assert.deepEqual(manifest.compatibility.platforms, ["web", "desktop"]);
  assert.deepEqual(
    manifest.files.map((file) => file.path),
    ["main.mjs", "manifest.json", "styles.css"]
  );
  assert.equal(
    manifest.files.some((file) => "url" in file),
    false
  );
  await rm(dir.root, { recursive: true, force: true });
});

test("uses desktop as the only native compatibility platform", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-test",
    version: "1.2.3",
    isDesktopOnly: true,
  });

  const release = await packageOfficialPlugin({
    pluginId: "lapis-test",
    version: "1.2.3",
    inputDir: dir.input,
    outDir: dir.out,
  });
  const manifest = JSON.parse(await readFile(release.releasePath, "utf8"));

  assert.deepEqual(manifest.compatibility.platforms, ["desktop"]);
  await rm(dir.root, { recursive: true, force: true });
});

test("builds deterministic rootless plugin payloads", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-test",
    version: "1.0.0",
  });
  const release = await packageOfficialPlugin({
    pluginId: "lapis-test",
    version: "1.0.0",
    inputDir: dir.input,
    outDir: dir.out,
  });
  const first = await buildPluginPayload({
    pluginId: "lapis-test",
    version: "1.0.0",
    releaseDir: release.releaseDir,
  });
  const firstBytes = await readFile(first.bundlePath);
  const second = await buildPluginPayload({
    pluginId: "lapis-test",
    version: "1.0.0",
    releaseDir: release.releaseDir,
  });

  assert.equal(first.bundle.path, "lapis-test-1.0.0.payload.zip");
  assert.deepEqual(await readFile(second.bundlePath), firstBytes);
  const entries = readZipEntries(firstBytes);
  assert.deepEqual(
    entries.map((entry) => entry.path),
    ["main.mjs", "manifest.json", "styles.css"]
  );
  assert.deepEqual(
    entries.map((entry) => entry.compressionMethod),
    [8, 8, 8]
  );
  await rm(dir.root, { recursive: true, force: true });
});

test("seals a portable Nostr proof around the exact rootless payload", async () => {
  const dir = await fixtureDir();
  const payloadPath = path.join(dir.root, "payload.zip");
  const proofPath = path.join(dir.root, "proof.json");
  await Promise.all([
    writeFile(payloadPath, "deterministic payload bytes"),
    writeFile(proofPath, '{"schema":"lapis.plugin.release-proof/1"}\n'),
  ]);

  const first = await buildNostrPluginBundle({
    pluginId: "lapis-test",
    version: "1.0.0",
    payloadPath,
    proofPath,
  });
  const firstBytes = await readFile(first.bundlePath);
  const second = await buildNostrPluginBundle({
    pluginId: "lapis-test",
    version: "1.0.0",
    payloadPath,
    proofPath,
  });

  assert.equal(first.bundle.path, "lapis-test-1.0.0.lapis-plugin");
  assert.deepEqual(await readFile(second.bundlePath), firstBytes);
  const entries = readZipEntries(firstBytes);
  assert.deepEqual(
    entries.map((entry) => entry.path),
    ["release.nostr.json", "payload.zip"]
  );
  assert.deepEqual(
    entries.map((entry) => entry.compressionMethod),
    [0, 8]
  );
  await rm(dir.root, { recursive: true, force: true });
});

test("packages signed runtime metadata from Lapis manifest entries", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-test",
    version: "1.2.3",
    lapis: {
      manifestVersion: 1,
      runtime: {
        entries: {
          workspace: {
            path: "main.mjs",
            format: "esm",
            sharedDependencies: ["@lapis-notes/api", "svelte"],
            requiresReloadOnUpdate: false,
          },
        },
        compatibilityOverrides: {
          deprecatedHostModules: {
            workspace: ["svelte/internal/client"],
          },
        },
      },
    },
  });

  const release = await packageOfficialPlugin({
    pluginId: "lapis-test",
    version: "1.2.3",
    inputDir: dir.input,
    outDir: dir.out,
  });
  const manifest = JSON.parse(await readFile(release.releasePath, "utf8"));

  assert.deepEqual(manifest.runtime, {
    entries: {
      workspace: {
        path: "main.mjs",
        format: "esm",
        sharedDependencies: ["@lapis-notes/api", "svelte"],
        requiresReloadOnUpdate: false,
      },
    },
    compatibilityOverrides: {
      deprecatedHostModules: {
        workspace: ["svelte/internal/client"],
      },
    },
  });
  await rm(dir.root, { recursive: true, force: true });
});

test("packages plugins that emit main.es.js as the ESM entry", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-test",
    version: "1.2.3",
    lapis: {
      manifestVersion: 1,
      runtime: {
        entries: {
          workspace: {
            path: "main.es.js",
            format: "esm",
          },
        },
      },
    },
  });
  await writeFile(
    path.join(dir.input, "main.es.js"),
    "export default class Test {};"
  );

  const release = await packageOfficialPlugin({
    pluginId: "lapis-test",
    version: "1.2.3",
    inputDir: dir.input,
    outDir: dir.out,
  });
  const manifest = JSON.parse(await readFile(release.releasePath, "utf8"));

  assert.equal(manifest.runtime.entries.workspace.path, "main.es.js");
  assert.equal(manifest.runtime.entries.workspace.format, "esm");
  await rm(dir.root, { recursive: true, force: true });
});

test("package fails when Lapis runtime entries reference missing files", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-test",
    version: "1.2.3",
    lapis: {
      manifestVersion: 1,
      runtime: {
        entries: {
          workspace: {
            path: "missing.mjs",
            format: "esm",
          },
        },
      },
    },
  });

  await assert.rejects(
    packageOfficialPlugin({
      pluginId: "lapis-test",
      version: "1.2.3",
      inputDir: dir.input,
      outDir: dir.out,
    }),
    /references missing file: missing\.mjs/
  );
  await rm(dir.root, { recursive: true, force: true });
});

test("package fails when official runtime metadata is missing", async () => {
  const dir = await fixtureDir();
  await writeFile(
    path.join(dir.input, "manifest.json"),
    JSON.stringify({ id: "lapis-test", version: "1.0.0" })
  );

  await assert.rejects(
    packageOfficialPlugin({
      pluginId: "lapis-test",
      version: "1.0.0",
      inputDir: dir.input,
      outDir: dir.out,
    }),
    /must declare lapis\.runtime\.entries/
  );
  await rm(dir.root, { recursive: true, force: true });
});

test("package fails when official runtime metadata declares CommonJS fallback", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-test",
    version: "1.0.0",
    lapis: {
      manifestVersion: 1,
      runtime: {
        entries: {
          workspace: {
            path: "main.mjs",
            format: "esm",
            fallbackPath: "main.js",
          },
        },
      },
    },
  });
  await writeFile(path.join(dir.input, "main.js"), "module.exports = {};");

  await assert.rejects(
    packageOfficialPlugin({
      pluginId: "lapis-test",
      version: "1.0.0",
      inputDir: dir.input,
      outDir: dir.out,
    }),
    /must not declare fallbackPath/
  );
  await rm(dir.root, { recursive: true, force: true });
});

test("package fails on manifest id or version mismatch", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-other",
    version: "1.0.0",
  });

  await assert.rejects(
    packageOfficialPlugin({
      pluginId: "lapis-test",
      version: "1.0.0",
      inputDir: dir.input,
      outDir: dir.out,
    }),
    /Manifest id mismatch/
  );
  await assert.rejects(
    packageOfficialPlugin({
      pluginId: "lapis-other",
      version: "2.0.0",
      inputDir: dir.input,
      outDir: dir.out,
    }),
    /Manifest version mismatch/
  );
  await rm(dir.root, { recursive: true, force: true });
});

test("sign writes a verifiable signed envelope", async () => {
  const dir = await fixtureDir();
  await writePluginFiles(dir.input, {
    id: "lapis-test",
    version: "1.0.0",
  });
  const release = await packageOfficialPlugin({
    pluginId: "lapis-test",
    version: "1.0.0",
    inputDir: dir.input,
    outDir: dir.out,
  });
  const { privateKey, publicKey } = generateTestEd25519KeyPair();
  const privateKeyFile = path.join(dir.root, "private.pem");
  const publicKeyFile = path.join(dir.root, "public.pem");
  await writeFile(privateKeyFile, privateKey);
  await writeFile(publicKeyFile, publicKey);

  const signedPath = path.join(release.releaseDir, "release.signed.json");
  const envelope = await signReleaseManifest({
    input: release.releasePath,
    out: signedPath,
    keyId: "test-key",
    privateKeyFile,
  });

  assert.equal(envelope.signatures[0].keyId, "test-key");
  assert.equal(
    await verifySignedRelease({ input: signedPath, publicKeyFile }),
    true
  );
  await rm(dir.root, { recursive: true, force: true });
});

test("CLI parser accepts pnpm forwarded argument separator", () => {
  assert.deepEqual(
    parseArgs([
      "package",
      "--",
      "--plugin-id",
      "lapis-docs",
      "--input",
      "dist",
    ]),
    {
      command: "package",
      options: { pluginId: "lapis-docs", input: "dist" },
    }
  );
});

async function fixtureDir() {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-plugin-release-"));
  const input = path.join(root, "input");
  const out = path.join(root, "out");
  await mkdirp(input);
  await mkdirp(out);
  return { root, input, out };
}

async function writePluginFiles(input, manifest) {
  const runtime = manifest.lapis?.runtime ?? {
    entries: {
      workspace: {
        path: "main.mjs",
        format: "esm",
      },
    },
  };
  await writeFile(
    path.join(input, "manifest.json"),
    JSON.stringify({
      name: "Test Plugin",
      minAppVersion: "0.1.0",
      author: "Lapis Notes",
      description: "Test plugin",
      lapis: {
        manifestVersion: 1,
        runtime,
      },
      ...manifest,
    })
  );
  await writeFile(
    path.join(input, "main.mjs"),
    "export default class Test {};"
  );
  await writeFile(path.join(input, "styles.css"), ".test { color: red; }");
}

async function mkdirp(dir) {
  await import("node:fs/promises").then((fs) =>
    fs.mkdir(dir, { recursive: true })
  );
}

function readZipEntries(buffer) {
  const entries = [];
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let offset = buffer.readUInt32LE(eocdOffset + 16);
  for (let index = 0; index < totalEntries; index += 1) {
    assert.equal(buffer.readUInt32LE(offset), 0x02014b50);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const path = buffer
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf8");
    assert.equal(buffer.readUInt32LE(localHeaderOffset), 0x04034b50);
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart =
      localHeaderOffset + 30 + localNameLength + localExtraLength;
    entries.push({
      path,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      data:
        compressionMethod === 0
          ? buffer.subarray(dataStart, dataStart + compressedSize)
          : undefined,
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function findEndOfCentralDirectory(buffer) {
  for (let offset = buffer.byteLength - 22; offset >= 0; offset -= 1) {
    if (
      buffer.readUInt32LE(offset) === 0x06054b50 &&
      offset + 22 + buffer.readUInt16LE(offset + 20) === buffer.byteLength
    ) {
      return offset;
    }
  }
  throw new Error("Missing ZIP end of central directory");
}
