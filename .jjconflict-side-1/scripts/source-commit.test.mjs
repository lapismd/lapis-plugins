import assert from "node:assert/strict";
import test from "node:test";

import { resolveSourceCommit } from "./lib/source-commit.mjs";

test("release source uses the latest committed JJ change", async () => {
  const calls = [];
  const commit = await resolveSourceCommit({
    cwd: "/repo",
    env: {},
    async exec(command, args, options) {
      calls.push({ command, args, options });
      if (args[0] === "root") return { stdout: "/repo\n" };
      if (args.includes("empty")) return { stdout: "true\n" };
      return { stdout: "committed-source\n" };
    },
  });
  assert.equal(commit, "committed-source");
  assert.deepEqual(calls.at(-1).args, [
    "--no-pager",
    "log",
    "-r",
    "latest(::@ & ~empty(), 1)",
    "--no-graph",
    "-T",
    "commit_id",
  ]);
});

test("release source rejects a non-empty JJ working copy", async () => {
  await assert.rejects(
    resolveSourceCommit({
      cwd: "/repo",
      env: {},
      async exec(_command, args) {
        if (args[0] === "root") return { stdout: "/repo\n" };
        return { stdout: "false\n" };
      },
    }),
    /requires an empty Jujutsu working-copy commit/
  );
});

test("release source falls back to Git outside a JJ checkout", async () => {
  const commit = await resolveSourceCommit({
    cwd: "/repo",
    env: {},
    async exec(command) {
      if (command === "jj") throw new Error("not a JJ checkout");
      return { stdout: "git-source\n" };
    },
  });
  assert.equal(commit, "git-source");
});

test("release source prefers the workflow commit", async () => {
  const commit = await resolveSourceCommit({
    cwd: "/repo",
    env: { GITHUB_SHA: "workflow-source" },
    async exec() {
      throw new Error("VCS must not run when GITHUB_SHA is present");
    },
  });
  assert.equal(commit, "workflow-source");
});
