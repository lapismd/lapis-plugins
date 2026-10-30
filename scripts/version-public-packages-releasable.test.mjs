import assert from "node:assert/strict";
import test from "node:test";

import {
  changesetIsReleasable,
  heldPackageNames,
} from "./version-public-packages.mjs";

const heldOnly = `---
"@lapis-notes/bases": patch
"@lapis-notes/history": minor
---

Hold these for a later release.
`;

const mixed = `---
"@lapis-notes/ai": patch
"@lapis-notes/bases": patch
---

Publish the public package.
`;

const publicOnly = `---
"@lapis-notes/markdown": minor
---

Publish markdown.
`;

test("a held Bases or History changeset cannot open a version pull request", () => {
  assert.equal(changesetIsReleasable(heldOnly, heldPackageNames), false);
});

test("a changeset that bumps a published package can open a version pull request", () => {
  assert.equal(changesetIsReleasable(mixed, heldPackageNames), true);
  assert.equal(changesetIsReleasable(publicOnly, heldPackageNames), true);
});

test("an unreadable changeset cannot open a version pull request", () => {
  assert.equal(changesetIsReleasable("not a changeset\n", heldPackageNames), false);
});
