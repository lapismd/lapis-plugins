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
