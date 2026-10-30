import { afterEach, expect, it, vi } from "vitest";
import {
  parseSearchQueryAst,
  type SearchResultProvider,
} from "@lapis-notes/api";
import { registerHistoryResultProvider } from "./search-provider.js";
import type { RepositoryPlugin } from "../repository-plugin.js";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const close of cleanups.splice(0)) await close();
  vi.useRealTimers();
});
const status = { generation: 2, indexed: 1, omitted: 0, complete: false };
const checkpoint = {
  operation: "c".repeat(128),
  commit: "a".repeat(40),
  change_id: "e".repeat(32),
  description: "Saved note",
  timestamp_millis: 42,
};
function fixture() {
  vi.useFakeTimers();
  let provider!: SearchResultProvider;
  const progress = { report: vi.fn(), complete: vi.fn(), fail: vi.fn() };
  const capture = vi.fn();
  const openBlame = vi.fn();
  const dispose = vi.fn();
  const plugin = {
    id: "repository-history",
    feedback: () => ({ report: vi.fn(), recovered: vi.fn() }),
    app: {
      notifications: { createProgress: () => progress },
      workspace: { onLayoutReady: vi.fn() },
    },
    backup: { controller: { subscribe: capture } },
    registerSearchResultProvider: (
      _id: string,
      value: SearchResultProvider,
    ) => {
      provider = value;
      return { dispose };
    },
    addCommand: vi.fn(),
    openBlame,
  } as unknown as RepositoryPlugin;
  const hit = {
    record: {
      revision: { checkpoint, author: "Author", email: "author@example.test" },
      parents: [],
      path: "Note.md",
      content_id: "b".repeat(64),
      deleted: false,
      previous: null,
      unavailable: false,
    },
    excerpt: "saved note",
    line: 4,
  };
  const service = {
    start: vi.fn(async () => status),
    status: vi.fn(async () => status),
    step: vi.fn(),
    stop: vi.fn(),
    query: vi.fn(async () => ({
      status,
      hits: [hit],
      next: null,
      reset: false,
    })),
    context: vi.fn(async () => ({
      text: "saved context",
      start: 0,
      end: 8,
      before: false,
      after: true,
    })),
  };
  const close = registerHistoryResultProvider(plugin, service);
  cleanups.push(close);
  const request = {
    text: "saved",
    query: parseSearchQueryAst("saved"),
    mode: "lexical" as const,
    caseSensitive: false,
    limit: 100,
    signal: new AbortController().signal,
  };
  return { provider, service, request, capture, openBlame, close, dispose };
}
it("observes native progress without capture or incomplete-query scheduling", async () => {
  const { provider, service, request, capture, dispose, close } = fixture();
  await Promise.resolve();
  const page = await provider.search(request);
  expect(page.status?.phase).toBe("indexing");
  expect(service.start).toHaveBeenCalledTimes(1);
  expect(service.step).not.toHaveBeenCalled();
  expect(service.stop).not.toHaveBeenCalled();
  expect(capture).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1000);
  expect(service.status).toHaveBeenCalledTimes(1);
  await close();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(service.status).toHaveBeenCalledTimes(1);
  expect(dispose).toHaveBeenCalled();
});
it("preserves immutable activation and expands saved context", async () => {
  const { provider, service, request, openBlame } = fixture();
  const page = await provider.search(request),
    hit = page.hits[0]!;
  expect(hit.target).toMatchObject({
    operation: checkpoint.operation,
    commit: checkpoint.commit,
    path: "Note.md",
  });
  await provider.activate(hit);
  expect(openBlame).toHaveBeenCalledWith(
    checkpoint.operation,
    checkpoint.commit,
    "Note.md",
  );
  const expanded = await provider.expand!(
    hit,
    hit.matches[0]!,
    "before",
    request.signal,
  );
  expect(service.context).toHaveBeenCalledWith({
    commit: checkpoint.commit,
    path: "Note.md",
    start: 0,
    end: 4,
  });
  expect(expanded.text).toBe("saved context");
});
