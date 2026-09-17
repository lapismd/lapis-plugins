import assert from "node:assert/strict";
import test from "node:test";

import {
  createRenewedHeadTemplate,
  headNeedsRenewal,
} from "./renew-registry-heads.mjs";

test("renews only heads within the seven day freshness window", () => {
  const now = new Date("2026-09-06T00:00:00.000Z");
  assert.equal(headNeedsRenewal("2026-09-13T00:00:00.000Z", now), true);
  assert.equal(headNeedsRenewal("2026-09-14T00:00:00.000Z", now), false);
  assert.equal(headNeedsRenewal("invalid", now), true);
});

test("freshness renewal preserves release evidence and advances the head", () => {
  const current = {
    event: { id: "a".repeat(64), created_at: 1_000 },
    content: {
      schema: "lapis.registry.plugin-head/1",
      pluginId: "demo",
      authorityEpoch: "epoch-1",
      headRevision: "4",
      activeReleaseEventId: "b".repeat(64),
      releases: [
        {
          releaseEventId: "b".repeat(64),
          manifestSha256: "c".repeat(64),
          version: "1.0.0",
          releaseSequence: "1",
          state: "approved",
          decisionEventId: "d".repeat(64),
        },
      ],
      issuedAt: "1970-01-01T00:16:40.000Z",
      validUntil: "1970-01-31T00:16:40.000Z",
    },
  };
  const template = createRenewedHeadTemplate(current, 2_000);
  const content = JSON.parse(template.content);
  assert.equal(content.headRevision, "5");
  assert.equal(content.previousHeadEventId, current.event.id);
  assert.deepEqual(content.releases, current.content.releases);
  assert.equal(content.validUntil, "1970-01-31T00:33:20.000Z");
});
