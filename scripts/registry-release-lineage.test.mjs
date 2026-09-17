import assert from "node:assert/strict";
import test from "node:test";

import { resolveRegistryReleaseLineage } from "./lib/registry-release-lineage.mjs";

const event = (id, content) => ({ id, created_at: 1, content: "", tags: [] });

function loaded(heads, hasRelease = true, quorum = 2) {
  return {
    authorityEpoch: "epoch-1",
    quorum,
    relays: heads.map((head, index) => ({
      url: `wss://relay-${index + 1}.example`,
      state: {
        registry: { heads: new Map(head ? [["demo", head]] : []) },
        events: hasRelease
          ? [
              {
                ...event("9".repeat(64)),
                kind: 9,
                pubkey: "a".repeat(64),
                sig: "b".repeat(128),
                tags: [
                  ["h", "group"],
                  ["t", "lapis-plugin-release"],
                  ["t", "plugin:demo"],
                  [
                    "imeta",
                    "url https://example.com/manifest.json",
                    "m application/json",
                    `x ${"c".repeat(64)}`,
                    "size 1",
                  ],
                ],
              },
            ]
          : [],
      },
    })),
  };
}

function head(id = "1".repeat(64)) {
  return {
    event: event(id),
    fresh: true,
    content: {
      authorityEpoch: "epoch-1",
      headRevision: "7",
      releases: [
        {
          releaseEventId: "2".repeat(64),
          manifestSha256: "3".repeat(64),
          version: "1.0.0",
          releaseSequence: "4",
          state: "approved",
          decisionEventId: "4".repeat(64),
        },
      ],
    },
  };
}

test("derives the next release from the same signed head on quorum", () => {
  const current = head();
  assert.deepEqual(
    resolveRegistryReleaseLineage(
      loaded([current, current, undefined]),
      "demo",
      "1.1.0"
    ),
    {
      authorityEpoch: "epoch-1",
      releaseSequence: "5",
      previousReleaseEventId: "2".repeat(64),
      previousHeadEvent: current.event,
      previousHeadReleases: current.content.releases,
      previousHeadRevision: "7",
    }
  );
});

test("fails closed on head disagreement and a headless legacy release", () => {
  assert.throws(
    () =>
      resolveRegistryReleaseLineage(
        loaded([head("1".repeat(64)), head("5".repeat(64))]),
        "demo",
        "1.1.0"
      ),
    /sequence-zero Registry head/
  );
});

test("starts a new plugin at sequence one but rejects duplicate versions", () => {
  assert.deepEqual(
    resolveRegistryReleaseLineage(
      loaded([undefined, undefined], false),
      "demo",
      "1.0.0"
    ),
    {
      authorityEpoch: "epoch-1",
      releaseSequence: "1",
      previousHeadReleases: [],
    }
  );
  const current = head();
  assert.throws(
    () =>
      resolveRegistryReleaseLineage(
        loaded([current, current]),
        "demo",
        "1.0.0"
      ),
    /already exists/
  );
});
