import packagedAgentSkills from "@lapis-notes/canvas/skills.json";
import { Plugin, mountComponent, type MountComponent, type App, type PluginManifest, type TFile } from "@lapis-notes/api";
import manifestSpec from "../manifest.json";
import type { ComponentProps } from "svelte";
import { inspectCanvasEmbedding, whenCanvasContainerConnected } from "./lib/canvas-embed-boundary";
import { CanvasEmbedSource, type CanvasEmbedSnapshot } from "./lib/canvas-embed-source";
import CanvasEmbed from "./canvas-embed.svelte";
import { clearCanvasClipboard } from "./lib/canvas-clipboard";
import { CanvasView } from "./canvas-view";
import {
  CANVAS_EMBED_EXTENSION,
  CANVAS_FILENAME_PATTERN,
  CANVAS_VIEW_TYPE,
} from "./lib/ids";

export interface CanvasSettings {
  snapToGrid: boolean;
  snapToObjects: boolean;
}

export type CanvasPluginEvents = {
  "settings-change": [settings: CanvasSettings];
};
export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  snapToGrid: false,
  snapToObjects: true,
};

const emptyCanvasDocument = JSON.stringify({ nodes: [], edges: [] }, null, 2);

export class CanvasPlugin extends Plugin {
  readonly packagedAgentSkills = packagedAgentSkills;
  settings: CanvasSettings = { ...DEFAULT_CANVAS_SETTINGS };

  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerView(CANVAS_VIEW_TYPE, (leaf) => new CanvasView(leaf, this), {
      kind: "file",
    });
    this.registerEditorView({
      id: `${CANVAS_VIEW_TYPE}-file`,
      viewType: CANVAS_VIEW_TYPE,
      label: "Canvas",
      filenamePatterns: [CANVAS_FILENAME_PATTERN],
      priority: "exclusive",
    });
    this.registerExtensions([CANVAS_EMBED_EXTENSION], CANVAS_VIEW_TYPE);
    this.register(
      this.app.embedRegistry.register(CANVAS_EMBED_EXTENSION, ({ app, containerEl, state }) => {
        const file = state.file as TFile | undefined;
        if (!file || file.extension?.toLowerCase() !== CANVAS_EMBED_EXTENSION) {
          return;
        }
        let activeComponent: MountComponent<ComponentProps<typeof CanvasEmbed>> | null = null;
        let disposed = false;
        let pending: CanvasEmbedSnapshot | null = null;
        const render = () => {
          if (disposed || !pending || !containerEl.isConnected) return;
          const snapshot = pending;
          const boundary = inspectCanvasEmbedding(containerEl, app, snapshot.sourcePath);
          if (boundary.blocked) {
            activeComponent?.destroy();
            activeComponent = null;
            const message = containerEl.ownerDocument.createElement("p");
            message.setAttribute("role", "note");
            message.className = "canvas-view-error-card";
            message.textContent = boundary.blocked === "cycle" ? "Canvas preview stopped: this canvas already appears in its parent chain." : "Canvas preview stopped at the nesting limit.";
            const open = containerEl.ownerDocument.createElement("button");
            open.type = "button";
            open.textContent = "Open original canvas";
            open.onclick = () => { const target = app.vault.getFileByPath(snapshot.sourcePath); if (target) void app.openFile(target).catch((error: unknown) => {
              message.setAttribute("role", "alert");
              message.textContent = `Unable to open canvas: ${error instanceof Error ? error.message : String(error)}`;
            }); };
            containerEl.replaceChildren(message, open);
            return;
          }
          if (activeComponent) {
            activeComponent.props.value = snapshot.value;
            activeComponent.props.sourcePath = snapshot.sourcePath;
            activeComponent.props.loadError = snapshot.error;
          } else {
            containerEl.replaceChildren();
            activeComponent = mountComponent(CanvasEmbed, {
              target: containerEl,
              props: { app, value: snapshot.value, sourcePath: snapshot.sourcePath, loadError: snapshot.error, compact: boundary.depth > 0, class: "canvas-embed__viewer" },
            });
          }
        };
        const stopConnection = whenCanvasContainerConnected(containerEl, render);
        const source = new CanvasEmbedSource(app, file, (snapshot) => { pending = snapshot; if (containerEl.isConnected) render(); });

        return {
          destroy() {
            if (disposed) return;
            disposed = true;
            source.destroy();
            stopConnection();
            activeComponent?.destroy();
            activeComponent = null;
            containerEl.replaceChildren();
          },
        };
      }),
    );

    this.addCommand({
      id: "create-new-canvas",
      name: "Create new canvas",
      callback: () => {
        void this.createNewCanvas();
      },
    });

    this.addRibbonIcon("layout-dashboard", "Create new canvas", () => {
      void this.createNewCanvas();
    });
  }

  onunload(): void {
    clearCanvasClipboard(this.app);
  }

  async updateSettings(next: Partial<CanvasSettings>): Promise<void> {
    this.settings = { ...this.settings, ...next };
    await this.saveData(this.settings);
    this.emit("settings-change", this.settings);
  }

  private async loadSettings(): Promise<void> {
    const stored = await this.loadData();
    this.settings = { ...DEFAULT_CANVAS_SETTINGS, ...(stored ?? {}) };
  }

  private async createNewCanvas(): Promise<void> {
    const path = this.app.fileManager.getAvailablePathForAttachment(
      "Untitled Canvas.canvas",
    );
    const file = await this.app.vault.create(path, emptyCanvasDocument);
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
    this.app.workspace.revealLeaf(leaf);
  }
}

export default CanvasPlugin;
