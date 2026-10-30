import assert from "node:assert/strict";
import test from "node:test";
import { githubExistingAssetDecision } from "./publish-approved-release.mjs";

test("a different lapis-plugin asset is left in place", () => {
  const asset = "ai-0.1.6.lapis-plugin";
  assert.equal(githubExistingAssetDecision(asset, true, false), "match");
  assert.equal(
    githubExistingAssetDecision(asset, false, false),
    "skip-different",
  );
  assert.equal(githubExistingAssetDecision(asset, false, true), "mismatch");
  assert.equal(
    githubExistingAssetDecision(`${asset}.sha256`, false, false),
    "mismatch",
  );
});
