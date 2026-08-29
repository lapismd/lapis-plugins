import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../.github/workflows/release.yml", import.meta.url),
  "utf8"
);
const ciWorkflow = await readFile(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8"
);
const lockfile = await readFile(
  new URL("../pnpm-lock.yaml", import.meta.url),
  "utf8"
);
const publisher = await readFile(
  new URL("./publish-approved-release.mjs", import.meta.url),
  "utf8"
);

test("publishes npm packages through the protected OIDC workflow", () => {
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /environment:\s*first-publication/);
  assert.match(workflow, /client-id:\s*\$\{\{ secrets\.LAPIS_REGISTRY_APP_CLIENT_ID \}\}/);
  assert.doesNotMatch(workflow, /app-id:|LAPIS_REGISTRY_APP_ID/);
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

test("offers explicit plugin checkboxes instead of a free-form selector", () => {
  for (const input of [
    "plugin_ai",
    "plugin_bases",
    "plugin_bookmarks",
    "plugin_graph",
    "plugin_history",
    "plugin_markdown",
    "plugin_markdown_lint",
    "plugin_search",
    "plugin_source_editor",
    "plugin_spellcheck",
    "plugin_wordcount",
  ]) {
    assert.match(workflow, new RegExp(`^      ${input}:$`, "m"));
  }
  assert.doesNotMatch(workflow, /^      plugin:$/m);
  assert.match(workflow, /Select at least one plugin to release/);
  assert.match(workflow, /replace_existing_github_assets:/);
  assert.match(workflow, /--replace-github-assets/);
});

test("GitHub workflows run Node 24 actions and Node 24 builds", () => {
  for (const source of [workflow, ciWorkflow]) {
    assert.match(source, /actions\/checkout@v7/);
    assert.match(source, /pnpm\/action-setup@v6/);
    assert.match(source, /actions\/setup-node@v7/);
    assert.match(source, /node-version:\s*24/);
    assert.doesNotMatch(source, /@v4|node-version:\s*["']?20/);
    assert.match(source, /taiki-e\/install-action@v2/);
    assert.match(source, /tool:\s*mdbook@0\.5\.4/);
  }
  assert.match(ciWorkflow, /actions\/upload-artifact@v7/);
});
