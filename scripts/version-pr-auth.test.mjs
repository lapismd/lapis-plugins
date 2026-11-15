import assert from "node:assert/strict";
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
    2,
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
