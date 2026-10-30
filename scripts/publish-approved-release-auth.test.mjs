import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  npmTrustedPublisherRejected,
  npmVersionAlreadyPublished,
} from "./publish-approved-release.mjs";

const publisher = await readFile(
  new URL("./publish-approved-release.mjs", import.meta.url),
  "utf8",
);

test("a trusted-publisher rejection is visible from the npm publish stderr", () => {
  const error = Object.assign(
    new Error(
      "Command failed: npm publish package.tgz --access public --provenance",
    ),
    {
      stderr:
        "npm error code ENEEDAUTH\nnpm error need auth This command requires you to be logged in.\n",
    },
  );
  assert.equal(npmTrustedPublisherRejected(error), true);
  assert.equal(npmVersionAlreadyPublished(error), false);
});

test("an already published version is not a trusted-publisher rejection", () => {
  const error = new Error(
    "npm error code E409 You cannot publish over the previously published versions",
  );
  assert.equal(npmTrustedPublisherRejected(error), false);
  assert.equal(npmVersionAlreadyPublished(error), true);
});

test("npm publish keeps provenance when a package is rejected", () => {
  assert.match(
    publisher,
    /\["publish", tarball, "--access", "public", "--provenance"\]/,
  );
  assert.match(publisher, /if \(!npmTrustedPublisherRejected\(error\)\) throw error;/);
  assert.match(publisher, /continue;/);
});
