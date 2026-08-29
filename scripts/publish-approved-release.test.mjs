import assert from "node:assert/strict";
import test from "node:test";

import {
  assertRegistryDoesNotContainRelease,
  parseOptions,
  selectReleases,
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
