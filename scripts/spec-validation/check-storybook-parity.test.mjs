import assert from "node:assert/strict";
import { test } from "node:test";
import { trackedFileList } from "./check-storybook-parity.mjs";

test("story composition lists tracked files with git ls-files", () => {
  const calls = [];
  const listed = trackedFileList((command, args) => {
    calls.push([command, args]);
    return "stories/Example.stories.ts\n";
  });
  assert.equal(listed, "stories/Example.stories.ts\n");
  assert.deepEqual(calls, [["git", ["ls-files"]]]);
});
