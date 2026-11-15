import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = () =>
  readFile(
    new URL("../.github/workflows/dependency-image.yml", import.meta.url),
    "utf8",
  );

test("dependency-image publication delegates to the reviewed shared producer without pin PR writes", async () => {
  const source = await load();
  assert.match(
    source,
    /lapismd\/lapis-ci\/actions\/publish-dependency-image@[a-f0-9]{40}/,
  );
  assert.doesNotMatch(
    source,
    /gh pr |git (?:push|commit|switch)|update-ci-image-manifest|contents: write|pull-requests: write/,
  );
  assert.match(source, /contents: read/);
  assert.match(source, /attestations: write/);
  assert.match(source, /id-token: write/);
  assert.match(source, /packages: write/);
  assert.match(
    source,
    /base-image: \$\{\{ steps\.context\.outputs\.base_image \}\}/,
  );
  assert.match(
    source,
    /image: \$\{\{ steps\.context\.outputs\.dependency_image \}\}/,
  );
  assert.match(source, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.doesNotMatch(source, /PRIVATE_KEY|secrets: inherit/);
});

test("main publication is serialized and covers all source-owned context inputs", async () => {
  const source = await load();
  assert.match(
    source,
    /if:.*github\.repository == 'lapismd\/lapis-plugins'.*github\.ref == 'refs\/heads\/main'/,
  );
  assert.match(
    source,
    /group: dependency-image-\$\{\{ github\.repository \}\}/,
  );
  assert.match(source, /cancel-in-progress: false/);
  for (const input of [
    ".ci/dependency-image.Dockerfile",
    ".ci/images.json",
    "package.json",
    "packages/**/package.json",
    "patches/**",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/package-catalog.mjs",
    "scripts/lib/ci-images.mjs",
    "scripts/prepare-ci-dependency-context.mjs",
  ])
    assert(source.includes(`      - ${input}\n`), input);
});

test("publication retains receipts even after failure without collecting source or signing files", async () => {
  const source = await load();
  assert.match(source, /if: always\(\)/);
  assert.match(source, /retention-days: 14/);
  const paths = source
    .match(/          path: \|\n((?:            [^\n]+\n)+)/)?.[1]
    .trim()
    .split(/\n\s*/);
  assert.deepEqual(paths, [
    ".ci/dependency-image-receipt.json",
    ".ci/dependency-image-resolution.json",
    ".ci/dependency-image-publication.json",
  ]);
  assert.doesNotMatch(source, /\.release\/|\.pem|private-key/);
});

test("every external source image action is pinned to an immutable commit", async () => {
  for (const file of ["dependency-image", "resolve-dependency-image"]) {
    const source = await readFile(
      new URL(`../.github/workflows/${file}.yml`, import.meta.url),
      "utf8",
    );
    for (const [, action, revision] of source.matchAll(
      /uses: ([^\s@]+)@([^\s]+)/g,
    ))
      assert.match(revision, /^[a-f0-9]{40}$/, action);
  }
});
