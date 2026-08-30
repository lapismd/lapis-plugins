import assert from "node:assert/strict";
import test from "node:test";

import { summarizeTurboCache } from "./report-turbo-cache.mjs";

test("Turbo cache reporting distinguishes remote, local, and executed tasks", () => {
  assert.deepEqual(
    summarizeTurboCache({
      tasks: [
        { cache: { status: "HIT", source: "REMOTE" } },
        { cache: { status: "HIT", source: "LOCAL" } },
        { cache: { status: "MISS" } },
      ],
    }),
    { attempted: 3, executed: 1, localHits: 1, remoteHits: 1 },
  );
});

test("CI workflow consumes the checked-in image and never caches .turbo with Actions", async () => {
  const { readFile } = await import("node:fs/promises");
  const workflow = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  const imageManifest = JSON.parse(
    await readFile(new URL("../.ci/images.json", import.meta.url), "utf8"),
  );
  const reference = `${imageManifest.dependencies.image}@${imageManifest.dependencies.digest}`;
  assert.equal(workflow.match(new RegExp(reference, "g"))?.length, 6);
  assert.doesNotMatch(workflow, /uses:\s*actions\/cache|path:\s*[^\n]*\.turbo/i);
  for (const lane of [
    "build-cache:",
    "quality:",
    "unit:",
    "storybook-static:",
    "storybook-interaction:",
    "release-artifacts:",
    "validate:",
  ]) {
    assert.match(workflow, new RegExp(`^  ${lane}`, "m"));
  }
});
