import assert from "node:assert/strict";
import test from "node:test";

import {
  dispatchPluginMetadata,
  metadataDispatchPayload,
  selectPlugins,
} from "./dispatch-plugin-metadata.mjs";

const sourceCommit = "c".repeat(40);

test("metadata dispatch payload is minimal and exact-commit scoped", () => {
  const plugin = selectPlugins("graph")[0];
  assert.deepEqual(metadataDispatchPayload(plugin, sourceCommit), {
    event_type: "plugin_metadata",
    client_payload: {
      repository: "lapismd/lapis-plugins",
      package_name: "@lapis-notes/graph",
      plugin_id: "lapis-graph",
      source_commit: sourceCommit,
    },
  });
  assert.throws(
    () => metadataDispatchPayload(plugin, "short"),
    /full Git source commit/,
  );
});

test("metadata dispatch dry run covers all eleven packages without network access", async () => {
  const payloads = await dispatchPluginMetadata({
    sourceCommit,
    dryRun: true,
    fetchImpl: async () => {
      throw new Error("network should not be used");
    },
  });
  assert.equal(payloads.length, 11);
  assert.equal(new Set(payloads.map((item) => item.client_payload.plugin_id)).size, 11);
});

test("metadata dispatch requires the scoped registry token before network access", async () => {
  await assert.rejects(
    dispatchPluginMetadata({
      selector: "search",
      sourceCommit,
      token: "",
    }),
    /REGISTRY_GITHUB_TOKEN is required/,
  );
});
