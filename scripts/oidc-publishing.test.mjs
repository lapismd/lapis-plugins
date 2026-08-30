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
const ciSetup = await readFile(
  new URL("../.github/actions/ci-setup/action.yml", import.meta.url),
  "utf8"
);
const ciImages = JSON.parse(
  await readFile(new URL("../.ci/images.json", import.meta.url), "utf8")
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
  assert.match(
    workflow,
    /actions\/create-github-app-token@7bd03711494f032dfa3be3558f7dc8787b0be333/,
  );
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
  assert.match(
    ciSetup,
    /git config --global --add safe\.directory "\$\{GITHUB_WORKSPACE\}"/,
  );
  assert.match(ciSetup, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /uses:\s*\.\/\.github\/actions\/ci-setup/);
  assert.doesNotMatch(workflow, /pnpm exec playwright install/);
});

test("reuses blocking CI and reverifies the downloaded production candidate", () => {
  assert.match(ciWorkflow, /^\s*workflow_call:$/m);
  assert.match(workflow, /uses:\s*\.\/\.github\/workflows\/ci\.yml/);
  assert.match(workflow, /secrets:\s*inherit/);
  assert.match(workflow, /^\s*production-candidate:$/m);
  assert.match(workflow, /^\s*publish:$/m);
  assert.match(workflow, /actions\/upload-artifact@v7/);
  assert.match(workflow, /actions\/download-artifact@v8/);
  assert.match(workflow, /pnpm plugin:verify/g);
  assert.match(workflow, /pnpm release:plan -- --production/g);
  assert.match(workflow, /cmp "\$candidate_plan" \.release\/release-plan\.json/);
  assert.match(workflow, /\.generatedFrom == \$source/);
  assert.match(workflow, /\.sourceCommit == \$source/);
  assert.match(
    workflow,
    new RegExp(`${ciImages.dependencies.image}@${ciImages.dependencies.digest}`, "g"),
  );
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
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/download-artifact@v8/);
  assert.match(workflow, /uses:\s*\.\/\.github\/actions\/ci-setup/);
  assert.doesNotMatch(workflow, /pnpm\/action-setup|actions\/setup-node|taiki-e\/install-action/);

  assert.match(ciWorkflow, /actions\/checkout@v7/);
  assert.match(
    ciWorkflow,
    new RegExp(`${ciImages.dependencies.image}@${ciImages.dependencies.digest}`),
  );
  assert.match(ciSetup, /v24\.15\.0/);
  assert.match(ciSetup, /10\.34\.5/);
  assert.match(ciSetup, /Version 1\.61\.1/);
  assert.match(ciSetup, /mdbook v0\.5\.4/);
  assert.doesNotMatch(ciWorkflow + workflow + ciSetup, /node-version:\s*["']?20/);
  assert.match(ciWorkflow, /actions\/upload-artifact@v7/);
});
