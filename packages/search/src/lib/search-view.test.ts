import { beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  query: "",
  scope: "files",
  props: {} as Record<string, unknown>,
  save: vi.fn(),
}));
vi.mock("@lapis-notes/api", () => ({
  View: class {
    app = { workspace: { requestSaveLayout: fixture.save } };
    containerEl = {};
    state: Record<string, unknown> = {};
    getState() {
      return this.state;
    }
    async setState(state: Record<string, unknown>) {
      this.state = state;
    }
  },
}));
vi.mock("./search-panel.svelte", () => ({ default: {} }));
vi.mock("svelte", () => ({
  mount: vi.fn((_component, { props }) => {
    fixture.props = props;
    fixture.query = props.initialQuery;
    fixture.scope = props.initialScope;
    return {
      getSearchState: () => ({ query: fixture.query, scope: fixture.scope }),
      setSearchQuery: (query: string) => {
        fixture.query = query;
      },
      setSearchScope: (scope: string) => {
        fixture.scope = scope;
      },
    };
  }),
  unmount: vi.fn(async () => {}),
}));
import { SearchView } from "./search-view";
import type { WorkspaceLeaf } from "@lapis-notes/api";

beforeEach(() => {
  fixture.save.mockClear();
});
async function view() {
  const current = new SearchView({} as WorkspaceLeaf);
  await current.setState({
    query: "initial",
    scope: "history",
    retained: true,
  });
  current.onload();
  return current;
}
it("reads current authored text and scope synchronously before layout persistence", async () => {
  const current = await view();
  fixture.query = 'content:old author:"Ada"';
  fixture.scope = "all";
  expect(current.getState()).toEqual({
    query: fixture.query,
    scope: "all",
    retained: true,
  });
});
it("requests a workspace layout save when the live panel changes", async () => {
  await view();
  expect(fixture.props.onStateChange).toBeTypeOf("function");
  (fixture.props.onStateChange as () => void)();
  expect(fixture.save).toHaveBeenCalledWith({
    source: "api",
    operation: "search-state",
  });
});
it("retains the final live snapshot after unmount", async () => {
  const current = await view();
  fixture.query = "latest typed query";
  fixture.scope = "files";
  current.onunload();
  expect(current.getState()).toEqual({
    query: fixture.query,
    scope: "files",
    retained: true,
  });
});
it("retains programmatic updates and unknown saved fields", async () => {
  const current = await view();
  await current.setState({
    query: "replacement",
    scope: "all",
    retained: "new",
  });
  expect(current.getState()).toEqual({
    query: "replacement",
    scope: "all",
    retained: "new",
  });
});
it("preserves saved state before the component mounts", async () => {
  const current = new SearchView({} as WorkspaceLeaf);
  await current.setState({ query: "cold saved query", scope: "history" });
  expect(current.getState()).toEqual({
    query: "cold saved query",
    scope: "history",
  });
});
