import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

test("an empty validation child retains its exact snapshot source and rejects later edits", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "lapis-source-snapshot-"));
  const jj = (...args) =>
    execFileSync(
      "jj",
      [
        "--config",
        'user.name="Validation"',
        "--config",
        'user.email="validation@localhost"',
        ...args,
      ],
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    ).trim();
  try {
    jj("git", "init", "--colocate");
    await writeFile(join(cwd, "source.md"), "Verified snapshot\n");
    const snapshot = jj("log", "-r", "@", "--no-graph", "-T", "commit_id");
    await assert.rejects(
      resolveSourceCommit({ cwd, env: {} }),
      /empty Jujutsu/
    );
    jj("new", snapshot, "-m", "Remote validation workspace");
    assert.equal(await resolveSourceCommit({ cwd, env: {} }), snapshot);
    await writeFile(join(cwd, "source.md"), "Unverified later edit\n");
    await assert.rejects(
      resolveSourceCommit({ cwd, env: {} }),
      /empty Jujutsu/
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
