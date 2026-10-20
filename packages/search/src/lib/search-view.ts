import {
  View,
  type SearchResultScope,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import SearchPanel from "./search-panel.svelte";
import { SearchViewType } from "./search-view-type";

export { SearchViewType } from "./search-view-type";

type SearchPanelState = { query: string; scope: SearchResultScope };
type SearchPanelInstance = {
  getSearchState?(): SearchPanelState;
  setSearchScope?(scope: SearchResultScope): void;
  setSearchQuery?(query: string): void;
};

export class SearchView extends View {
  private component: SearchPanelInstance | null = null;
  private snapshot?: SearchPanelState;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return SearchViewType;
  }

  getDisplayText(): string {
    return "Search";
  }

  getIcon(): string {
    return "search";
  }

  getState(): Record<string, unknown> {
    return {
      ...super.getState(),
      ...(this.component?.getSearchState?.() ?? this.snapshot),
    };
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.component = mount(SearchPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        initialScope: (["files", "history", "all"].includes(
          String(this.getState()["scope"]),
        )
          ? this.getState()["scope"]
          : "files") as SearchResultScope,
        initialQuery:
          typeof this.getState()["query"] === "string"
            ? (this.getState()["query"] as string)
            : "",
        onStateChange: () => {
          if (this.component)
            this.app.workspace.requestSaveLayout({
              source: "api",
              operation: "search-state",
            });
        },
      },
    }) as SearchPanelInstance;
  }

  async setState(state: Record<string, unknown>): Promise<void> {
    this.snapshot = undefined;
    await super.setState(state);
    if (["files", "history", "all"].includes(String(state["scope"])))
      this.component?.setSearchScope?.(state["scope"] as SearchResultScope);
    if (typeof state["query"] === "string") {
      this.component?.setSearchQuery?.(state["query"]);
    }
  }

  onunload(): void {
    this.snapshot = this.component?.getSearchState?.() ?? this.snapshot;
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}
