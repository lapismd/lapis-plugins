import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  parkedPluginPackages,
  pluginPackages,
} from "./package-catalog.mjs";

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
    source.indexOf("node scripts/validation/install-tools.mjs --ci") <
      source.indexOf("pnpm check")
  );
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
  const lanes = JSON.parse(
    await readFile(new URL("./validation/lanes.json", import.meta.url), "utf8")
  );
  assert.equal(pkg.devDependencies["@lapismd/lapis-community"], undefined);
  assert.equal(
    pkg.scripts["test:release:nostr"],
    "node scripts/validation.mjs run test:release:nostr"
  );
  assert.equal(
    lanes["test:release:nostr"],
    "node --test scripts/deferred-nostr-tests/*.test.mjs"
  );
  assert.doesNotMatch(lanes["test:release"], /deferred-nostr-tests/);
  assert.doesNotMatch(lanes["ci:release"], /test:release:nostr/);
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

test("approved release lists every public plugin and no parked package", async () => {
  for (const file of [
    "../.github/workflows/release.yml",
    "../.github/workflows/release-nostr.yml",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    for (const plugin of pluginPackages) {
      const input = plugin.directory.replaceAll("-", "_");
      assert.match(source, new RegExp(`^      plugin_${input}:$`, "m"), file);
      assert.ok(
        source.includes(`Release ${plugin.packageName}`),
        plugin.packageName,
      );
      assert.match(
        source,
        new RegExp(`^            ${plugin.directory}$`, "m"),
        file,
      );
    }
    for (const plugin of parkedPluginPackages) {
      assert.equal(source.includes(`Release ${plugin.packageName}`), false);
    }
  }
});

test("a main push opens a version pull request only for a releasable changeset", async () => {
  const source = await readFile(
    new URL("../.github/workflows/version-packages.yml", import.meta.url),
    "utf8",
  );
  const release = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );
  assert.match(source, /branches:\n\s+- main/);
  assert.match(source, /node scripts\/version-public-packages\.mjs --check/);
  assert.match(source, /if: steps\.releasable\.outputs\.releasable == 'true'/);
  assert.ok(
    source.indexOf("node scripts/version-public-packages.mjs --check") <
      source.indexOf("changesets/action@v1.8.0"),
  );
  assert.match(source, /changesets\/action@v1\.8\.0/);
  assert.match(source, /version: pnpm release:version/);
  assert.doesNotMatch(source, /release:publish|workflow_dispatch/);
  assert.match(release, /workflow_dispatch:/);
  assert.doesNotMatch(release, /^  push:/m);
});

test("CI plans verified static candidates without invoking deferred Nostr tooling", async () => {
  const ci = await readFile(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8"
  );
  assert.match(ci, /node scripts\/create-registry-acceptance-fixture\.mjs/);
  assert.doesNotMatch(ci, /run: pnpm release:plan/);
});
