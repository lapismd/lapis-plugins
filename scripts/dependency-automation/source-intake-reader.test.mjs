import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sourceIntakeReader } from "./source-intake-reader.mjs";

const parent = "a".repeat(40);
const diff = [
  "diff --git a/package.json b/package.json",
  "--- a/package.json",
  "+++ b/package.json",
  "@@ -1 +1 @@",
  '-{"old":true}',
  '+{"new":true}',
  "",
].join("\n");

test("captured Git ancestry owns both source reads and changed scope", () => {
  const commands = [];
  const reader = sourceIntakeReader(
    "/controlled-plugins-git-fixture",
    (binary, args) => {
      commands.push([binary, ...args]);
      if (args[0] === "rev-parse") return parent;
      if (args[0] === "show") return '{"old":true}';
      return diff;
    },
    false,
  );
  assert.equal(reader.sourceSha, parent);
  assert.equal(reader("package.json"), '{"old":true}');
  assert.deepEqual(reader.changedFiles(), ["package.json"]);
  assert(commands.every(([, ...args]) => !args.includes("HEAD^1") || args[0] === "rev-parse"));
  assert(commands.some(([, ...args]) => args.includes(parent)));
});

test("injected VCS execution ignores ambient pull-request transport", () => {
  const root = mkdtempSync(join(tmpdir(), "plugins-ambient-pr-base-"));
  const eventPath = join(root, "event.json");
  writeFileSync(
    eventPath,
    JSON.stringify({ pull_request: { base: { sha: "b".repeat(40) } } }),
  );
  const previous = {
    eventName: process.env.GITHUB_EVENT_NAME,
    eventPath: process.env.GITHUB_EVENT_PATH,
  };
  process.env.GITHUB_EVENT_NAME = "pull_request";
  process.env.GITHUB_EVENT_PATH = eventPath;
  const commands = [];
  try {
    const reader = sourceIntakeReader(
      root,
      (binary, args) => {
        commands.push([binary, ...args]);
        if (args[0] === "rev-parse") return parent;
        return diff;
      },
      false,
    );
    assert.equal(reader.sourceSha, parent);
    reader.changedFiles();
  } finally {
    if (previous.eventName === undefined) delete process.env.GITHUB_EVENT_NAME;
    else process.env.GITHUB_EVENT_NAME = previous.eventName;
    if (previous.eventPath === undefined) delete process.env.GITHUB_EVENT_PATH;
    else process.env.GITHUB_EVENT_PATH = previous.eventPath;
    rmSync(root, { recursive: true, force: true });
  }
  assert(commands.some(([, command]) => command === "rev-parse"));
  assert(commands.every(([, ...args]) => !args.includes("b".repeat(40))));
});

test("pull-request intake uses the immutable event base across repair commits", () => {
  const root = mkdtempSync(join(tmpdir(), "plugins-pr-base-"));
  const eventPath = join(root, "event.json");
  writeFileSync(
    eventPath,
    JSON.stringify({ pull_request: { base: { sha: parent } } }),
  );
  const commands = [];
  const reader = sourceIntakeReader(
    root,
    (binary, args) => {
      commands.push([binary, ...args]);
      if (args[0] === "show") return '{"old":true}';
      return diff;
    },
    false,
    { GITHUB_EVENT_NAME: "pull_request", GITHUB_EVENT_PATH: eventPath },
  );
  try {
    assert.equal(reader.sourceSha, parent);
    assert.equal(reader("package.json"), '{"old":true}');
    assert.deepEqual(reader.changedFiles(), ["package.json"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  assert(!commands.some(([, command]) => command === "rev-parse"));
  assert(commands.every(([, ...args]) => !args.includes("HEAD^1")));
  assert(commands.some(([, ...args]) => args.includes(parent)));
});

test("missing captured ancestry cannot fall back to a working-tree diff", () => {
  assert.throws(
    () => sourceIntakeReader("/controlled-plugins-git-fixture", () => "", false),
    /Source intake ancestry unavailable/,
  );
});
