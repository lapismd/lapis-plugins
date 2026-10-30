import assert from "node:assert/strict";
import test from "node:test";
import { githubExistingAssetDecision } from "./publish-approved-release.mjs";

test("an existing GitHub release with different assets is left in place", () => {
  assert.equal(githubExistingAssetDecision(true, false), "match");
  assert.equal(githubExistingAssetDecision(false, false), "skip-different");
  assert.equal(githubExistingAssetDecision(false, true), "mismatch");
});
