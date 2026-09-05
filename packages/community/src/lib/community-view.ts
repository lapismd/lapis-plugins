import { View, type App, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";

import CommunityPluginApplication from "./community-plugin-application.svelte";
import { CommunityViewType } from "./ids";

export class CommunityView extends View {
  #component: Record<string, unknown> | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return CommunityViewType;
  }

  getDisplayText(): string {
    return "Community";
  }

  getIcon(): string {
    return "messages-square";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.#component = mount(CommunityPluginApplication, {
      target: this.containerEl,
      props: { app: this.app as App },
    }) as Record<string, unknown>;
  }

  onunload(): void {
    if (this.#component) void unmount(this.#component);
    this.#component = null;
  }
}
