import {
  View,
  type WorkspaceLeaf,
  type ViewStateResult,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { SyncPlugin } from "./sync-plugin";
import {
  SYNC_VIEW_TYPES,
  SyncViewState,
  type SyncPaneKind,
} from "./view-state.svelte";
import WorkspacePane from "./ui/WorkspacePane.svelte";

export class SyncView extends View {
  #component: Record<string, unknown> | null = null;
  readonly presentationState = new SyncViewState();
  constructor(
    leaf: WorkspaceLeaf,
    readonly plugin: SyncPlugin,
    readonly kind: SyncPaneKind,
  ) {
    super(leaf);
  }
  getViewType(): string {
    return SYNC_VIEW_TYPES[this.kind];
  }
  getDisplayText(): string {
    return {
      sync: "Sync",
      history: "Sync History",
      "file-history": "Sync File History",
      compare: "Compare",
      merge: "Merge histories",
    }[this.kind];
  }
  getIcon(): string {
    return {
      sync: "refresh-cw",
      history: "history",
      "file-history": "file-clock",
      compare: "diff",
      merge: "git-merge",
    }[this.kind];
  }
  getState(): Record<string, unknown> {
    return { ...this.presentationState.values };
  }
  async setState(
    state: Record<string, unknown>,
    result?: ViewStateResult,
  ): Promise<void> {
    this.presentationState.set(state);
    await super.setState(state, result);
  }
  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }
  protected onClose(): Promise<void> {
    return Promise.resolve();
  }
  onload(): void {
    Object.assign(this.containerEl.style, {
      display: "flex",
      width: "100%",
      height: "100%",
      minWidth: "0",
      minHeight: "0",
      overflow: "hidden",
    });
    this.#component = mount(WorkspacePane, {
      target: this.containerEl,
      props: {
        plugin: this.plugin,
        kind: this.kind,
        viewState: this.presentationState,
      },
    });
  }
  async onunload(): Promise<void> {
    if (this.#component) await unmount(this.#component);
    this.#component = null;
  }
}
