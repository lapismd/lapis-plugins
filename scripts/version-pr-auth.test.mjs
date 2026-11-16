import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("version PRs use the existing scoped App while retaining public eligibility and CI", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/version-packages.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /permissions:\n  contents: read\n/);
  assert.doesNotMatch(
    workflow,
    /persist-credentials: true|pull-requests: write\n\nconcurrency/,
  );
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /id: app\n/);
  assert.match(
    workflow,
    /repositories: \$\{\{ github\.event\.repository\.name \}\}/,
  );
  assert.match(workflow, /owner: \$\{\{ github\.repository_owner \}\}/);
  assert.match(
    workflow,
    /private-key: \$\{\{ secrets\.LAPIS_DEPENDENCY_APP_PRIVATE_KEY \}\}/,
  );
  assert.match(workflow, /permission-contents: write/);
  assert.match(workflow, /permission-pull-requests: write/);
  assert.match(
    workflow,
    /GITHUB_TOKEN: \$\{\{ steps\.app\.outputs\.token \}\}/,
  );
  assert.match(
    workflow,
    /run: node scripts\/version-public-packages\.mjs --check/,
  );
  assert.equal(
    (
      workflow.match(/if: steps\.releasable\.outputs\.releasable == 'true'/g) ??
      []
    ).length,
    3,
  );
  assert.match(workflow, /version: pnpm release:version/);
  assert.match(workflow, /commitMode: github-api/);
  assert.match(workflow, /createGithubReleases: false/);
  assert.doesNotMatch(
    workflow,
    /publish:|continue-on-error|gh pr merge|gh pr review/,
  );
  for (const [, action, revision] of workflow.matchAll(
    /uses: ([^\s@]+)@([^\s]+)/g,
  )) {
    assert.match(revision, /^[a-f0-9]{40}$/, action);
  }
});

test("releasable version preparation validates pinned shared inputs before App minting", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/version-packages.yml", import.meta.url),
    "utf8",
  );
  const guard = workflow.indexOf(
    "- name: Validate source-owned version runtime",
  );
  assert(guard >= 0, "Version preparation must use the shared pre-mint guard");
  const end = workflow.indexOf("\n      - ", guard + 1),
    step = workflow.slice(guard, end);
  assert.match(step, /if: steps\.releasable\.outputs\.releasable == 'true'/);
  assert.match(
    step,
    /uses: lapismd\/lapis-ci\/actions\/guard-version-runtime@c6f5827520787256cce793a1a33b75f86e14bd81/,
  );
  assert.match(step, /qualification-file: \.github\/versioning-runtime\.json/);
  assert(guard > workflow.indexOf("id: releasable"));
  assert(guard < workflow.indexOf("id: app"));
  const qualification = JSON.parse(
    await readFile(
      new URL("../.github/versioning-runtime.json", import.meta.url),
      "utf8",
    ),
  );
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(qualification.cliVersion, "2.31.1");
  assert.equal(manifest.devDependencies["@changesets/cli"], "^2.31.1");
  assert.equal(qualification.packageManager, manifest.packageManager);
  for (const [name, command] of Object.entries(qualification.scripts))
    assert.equal(command, manifest.scripts[name]);
  assert.equal(
    qualification.scripts["release:version"],
    "node scripts/version-public-packages.mjs",
  );
  const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
  assert.equal(
    qualification.configSha256,
    hash(await readFile(new URL("../.changeset/config.json", import.meta.url))),
  );
  for (const [file, digest] of Object.entries(qualification.files)) {
    assert.match(file, /^scripts\/[\w./-]+\.mjs$/);
    assert(!file.split("/").includes(".."));
    assert.equal(
      hash(await readFile(new URL("../" + file, import.meta.url))),
      digest,
      file,
    );
  }
});
