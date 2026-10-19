import {
  View,
  type SearchResultScope,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import SearchPanel from "./search-panel.svelte";
import { SearchViewType } from "./search-view-type";

export { SearchViewType } from "./search-view-type";

export class SearchView extends View {
  private component: Record<string, unknown> | null = null;

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
          String(this.getState()["scope"])
        )
          ? this.getState()["scope"]
          : "files") as SearchResultScope,
        initialQuery:
          typeof this.getState()["query"] === "string"
            ? (this.getState()["query"] as string)
            : "",
      },
    }) as Record<string, unknown>;
  }

  async setState(state: Record<string, unknown>): Promise<void> {
    await super.setState(state);
    if (["files", "history", "all"].includes(String(state["scope"])))
      (
        this.component as {
          setSearchScope?: (scope: SearchResultScope) => void;
        } | null
      )?.setSearchScope?.(state["scope"] as SearchResultScope);
    if (typeof state["query"] === "string") {
      (
        this.component as { setSearchQuery?: (query: string) => void } | null
      )?.setSearchQuery?.(state["query"]);
    }
  }

  onunload(): void {
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}
