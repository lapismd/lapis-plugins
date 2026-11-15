import assert from "node:assert/strict";
import { test } from "node:test";
import { trackedFileList } from "./check-storybook-parity.mjs";

test("story composition lists the current Jujutsu workspace, including new stories", () => {
  const calls = [];
  const listed = trackedFileList((command, args) => {
    calls.push([command, args]);
    return "stories/Example.stories.ts\n";
  });
  assert.equal(listed, "stories/Example.stories.ts\n");
  assert.deepEqual(calls, [
    ["jj", ["root"]],
    ["jj", ["--no-pager", "file", "list"]],
  ]);
});

test("Git-only checkouts retain their tracked story inventory", () => {
  const calls = [];
  const listed = trackedFileList((command, args) => {
    calls.push([command, args]);
    if (command === "jj") throw Object.assign(Error("No jj repository"), { status: 1 });
    return "stories/Git.stories.ts\n";
  });
  assert.equal(listed, "stories/Git.stories.ts\n");
  assert.deepEqual(calls, [
    ["jj", ["root"]],
    ["git", ["ls-files"]],
  ]);
});

test("Jujutsu inventory failures cannot silently use a stale Git index", () => {
  assert.throws(
    () =>
      trackedFileList((command, args) => {
        assert.equal(command, "jj");
        if (args[0] === "root") return "/workspace";
        throw Error("Working-copy inventory failed");
      }),
    /Working-copy inventory failed/,
  );
});
