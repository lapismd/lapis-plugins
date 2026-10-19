import { describe, expect, it, vi } from "vitest";
import {
  SearchResultProviderRegistry,
  type SearchProviderHit,
  type SearchResultProvider,
} from "@lapis-notes/api";
import { SearchProviderController } from "./search-provider-controller";
import { groupProviderResults } from "./search-provider-groups";
const hit = (id: string): SearchProviderHit => ({
  id,
  groupId: "deleted.md",
  title: "deleted",
  path: "deleted.md",
  matches: [{ id: "text", field: "content", text: id, ranges: [] }],
  target: { commit: id },
});
const input = (text = "find") => ({
  text,
  caseSensitive: false,
  mode: "lexical" as const,
  limit: 100,
});
const provider = (
  search: SearchResultProvider["search"]
): SearchResultProvider => ({
  id: "fixture",
  label: "History",
  scope: "history",
  fields: ["path"],
  modes: ["lexical"],
  search,
  activate: async () => {},
});
const drain = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("provider search coordination", () => {
  it("publishes partial pages, merges stable identities and groups deleted files without TFiles", async () => {
    const registry = new SearchResultProviderRegistry();
    let finish!: (value: {
      generation: string;
      hits: SearchProviderHit[];
    }) => void;
    registry.register(
      provider(async ({ cursor }) =>
        cursor
          ? new Promise((resolve) => {
              finish = resolve;
            })
          : { generation: "one", hits: [hit("a")], next: "next" }
      )
    );
    const controller = new SearchProviderController(registry, vi.fn());
    let rows: Parameters<typeof groupProviderResults>[0] = [];
    controller.subscribe((next) => (rows = next));
    controller.search(input(), true);
    await drain();
    expect(rows[0]?.hits.map((h) => h.id)).toEqual(["a"]);
    expect(rows[0]?.busy).toBe(true);
    finish({ generation: "one", hits: [hit("a"), hit("b")] });
    await drain();
    expect(groupProviderResults(rows)[0]?.versions).toHaveLength(2);
    expect(rows[0]?.busy).toBe(false);
    controller.close();
  });
  it("fences obsolete replies and isolates failing peers", async () => {
    const registry = new SearchResultProviderRegistry();
    let finish!: (value: {
      generation: string;
      hits: SearchProviderHit[];
    }) => void;
    registry.register(
      provider(async ({ text }) =>
        text === "old"
          ? new Promise((resolve) => {
              finish = resolve;
            })
          : { generation: "two", hits: [hit("new")] }
      )
    );
    registry.register({
      ...provider(async () => {
        throw Error("offline");
      }),
      id: "failed",
    });
    const report = vi.fn();
    const controller = new SearchProviderController(registry, report);
    let rows: Parameters<typeof groupProviderResults>[0] = [];
    controller.subscribe((next) => (rows = next));
    controller.search(input("old"), true);
    controller.search(input("new"), true);
    await drain();
    finish({ generation: "one", hits: [hit("old")] });
    await drain();
    expect(rows[0]?.hits[0]?.id).toBe("new");
    expect(report).toHaveBeenCalledTimes(1);
    controller.close();
  });
  it("does not silently weaken unsupported filters or semantic retrieval", async () => {
    const registry = new SearchResultProviderRegistry();
    const search = vi.fn();
    registry.register(provider(search));
    const controller = new SearchProviderController(registry, vi.fn());
    let rows: Parameters<typeof groupProviderResults>[0] = [];
    controller.subscribe((next) => (rows = next));
    controller.search(input("tag:#old"), true);
    expect(rows[0]?.unavailable).toContain("tag");
    controller.search({ ...input(), mode: "vector" }, true);
    expect(rows[0]?.unavailable).toContain("text search only");
    expect(search).not.toHaveBeenCalled();
    controller.close();
  });
});

it("groups identical contents while retaining each matching checkpoint target", () => {
  const source = provider(async () => ({ generation: "one", hits: [] }));
  const first = { ...hit("first"), timestamp: 200, version: { id: "first", contentId: "same-body", label: "Reintroduced", author: "Ada", timestamp: 200 } };
  const old = { ...hit("old"), timestamp: 100, version: { id: "old", contentId: "same-body", label: "Original", author: "Grace", timestamp: 100 } };
  const groups = groupProviderResults([{ provider: source, hits: [first, old], busy: false }]);
  expect(groups[0]?.versions).toHaveLength(1);
  expect(groups[0]?.versions[0]?.hit.version?.references?.map((ref) => ref.target.commit)).toEqual(["first", "old"]);
  expect(groups[0]?.versions[0]?.hit.target.commit).toBe("first");
});
