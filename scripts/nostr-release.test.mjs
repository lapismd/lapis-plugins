import assert from "node:assert/strict";
import test from "node:test";

import {
  createCurationCandidate,
  createReleaseHeadTemplate,
} from "./nostr-release.mjs";

const release = {
  repository: "lapismd/lapis-plugins",
  pluginId: "community",
  version: "0.1.0",
  sourceCommit: "abc123",
  payload: { sha256: "a".repeat(64), size: 1234 },
  nostr: {
    candidateId: "b".repeat(64),
    manifest: { sha256: "c".repeat(64), size: 4567 },
  },
};

test("binds curation approval to the signed release event", () => {
  const first = createCurationCandidate(release, { id: "d".repeat(64) });
  const repeated = createCurationCandidate(release, { id: "d".repeat(64) });
  const changedEvent = createCurationCandidate(release, {
    id: "e".repeat(64),
  });

  assert.deepEqual(repeated, first);
  assert.equal(first.schema, "lapis.registry.curation-candidate/1");
  assert.equal(first.releaseEventId, "d".repeat(64));
  assert.equal(first.artifactSha256, release.payload.sha256);
  assert.equal(first.manifestSha256, release.nostr.manifest.sha256);
  assert.notEqual(changedEvent.candidateId, first.candidateId);
});

test("advances the signed Registry head with the approved release", () => {
  const template = createReleaseHeadTemplate({
    release,
    releaseEvent: { id: "d".repeat(64) },
    decisionEvent: { id: "e".repeat(64) },
    lineage: {
      authorityEpoch: "epoch-1",
      releaseSequence: "1",
      previousHeadReleases: [],
    },
    createdAt: 1_000,
  });
  const content = JSON.parse(template.content);
  assert.equal(content.headRevision, "1");
  assert.equal(content.activeReleaseEventId, "d".repeat(64));
  assert.equal(content.releases[0].releaseSequence, "1");
  assert.equal(content.releases[0].decisionEventId, "e".repeat(64));
});
