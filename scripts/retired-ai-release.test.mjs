import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertReleaseIsActive } from "./package-catalog.mjs";
import { dispatchPluginMetadata } from "./dispatch-plugin-metadata.mjs";
import { dispatchStaticReleases } from "./dispatch-static-release.mjs";
import {
  publishSelectedReleases,
  selectReleases,
} from "./publish-approved-release.mjs";

const ai = {
  repository: "lapismd/lapis-plugins",
  packageName: "@lapis-notes/ai",
  pluginId: "ai",
  releaseTag: "ai@0.1.15",
  version: "0.1.15",
};
const graph = {
  packageName: "@lapis-notes/graph",
  pluginId: "lapis-graph",
  releaseTag: "graph@0.1.12",
};

test("retired shared AI coordinates reject stale plans, including mixed plans", () => {
  for (const release of [
    ai,
    { packageName: ai.packageName },
    { pluginId: "ai" },
    { releaseTag: ai.releaseTag },
  ]) {
    assert.throws(() => assertReleaseIsActive(release), /retired/i);
  }
  for (const selectors of [
    ["all"],
    ["ai"],
    ["@lapis-notes/ai"],
    ["lapis-graph"],
  ]) {
    assert.throws(() => selectReleases([graph, ai], selectors), /retired/i);
  }
  assert.deepEqual(selectReleases([graph], ["all"]), [graph]);
});

test("retired metadata selections reject before network, while all omits AI", async () => {
  let requests = 0;
  const options = {
    sourceCommit: "a".repeat(40),
    token: "test-only",
    fetchImpl: async () => {
      requests++;
      return new Response(null, { status: 204 });
    },
  };
  for (const selector of ["ai", "@lapis-notes/ai"]) {
    await assert.rejects(
      dispatchPluginMetadata({ ...options, selector }),
      /retired/i,
    );
  }
  assert.equal(requests, 0);
  const payloads = await dispatchPluginMetadata({
    ...options,
    selector: "all",
    dryRun: true,
  });
  assert.ok(payloads.some((p) => p.client_payload.plugin_id === "lapis-graph"));
  assert.ok(
    !payloads.some((p) => p.client_payload.package_name === ai.packageName),
  );
  assert.equal(requests, 0);
});

test("direct publication and static registry dispatch preflight every release", async () => {
  const calls = [];
  await assert.rejects(
    publishSelectedReleases(
      [graph, ai],
      {},
      {
        publishNpmImpl: async () => calls.push("npm"),
        publishGitHubReleaseImpl: async () => calls.push("github"),
      },
    ),
    /retired/i,
  );
  await assert.rejects(
    dispatchStaticReleases({
      plan: { production: true, releases: [graph, ai] },
      selectors: ["all"],
      approved: true,
      token: "test-only",
      resolve: async () => {
        calls.push("resolve");
        return graph;
      },
      fetchImpl: async () => {
        calls.push("network");
        return new Response();
      },
    }),
    /retired/i,
  );
  assert.deepEqual(calls, []);
});

test("both manual publication workflows remove shared AI selection", async () => {
  for (const name of ["release.yml", "release-nostr.yml"]) {
    const workflow = await readFile(
      new URL(`../.github/workflows/${name}`, import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(
      workflow,
      /plugin_ai|@lapis-notes\/ai|^            ai$/m,
    );
    assert.match(workflow, /plugin_graph/);
  }
});
