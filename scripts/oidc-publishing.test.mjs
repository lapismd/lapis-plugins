import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../.github/workflows/release.yml", import.meta.url),
  "utf8",
);
const ciWorkflow = await readFile(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);
const lockfile = await readFile(
  new URL("../pnpm-lock.yaml", import.meta.url),
  "utf8",
);
const publisher = await readFile(
  new URL("./publish-approved-release.mjs", import.meta.url),
  "utf8",
);

test("publishes npm packages through the protected OIDC workflow", () => {
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /environment:\s*first-publication/);
  assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN/);
});

test("does not require a long-lived npm token at runtime", () => {
  assert.match(publisher, /GITHUB_TOKEN/);
  assert.match(publisher, /REGISTRY_GITHUB_TOKEN/);
  assert.doesNotMatch(publisher, /NPM_TOKEN|NODE_AUTH_TOKEN/);
});

test("builds release candidates from the committed dependency graph", () => {
  assert.match(lockfile, /^lockfileVersion:/m);
  assert.match(ciWorkflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
});
