import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { assertSafePluginRelativePath } from "./lib/plugin-bundle.mjs";
import { verifyPluginBundle } from "./lib/verify-plugin-release.mjs";
import {
  buildSignedPluginBundle,
  generateTestEd25519KeyPair,
  packageOfficialPlugin,
  signReleaseManifest,
} from "./plugin-release.mjs";

test("rejects unsafe plugin archive paths", () => {
  assert.throws(
    () => assertSafePluginRelativePath("../main.mjs"),
    /Unsafe plugin file path/,
  );
  assert.throws(
    () => assertSafePluginRelativePath("assets\\main.mjs"),
    /Unsafe plugin file path/,
  );
});

test("rejects files added after the release manifest is signed", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-plugin-contract-"));
  const input = path.join(root, "input");
  const out = path.join(root, "out");
  await mkdir(input, { recursive: true });
  await writeFile(
    path.join(input, "manifest.json"),
    JSON.stringify({
      id: "contract-test",
      name: "Contract Test",
      version: "0.1.0",
      minAppVersion: "0.1.0",
      lapis: {
        manifestVersion: 1,
        runtime: {
          entries: {
            workspace: { path: "main.mjs", format: "esm" },
          },
        },
      },
    }),
  );
  await writeFile(path.join(input, "main.mjs"), "export default class TestPlugin {}\n");
  await writeFile(path.join(input, "styles.css"), "");

  const release = await packageOfficialPlugin({
    pluginId: "contract-test",
    version: "0.1.0",
    inputDir: input,
    outDir: out,
  });
  const keys = generateTestEd25519KeyPair();
  const privateKeyFile = path.join(root, "private.pem");
  const signedReleasePath = path.join(release.releaseDir, "release.signed.json");
  await writeFile(privateKeyFile, keys.privateKey, { mode: 0o600 });
  await signReleaseManifest({
    input: release.releasePath,
    out: signedReleasePath,
    keyId: "test-only",
    privateKeyFile,
  });
  await writeFile(path.join(release.releaseDir, "files/unsigned.txt"), "unsigned");
  const bundle = await buildSignedPluginBundle({
    pluginId: "contract-test",
    version: "0.1.0",
    releaseDir: release.releaseDir,
    signedReleasePath,
  });
  const bundleBytes = await readFile(bundle.bundlePath);

  assert.throws(
    () =>
      verifyPluginBundle({
        bundleBytes,
        publicKey: keys.publicKey,
      }),
    /unsigned or missing files/,
  );
  await rm(root, { recursive: true, force: true });
});
