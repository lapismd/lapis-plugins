import assert from "node:assert/strict";
import { test } from "node:test";
import { trackedFileList } from "./check-storybook-parity.mjs";

test("story composition lists files with git when jj is not installed", () => {
  const calls = [];
  const listed = trackedFileList((command, args) => {
    calls.push([command, args]);
    if (command === "jj") {
      const error = new Error("spawn jj ENOENT");
      error.code = "ENOENT";
      throw error;
    }
    return "stories/Example.stories.ts\n";
  });
  assert.equal(listed, "stories/Example.stories.ts\n");
  assert.deepEqual(calls, [
    ["jj", ["file", "list"]],
    ["git", ["ls-files"]],
  ]);
});

test("story composition lists files with git in a plain Git checkout", () => {
  const listed = trackedFileList((command) => {
    if (command === "jj") {
      const error = new Error("no repo");
      error.status = 1;
      error.stderr = 'Error: There is no jj repo in "/work"\n';
      throw error;
    }
    return "packages/canvas/package.json\n";
  });
  assert.equal(listed, "packages/canvas/package.json\n");
});

test("a jj failure other than a missing repository still fails", () => {
  assert.throws(
    () =>
      trackedFileList(() => {
        const error = new Error("broken");
        error.status = 2;
        error.stderr = "conflict";
        throw error;
      }),
    /broken/
  );
});
