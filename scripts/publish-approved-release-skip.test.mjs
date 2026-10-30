import assert from "node:assert/strict";
import test from "node:test";
import { npmPublicationDecision } from "./publish-approved-release.mjs";

test("an already published npm version with different integrity is left in place", () => {
  assert.equal(npmPublicationDecision(undefined, "sha512-new"), "publish");
  assert.equal(
    npmPublicationDecision("sha512-same", "sha512-same"),
    "skip-same",
  );
  assert.equal(
    npmPublicationDecision("sha512-old", "sha512-new"),
    "skip-different",
  );
});
