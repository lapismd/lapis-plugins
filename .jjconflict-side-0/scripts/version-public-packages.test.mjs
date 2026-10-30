import assert from "node:assert/strict";
import test from "node:test";

import {
  heldPackageNames,
  partitionChangeset,
  renderChangeset,
} from "./version-public-packages.mjs";

const mixed = `---
"@lapis-notes/ai": patch
"@lapis-notes/bases": patch
"@lapis-notes/history": minor
---

Keep the other packages on this release.
`;

test("splits held Bases and History entries out of a mixed changeset", () => {
  const parsed = partitionChangeset(mixed, heldPackageNames);
  assert.deepEqual(
    parsed.rest.map((entry) => entry.name),
    ["@lapis-notes/ai"],
  );
  assert.deepEqual(
    parsed.held.map((entry) => `${entry.name}:${entry.bump}`),
    ["@lapis-notes/bases:patch", "@lapis-notes/history:minor"],
  );
  assert.match(renderChangeset(parsed.rest, parsed.body), /"@lapis-notes\/ai": patch/);
  assert.doesNotMatch(renderChangeset(parsed.rest, parsed.body), /bases|history/);
  assert.match(renderChangeset(parsed.held, parsed.body), /Keep the other packages/);
});
