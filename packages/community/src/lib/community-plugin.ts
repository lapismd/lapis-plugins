import {
  Plugin,
  type App,
  type PluginManifest,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import manifestSpec from "@lapis-notes/community/manifest.json";

import { CommunityView } from "./community-view";
import { CommunityViewType } from "./ids";

export class CommunityPlugin extends Plugin {
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest
  ) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    this.registerView(CommunityViewType, (leaf) => new CommunityView(leaf), {
      kind: "command",
      command: {
        id: "open-community",
        name: "Open Community",
        callback: () => void this.openCommunity(),
      },
    });
    this.addRibbonIcon("messages-square", "Open Community", () => {
      void this.openCommunity();
    });
  }

  async openCommunity(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(CommunityViewType)[0];
    const leaf =
      existing ?? (this.app.workspace.getLeaf(true) as WorkspaceLeaf);
    if (!existing) {
      await leaf.setViewState(
        { type: CommunityViewType, state: {} },
        { history: true }
      );
    }
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: "open-community",
    });
    await this.app.workspace.revealLeaf(leaf);
  }
}

export default CommunityPlugin;
