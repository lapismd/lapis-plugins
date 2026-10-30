import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertRegistryDoesNotContainRelease,
  npmVersionAlreadyPublished,
  parseOptions,
  selectReleases,
  verifyApprovedArtifacts,
} from "./publish-approved-release.mjs";

const releases = [
  {
    packageName: "@lapis-notes/ai",
    pluginId: "ai",
    releaseTag: "ai@0.1.2",
    version: "0.1.2",
  },
  {
    packageName: "@lapis-notes/graph",
    pluginId: "lapis-graph",
    releaseTag: "graph@0.1.2",
    version: "0.1.2",
  },
];

test("parses the workflow's explicit comma-separated plugin selection", () => {
  assert.deepEqual(parseOptions(["--plugins", "ai,lapis-graph"]), {
    pluginsExplicit: true,
    replaceGithubAssets: false,
    selectors: ["ai", "lapis-graph"],
  });
  assert.deepEqual(
    selectReleases(releases, ["lapis-graph", "@lapis-notes/ai"]),
    releases
  );
});

test("rejects altered approved npm and bundle bytes before any publication", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "lapis-publication-"));
  try {
    const bytes = Buffer.from("approved");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await writeFile(path.join(directory, "npm.tgz"), bytes);
    await writeFile(path.join(directory, "plugin.lapis-plugin"), bytes);
    const release = {
      pluginId: "example",
      npm: { path: "npm.tgz", sha256, size: bytes.length },
      bundle: { path: "plugin.lapis-plugin", sha256, size: bytes.length },
    };
    await verifyApprovedArtifacts(release, directory);
    await writeFile(path.join(directory, "plugin.lapis-plugin"), "altered");
    await assert.rejects(
      verifyApprovedArtifacts(release, directory),
      /checksum or size mismatch/
    );
    await writeFile(path.join(directory, "plugin.lapis-plugin"), bytes);
    await writeFile(path.join(directory, "npm.tgz"), "altered");
    await assert.rejects(
      verifyApprovedArtifacts(release, directory),
      /checksum or size mismatch/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a duplicate npm publish is an already-published version", () => {
  assert.equal(
    npmVersionAlreadyPublished(
      new Error("npm publish failed\nnpm error code E409\npreviously published"),
    ),
    true,
  );
  assert.equal(npmVersionAlreadyPublished(new Error("network down")), false);
});

test("replacement safety checks the archived V1 and current V2 catalogs", async () => {
  const requests = [];
  await assert.rejects(
    assertRegistryDoesNotContainRelease(releases[1], {
      fetchImpl: async (url) => {
        requests.push(url);
        return url.includes("/v1/")
          ? new Response("missing", { status: 404 })
          : Response.json({ versions: { "0.1.2": {} } });
      },
    }),
    /already registry-published/
  );
  assert.equal(requests.length, 2);
  assert.match(requests[0], /\/v1\//);
  assert.match(requests[1], /\/v2\//);
});

test("replacement requires an explicit plugin selection", () => {
  assert.throws(
    () => parseOptions(["--replace-github-assets"]),
    /requires an explicit --plugins selection/
  );
  assert.equal(
    parseOptions(["--plugins", "ai", "--replace-github-assets"])
      .replaceGithubAssets,
    true
  );
});

test("rejects unknown release selectors", () => {
  assert.throws(
    () => selectReleases(releases, ["missing"]),
    /No release matches missing/
  );
});

test("same-version GitHub assets cannot replace a registry publication", async () => {
  await assert.rejects(
    assertRegistryDoesNotContainRelease(releases[1], {
      fetchImpl: async () =>
        new Response(
          JSON.stringify({ versions: { "0.1.2": { version: "0.1.2" } } }),
          { status: 200 }
        ),
    }),
    /already registry-published; publish a fixed patch/
  );
});

test("replacement remains available before a version is registry-published", async () => {
  await assert.doesNotReject(
    assertRegistryDoesNotContainRelease(releases[1], {
      fetchImpl: async () => new Response("Not found", { status: 404 }),
    })
  );
  await assert.doesNotReject(
    assertRegistryDoesNotContainRelease(releases[1], {
      fetchImpl: async () =>
        new Response(JSON.stringify({ versions: { "0.1.1": {} } }), {
          status: 200,
        }),
    })
  );
});
