import { Plugin, type App, type PluginManifest, type TFile } from "@lapis-notes/api";
import manifestSpec from "../manifest.json";
import xyflowStyles from "@xyflow/svelte/dist/style.css?inline";
import { mount, unmount } from "svelte";
import CanvasEmbed from "./canvas-embed.svelte";
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

const canvasStyleId = "plugin-canvas-styles";
const emptyCanvasDocument = JSON.stringify({ nodes: [], edges: [] }, null, 2);

function ensureCanvasStyles(): void {
  if (typeof document === "undefined") {
    return;
  }

  let styleEl = document.getElementById(
    canvasStyleId,
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = canvasStyleId;
  }

  // Load XYFlow's foundation styles before host/plugin overrides so runtime injection
  // does not clobber canvas-specific handle positioning rules.
  document.head.prepend(styleEl);
  styleEl.textContent = xyflowStyles;
}

function removeCanvasStyles(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.getElementById(canvasStyleId)?.remove();
}

export class CanvasPlugin extends Plugin {
  settings: CanvasSettings = { ...DEFAULT_CANVAS_SETTINGS };

  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    ensureCanvasStyles();
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
        containerEl.style.display = "flex";
        containerEl.style.flexDirection = "column";
        containerEl.style.width = "100%";
        containerEl.style.height = "24rem";
        containerEl.style.minHeight = "24rem";
        containerEl.style.overflow = "hidden";

        let activeComponent: object | null = null;
        let disposed = false;

        void app.vault
          .read(file)
          .then((value) => {
            if (disposed) {
              return;
            }

            activeComponent = mount(CanvasEmbed, {
              target: containerEl,
              props: {
                app,
                value,
                class: "canvas-embed__viewer",
              },
            });
          })
          .catch((error) => {
            if (disposed) {
              return;
            }

            containerEl.replaceChildren();
            const messageEl = document.createElement("p");
            messageEl.className = "canvas-view-error-card";
            messageEl.textContent =
              error instanceof Error
                ? `Unable to render this embedded canvas: ${error.message}`
                : `Unable to render this embedded canvas: ${String(error)}`;
            containerEl.appendChild(messageEl);
          });

        return {
          destroy() {
            disposed = true;
            if (activeComponent) {
              void unmount(activeComponent);
              activeComponent = null;
            }
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
    removeCanvasStyles();
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
