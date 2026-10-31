import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { verifiedPublishedCoordinates } from "./lib/published-static-release.mjs";
import { dispatchStaticReleases } from "./dispatch-static-release.mjs";

const original = "a".repeat(40),
  current = "b".repeat(40);
const release = {
  repository: "lapismd/lapis-plugins",
  packageName: "@lapis-notes/history",
  pluginId: "history",
  version: "0.2.0",
  releaseTag: "history@0.2.0",
  assetName: "history-0.2.0.lapis-plugin",
  sourceCommit: current,
  trust: "static-ed25519",
};

async function fixture(options = {}) {
  const { createHash, sign } = await import("node:crypto");
  const { zipSync, strToU8 } = await import("fflate");
  const { canonicalJson } = await import("./plugin-release.mjs");
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const data = {
    "main.mjs": "export default {};",
    "manifest.json": JSON.stringify({ id: "history", version: "0.2.0" }),
    "styles.css": "",
  };
  const files = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, text]) => ({
      path,
      sha256: createHash("sha256").update(text).digest("hex"),
      size: Buffer.byteLength(text),
    }));
  const signed = {
    type: "lapis.plugin.release",
    schemaVersion: 1,
    channel: "official",
    pluginId: "history",
    version: "0.2.0",
    source: { commit: original, package: "@lapis-notes/history" },
    runtime: { entries: { workspace: { path: "main.mjs", format: "esm" } } },
    files,
  };
  const envelope = {
    signed,
    signatures: [
      {
        keyId: "test",
        alg: "ed25519",
        sig: sign(
          null,
          Buffer.from(canonicalJson(signed)),
          privateKey,
        ).toString("base64"),
      },
    ],
  };
  if (options.invalidSignature)
    envelope.signatures[0].sig = Buffer.alloc(64).toString("base64");
  const zip = zipSync({
    "release.signed.json": [strToU8(JSON.stringify(envelope)), { level: 0 }],
    ...Object.fromEntries(files.map((f) => [f.path, strToU8(data[f.path])])),
  });
  const checksum = `${options.badChecksum ? "0".repeat(64) : createHash("sha256").update(zip).digest("hex")}  ${release.assetName}\n`;
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, opts });
    if (opts.method === "POST") return new Response(null, { status: 204 });
    if (url.includes("/releases/tags/"))
      return Response.json({
        draft: false,
        assets: [
          {
            name: release.assetName,
            size: zip.length,
            browser_download_url: "https://github.com/archive",
          },
          {
            name: `${release.assetName}.sha256`,
            size: Buffer.byteLength(checksum),
            browser_download_url: "https://github.com/checksum",
          },
        ],
      });
    if (url.includes("/git/ref/"))
      return Response.json({ object: { type: "tag", sha: "c".repeat(40) } });
    if (url.includes("/git/tags/"))
      return Response.json({
        object: { type: "commit", sha: options.wrongTag ? current : original },
      });
    if (url.endsWith("/archive")) return new Response(zip);
    if (url.endsWith("/checksum")) return new Response(checksum);
    throw new Error(`Unexpected URL: ${url}`);
  };
  const keys = {
    test: publicKey
      .export({ format: "der", type: "spki" })
      .subarray(-32)
      .toString("base64"),
  };
  return { fetchImpl, keys, calls };
}

test("retained published archive dispatches its original signed source, not the rerun commit", async () => {
  const f = await fixture();
  const value = await verifiedPublishedCoordinates(release, f);
  assert.equal(value.sourceCommit, original);
  assert.equal(release.sourceCommit, current);
  await dispatchStaticReleases({
    plan: { production: true, releases: [release] },
    selectors: ["history"],
    approved: true,
    token: "registry-test",
    resolve: (selected) => verifiedPublishedCoordinates(selected, f),
    fetchImpl: f.fetchImpl,
  });
  const body = JSON.parse(
    f.calls.find((c) => c.opts.method === "POST").opts.body,
  );
  assert.equal(body.client_payload.source_commit, original);
  assert.equal(body.client_payload.package_name, "@lapis-notes/history");
});

test("published verification rejects invalid signature, checksum, tag and package coordinates", async () => {
  for (const [options, pattern] of [
    [{ invalidSignature: true }, /signature/],
    [{ badChecksum: true }, /checksum/],
    [{ wrongTag: true }, /source|tag/],
  ]) {
    const f = await fixture(options);
    await assert.rejects(verifiedPublishedCoordinates(release, f), pattern);
  }
  const f = await fixture();
  await assert.rejects(
    verifiedPublishedCoordinates(
      { ...release, packageName: "@lapis-notes/other" },
      f,
    ),
    /coordinates/,
  );
  await assert.rejects(verifiedPublishedCoordinates({ ...release, pluginId: "other" }, f), /coordinates/);
  await assert.rejects(verifiedPublishedCoordinates({ ...release, version: "0.2.1" }, f), /coordinates/);
});

test("dispatch gates and failed remote verification prevent registry side effects", async () => {
  let sent = 0;
  const settings = {
    plan: { production: true, releases: [release] },
    selectors: ["history"],
    approved: true,
    token: "test",
    fetchImpl: async () => {
      sent++;
      return new Response(null, { status: 204 });
    },
    resolve: async () => {
      throw new Error("invalid artifact");
    },
  };
  await assert.rejects(dispatchStaticReleases(settings), /invalid artifact/);
  await assert.rejects(
    dispatchStaticReleases({ ...settings, approved: false }),
    /gate/,
  );
  assert.equal(sent, 0);
});
