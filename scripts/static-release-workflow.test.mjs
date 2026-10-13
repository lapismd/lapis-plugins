import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("static publication requires activation, protected approval and the pinned blocking CI", async () => {
  const source = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8"
  );
  const jobs = source.split(/^jobs:\s*$/m)[1];
  for (const [, name, body] of jobs.matchAll(
    /^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:|$(?![\s\S]))/gm
  )) {
    assert.match(
      body,
      /^    if: vars\.STATIC_RELEASE_ENABLED == 'true'$/m,
      name
    );
  }
  assert.match(source, /environment: first-publication/);
  assert.match(source, /needs: \[selection, validate, image-pin\]/);
  assert.match(source, /uses: \.\/\.github\/workflows\/ci\.yml/);
  assert.match(source, /uses: \.\/\.github\/actions\/ci-setup/);
  assert.match(
    source,
    /image: \$\{\{ needs\.image-pin\.outputs\.reference \}\}/
  );
  assert.match(source, /trap 'rm -f "\$key_file"' EXIT/);
  assert.ok(
    source.indexOf("create-static-release-plan.mjs") <
      source.indexOf("release:publish-approved")
  );
  assert.ok(
    source.indexOf("release:publish-approved") <
      source.indexOf("dispatch-static-release.mjs")
  );
  assert.doesNotMatch(
    source,
    /NOSTR_RELEASE|NPM_TOKEN|NODE_AUTH_TOKEN|--role publisher|relay/
  );
});

test("static qualification has no Community dependency and retains relay tests separately", async () => {
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8")
  );
  assert.equal(pkg.devDependencies["@lapismd/lapis-community"], undefined);
  assert.equal(
    pkg.scripts["test:release:nostr"],
    "node --test scripts/deferred-nostr-tests/*.test.mjs"
  );
  for (const file of [
    "../.storybook/main.ts",
    "./check-registry-metadata.mjs",
    "./lib/static-release-candidate.mjs",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /@lapismd\/lapis-community/);
    assert.match(source, /@lapis-notes\/api\/(?:registry\/schema|build\/vite)/);
  }
});

test("CI plans verified static candidates without invoking deferred Nostr tooling", async () => {
  const ci = await readFile(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8"
  );
  assert.match(ci, /node scripts\/create-registry-acceptance-fixture\.mjs/);
  assert.doesNotMatch(ci, /run: pnpm release:plan/);
});
