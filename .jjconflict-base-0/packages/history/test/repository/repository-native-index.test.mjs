import test from "node:test";
import assert from "node:assert/strict";
import { nativeIndexedHistory } from "../../src/lib/repository/controllers/native-indexed-search.ts";

const progress = { generation: 7, indexed: 2, omitted: 1, complete: false };
const page = { status: progress, hits: [], next: "saved-cursor", reset: false };
const context = {
  text: "saved bytes",
  start: 0,
  end: 1,
  before: false,
  after: true,
};

test("native History adapter forwards saved query and context through one admitted port", async () => {
  const calls = [];
  const service = nativeIndexedHistory({
    async call(command) {
      calls.push(command);
      return command.kind === "query"
        ? page
        : command.kind === "context"
          ? context
          : progress;
    },
  });
  assert.strictEqual(await service.start(), progress);
  assert.strictEqual(await service.status(), progress);
  const search = {
    expression: { type: "term", field: "content", value: "saved" },
    case_sensitive: true,
    cursor: "previous-page",
    limit: 42,
  };
  assert.strictEqual(await service.query(search), page);
  const request = { commit: "a".repeat(40), path: "Note.md", start: 0, end: 8 };
  assert.strictEqual(await service.context(request), context);
  assert.deepEqual(calls, [
    { kind: "start" },
    { kind: "status" },
    { kind: "query", search },
    { kind: "context", ...request },
  ]);
  assert.equal("step" in service, false);
  assert.equal("stop" in service, false);
});

test("native History failures propagate without another request or renderer fallback", async () => {
  const failure = new Error("The saved source was replaced");
  let calls = 0;
  const service = nativeIndexedHistory({
    async call() {
      calls++;
      throw failure;
    },
  });
  await assert.rejects(service.start(), (error) => error === failure);
  assert.equal(calls, 1);
});

test("native History rejects a response for another command", async () => {
  const service = nativeIndexedHistory({
    async call() {
      return context;
    },
  });
  await assert.rejects(service.status(), /Invalid history index status/);
  await assert.rejects(service.query({}), /Invalid indexed history response/);
  const other = nativeIndexedHistory({
    async call() {
      return progress;
    },
  });
  await assert.rejects(other.context({}), /Invalid saved match context/);
});

test("native History preserves Desktop validation of immutable identities and bounded pages", async () => {
  const hit = {
    record: {
      revision: {
        checkpoint: {
          operation: "c".repeat(128),
          commit: "a".repeat(40),
          change_id: "d".repeat(32),
          description: "Saved",
          timestamp_millis: 42,
        },
        author: "Author",
        email: "author@example.test",
      },
      parents: [],
      path: "Note.md",
      content_id: "e".repeat(64),
      deleted: false,
      previous: null,
      unavailable: false,
    },
    excerpt: "saved",
    line: 1,
  };
  const valid = { ...page, hits: [hit] };
  let response = valid;
  const service = nativeIndexedHistory({
    async call() {
      return response;
    },
  });
  assert.strictEqual(await service.query({}), valid);
  const invalid = [
    { ...valid, hits: Array(101).fill(hit) },
    { ...valid, next: "x".repeat(513) },
    { ...valid, status: { ...progress, generation: -1 } },
    {
      ...valid,
      hits: [{ ...hit, record: { ...hit.record, path: "../private.md" } }],
    },
    {
      ...valid,
      hits: [{ ...hit, record: { ...hit.record, path: ".lapis/app.json" } }],
    },
    {
      ...valid,
      hits: [{ ...hit, record: { ...hit.record, parents: ["invalid"] } }],
    },
    {
      ...valid,
      hits: [{ ...hit, record: { ...hit.record, content_id: "invalid" } }],
    },
    {
      ...valid,
      hits: [
        {
          ...hit,
          record: {
            ...hit.record,
            revision: {
              ...hit.record.revision,
              checkpoint: {
                ...hit.record.revision.checkpoint,
                operation: "short",
              },
            },
          },
        },
      ],
    },
  ];
  for (const value of invalid) {
    response = value;
    await assert.rejects(service.query({}), /Invalid/);
  }
});

test("native History preserves Desktop saved-context size and line validation", async () => {
  for (const value of [
    { ...context, text: "x".repeat(32769) },
    { ...context, start: -1 },
    { ...context, end: -1 },
    { ...context, start: 8, end: 4 },
    { ...context, before: "yes" },
  ]) {
    const service = nativeIndexedHistory({
      async call() {
        return value;
      },
    });
    await assert.rejects(service.context({}), /Invalid saved match context/);
  }
});
