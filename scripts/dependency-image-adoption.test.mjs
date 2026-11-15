import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const workflow = (name) =>
  readFile(
    new URL(`../.github/workflows/${name}.yml`, import.meta.url),
    "utf8",
  );

test("active consumers resolve the current context through one read-only workflow", async () => {
  for (const name of ["ci", "version-packages", "release"]) {
    const source = await workflow(name);
    const worker = name === "ci" ? "resolve-image" : "image-pin";
    const job = source.match(
      new RegExp(`^  ${worker}:\\n([\\s\\S]*?)(?=^  [\\w-]+:)`, "m"),
    )?.[1];
    assert.match(
      job ?? "",
      /uses: \.\/\.github\/workflows\/resolve-dependency-image\.yml/,
    );
    assert.match(job, new RegExp(`artifact-name: ${name}-dependency-image`));
    assert.doesNotMatch(job, /\.dependencies.*\.digest|jq -er/);
    assert.match(source, /packages: read/);
    if (name === "release")
      assert.match(job, /if: vars\.STATIC_RELEASE_ENABLED == 'true'/);
  }
});

test("the required image-pin gate admits only successful current immutable resolutions", async () => {
  const source = await workflow("ci");
  const gate =
    source.match(/^  image-pin:\n([\s\S]*?)(?=^  [\w-]+:)/m)?.[1] ?? "";
  assert.match(gate, /needs: resolve-image/);
  assert.match(gate, /if: always\(\)/);
  const script = gate
    .split("        run: |\n")[1]
    ?.split("\n")
    .filter((line) => line.startsWith("          "))
    .map((line) => line.slice(10))
    .join("\n");
  assert(
    script,
    "the existing required image-pin context retains an executable fail-closed gate",
  );
  const valid = {
    RESOLVE_RESULT: "success",
    RESOLVE_STATE: "hit",
    IMAGE_REFERENCE: `ghcr.io/lapismd/lapis-plugins-ci@sha256:${"a".repeat(64)}`,
    INPUT_IDENTITY: `sha256:${"b".repeat(64)}`,
    GITHUB_OUTPUT: "/dev/null",
  };
  const run = (overrides) =>
    spawnSync("bash", ["-c", script], {
      env: { ...process.env, ...valid, ...overrides },
      encoding: "utf8",
    }).status;
  assert.equal(run({}), 0);
  for (const state of ["miss", "unavailable"])
    assert.equal(
      run({
        RESOLVE_STATE: state,
        IMAGE_REFERENCE: `ghcr.io/lapismd/lapis-ci@sha256:${"a".repeat(64)}`,
      }),
      0,
    );
  for (const result of ["failure", "cancelled", "skipped", ""])
    assert.notEqual(run({ RESOLVE_RESULT: result }), 0, result);
  for (const reference of [
    "",
    "ghcr.io/lapismd/lapis-plugins-ci:latest",
    `ghcr.io/other/image@sha256:${"a".repeat(64)}`,
  ])
    assert.notEqual(run({ IMAGE_REFERENCE: reference }), 0, reference);
  assert.notEqual(run({ INPUT_IDENTITY: "" }), 0);
  assert.notEqual(run({ RESOLVE_STATE: "unknown" }), 0);
});

test("resolver uses exact shared provenance policy and retains receipts without write authority", async () => {
  const source = await workflow("resolve-dependency-image");
  assert.match(source, /contents: read/);
  assert.match(source, /packages: read/);
  assert.doesNotMatch(source, /attestations:/);
  assert.doesNotMatch(
    source,
    /: write|secrets: inherit|create-github-app-token/,
  );
  assert.match(
    source,
    /node scripts\/prepare-ci-dependency-context\.mjs --github-output/,
  );
  assert.match(
    source,
    /lapismd\/lapis-ci\/actions\/resolve-dependency-image@[a-f0-9]{40}/,
  );
  assert.match(source, /lapismd\/lapis-ci\/actions\/setup-gh@[a-f0-9]{40}/);
  assert.match(
    source,
    /lapismd\/lapis-ci\/actions\/setup-image-tools@[a-f0-9]{40}/,
  );
  assert.match(source, /repository: lapismd\/lapis-plugins/);
  assert.match(
    source,
    /name: \$\{\{ inputs\.artifact-name \}\}-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/,
  );
  assert.match(source, /if: always\(\)/);
  assert.match(source, /persist-credentials: false/);
});

test("cache selection never conditions either exact frozen install", async () => {
  const source = await readFile(
    new URL("../.github/actions/ci-setup/action.yml", import.meta.url),
    "utf8",
  );
  assert.match(source, /pnpm install --frozen-lockfile --prefer-offline/);
  assert.match(
    source,
    /pnpm --dir packages\/sync install --ignore-workspace --ignore-pnpmfile --frozen-lockfile --prefer-offline/,
  );
  assert.doesNotMatch(source, /^\s+if:|cache-hit|outputs\.state/m);
});

test("consumer and producer use one reviewed shared helper cohort", async () => {
  const source =
    (await workflow("resolve-dependency-image")) +
    (await workflow("dependency-image"));
  const revisions = [
    ...source.matchAll(/lapismd\/lapis-ci\/actions\/[^\s@]+@([a-f0-9]{40})/g),
  ].map((match) => match[1]);
  assert.equal(revisions.length, 4);
  assert.equal(new Set(revisions).size, 1);
});
