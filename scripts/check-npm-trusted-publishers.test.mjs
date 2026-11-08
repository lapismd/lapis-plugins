import assert from "node:assert/strict";
import test from "node:test";
import {
  checkTrustedPublishers,
  expectedPublisher,
  matchingPublisher,
  parseTrustConfigurations,
} from "./check-npm-trusted-publishers.mjs";

const valid = {
  id: "connection",
  type: "github",
  ...expectedPublisher,
  permissions: ["createPackage"],
};

test("operator preflight requires the exact tuple and direct publishing", () => {
  assert.equal(matchingPublisher([valid]), valid);
  for (const changes of [
    { type: "gitlab" },
    { repository: "other/repo" },
    { file: "release-nostr.yml" },
    { environment: "other" },
    { permissions: ["createStagedPackage"] },
    { permissions: "createPackage" },
    { status: "Expired" },
    { expired: true },
  ]) {
    assert.equal(matchingPublisher([{ ...valid, ...changes }]), undefined);
  }
  assert.equal(matchingPublisher([]), undefined);
});

test("operator preflight accepts API claims and multiple CLI configurations", () => {
  const api = {
    type: "github",
    claims: {
      repository: expectedPublisher.repository,
      environment: expectedPublisher.environment,
      workflow_ref: { file: expectedPublisher.file },
    },
    permissions: ["createPackage"],
  };
  assert.equal(matchingPublisher([api]), api);
  const other = {
    ...valid,
    repository: "other/repo",
    id: 'quoted } { \\" value',
  };
  assert.deepEqual(
    parseTrustConfigurations(
      `\n${JSON.stringify(other)}\n\n${JSON.stringify(valid)}\n`,
    ),
    [other, valid],
  );
  assert.deepEqual(parseTrustConfigurations(JSON.stringify([other, valid])), [
    other,
    valid,
  ]);
  assert.deepEqual(parseTrustConfigurations("\n"), []);
  assert.equal(matchingPublisher([other, valid]), valid);
});

test("operator preflight rejects malformed or non-JSON inspection output", () => {
  for (const source of ["not JSON", "{", "{} trailing", "[null]", "[[]]"]) {
    assert.throws(() => parseTrustConfigurations(source));
  }
});

test("operator preflight reports every failure without printing npm credentials", async () => {
  const calls = [];
  const logs = [];
  await assert.rejects(
    checkTrustedPublishers(
      ["canvas", "csv", "ai"].map((id) => ({
        packageName: `@lapis-notes/${id}`,
      })),
      {
        readTrust: async (name) => {
          calls.push(name);
          if (name.endsWith("canvas"))
            throw Object.assign(new Error("private command detail"), {
              stderr: "npm error code EOTP\nnpm error token npm_private_value",
            });
          return name.endsWith("csv") ? [] : [valid];
        },
        log: (message) => logs.push(message),
      },
    ),
    (error) => {
      assert.match(error.message, /canvas.*\[EOTP\]/);
      assert.match(error.message, /csv.*no matching/);
      assert.doesNotMatch(error.message, /private|token/);
      return true;
    },
  );
  assert.equal(calls.length, 3);
  assert.equal(logs.length, 1);
});

test("a matching configuration does not claim OIDC activation or publication", async () => {
  const logs = [];
  await checkTrustedPublishers([{ packageName: "@lapis-notes/ai" }], {
    readTrust: async () => [valid],
    log: (message) => logs.push(message),
  });
  assert.match(logs.join("\n"), /only a real trusted publish validates OIDC/);
  assert.match(logs.join("\n"), /within two days/);
});
