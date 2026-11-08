import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as publication from "./publish-approved-release.mjs";

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
  assert.match(
    publisher,
    /if \(!npmTrustedPublisherRejected\(error\)\) throw error;/,
  );
  assert.match(publisher, /continue;/);
});

test("publication diagnostics retain only npm's error code", () => {
  const error = Object.assign(new Error("private command detail"), {
    code: 1,
    stderr: "npm error code ENEEDAUTH\nnpm error token npm_private_value\n",
  });
  assert.equal(publication.npmErrorCode(error), "ENEEDAUTH");
  assert.equal(
    publication.npmErrorCode(new Error("private detail")),
    "UNKNOWN",
  );
});

test("publication orchestration requires explicitly supplied approved operations", async () => {
  await assert.rejects(
    publication.publishSelectedReleases([], {}),
    /Approved publication operations are required/,
  );
});

test("partial publication attempts every package and skips GitHub only for rejected npm packages", async () => {
  const releases = ["canvas", "ai", "csv", "transcripts", "pdf"].map((id) => ({
    packageName: `@lapis-notes/${id}`,
    version: "0.2.1",
  }));
  const calls = [];
  const logs = [];
  await assert.rejects(
    publication.publishSelectedReleases(
      releases,
      {},
      {
        publishNpmImpl: async (release) => {
          calls.push(`npm:${release.packageName}`);
          if (
            ["canvas", "csv", "transcripts"].some((id) =>
              release.packageName.endsWith(`/${id}`),
            )
          ) {
            throw Object.assign(new Error("private command detail"), {
              stderr:
                "npm error code ENEEDAUTH\nnpm error token npm_private_value",
            });
          }
        },
        publishGitHubReleaseImpl: async (release) =>
          calls.push(`github:${release.packageName}`),
        log: (message) => logs.push(message),
      },
    ),
    (error) => {
      assert.match(error.message, /canvas@0\.2\.1 \[ENEEDAUTH\]/);
      assert.match(error.message, /csv@0\.2\.1 \[ENEEDAUTH\]/);
      assert.match(error.message, /transcripts@0\.2\.1 \[ENEEDAUTH\]/);
      assert.doesNotMatch(error.message, /private|token/);
      return true;
    },
  );
  assert.deepEqual(calls, [
    "npm:@lapis-notes/canvas",
    "npm:@lapis-notes/ai",
    "github:@lapis-notes/ai",
    "npm:@lapis-notes/csv",
    "npm:@lapis-notes/transcripts",
    "npm:@lapis-notes/pdf",
    "github:@lapis-notes/pdf",
  ]);
  assert.match(logs.join("\n"), /\[ENEEDAUTH\]/);
  assert.doesNotMatch(logs.join("\n"), /private|token/);
});

test("non-authentication failures stop publication before later packages", async () => {
  const calls = [];
  const failure = Object.assign(new Error("npm error code E403"), { code: 1 });
  await assert.rejects(
    publication.publishSelectedReleases(
      [{}, {}],
      {},
      {
        publishNpmImpl: async () => {
          calls.push("npm");
          throw failure;
        },
        publishGitHubReleaseImpl: async () => calls.push("github"),
        log: () => {},
      },
    ),
    (error) => error === failure,
  );
  assert.deepEqual(calls, ["npm"]);
});
