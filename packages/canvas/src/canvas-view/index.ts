import {
  FileView,
  mountComponent,
  type MountComponent,
  type Menu,
  type App,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import type { ComponentProps } from "svelte";
import { CanvasSaveQueue } from "../lib/canvas-save-queue";
import CanvasViewComponent from "./canvas-view.svelte";
import type { CanvasPlugin, CanvasSettings } from "../canvas-plugin";

export const CanvasViewType = "lapis-canvas";
type CanvasSaveState = "saved" | "saving" | "error";

export class CanvasView extends FileView {
  private component: MountComponent<ComponentProps<typeof CanvasViewComponent>> | null = null;
  private rawJson = "";
  private parseError: string | null = null;
  private saveState: CanvasSaveState = "saved";
  private saves: CanvasSaveQueue | null = null;
  private saveError: string | null = null;
  private loadGeneration = 0;
  private transitionToken = 0;
  private transitioning = false;
  private wasInert = false;
  private plugin: CanvasPlugin | null;

  constructor(leaf?: WorkspaceLeaf, plugin?: CanvasPlugin) {
    super(leaf);
    this.plugin = plugin ?? null;
  }

  onload(): void {
    if (this.plugin) {
      this.registerEvent(
        this.plugin.on("settings-change", (settings: CanvasSettings) => {
          if (!this.component?.props) return;
          this.component.props.snapToGrid = settings.snapToGrid;
          this.component.props.snapToObjects = settings.snapToObjects;
        }),
      );
    }
    this.render();
  }

  onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string): void {
    super.onPaneMenu(menu, source);
    if (!this.plugin) {
      return;
    }
    const plugin = this.plugin;
    menu.addItem((item) => {
      item
        .setSection("canvas")
        .setTitle("Snap to grid")
        .setChecked(plugin.settings.snapToGrid)
        .onClick(() => {
          void plugin
            .updateSettings({ snapToGrid: !plugin.settings.snapToGrid })
            .then(() => {
              item.setChecked(plugin.settings.snapToGrid);
            });
        });
    });
    menu.addItem((item) => {
      item
        .setSection("canvas")
        .setTitle("Snap to objects")
        .setChecked(plugin.settings.snapToObjects)
        .onClick(() => {
          void plugin
            .updateSettings({ snapToObjects: !plugin.settings.snapToObjects })
            .then(() => {
              item.setChecked(plugin.settings.snapToObjects);
            });
        });
    });
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected async onClose(): Promise<void> {
    await this.protectTransition(async () => { await this.saves?.flush(); });
  }

  async onLoadFile(file: TFile): Promise<void> {
    return this.protectTransition(async () => {
      const generation = ++this.loadGeneration;
      const app = this.app;
      const target = file.copy();
      await this.saves?.flush();
      const result = await this.readFile(target, app);
      await this.saves?.flush();
      if (generation !== this.loadGeneration) return;
      if (this.app !== app) throw new Error("Canvas load application changed");
      this.file = target;
      this.rawJson = result.value;
      this.parseError = result.error;
      this.saveError = null;
      this.saveState = "saved";
      const destination = this.file;
      const saves = new CanvasSaveQueue(
        (value) => app.vault.modify(destination, value),
        (status, error) => {
          if (this.saves !== saves) return;
          this.saveState = status;
          this.saveError = error === undefined ? null : error instanceof Error ? error.message : String(error);
          this.updateComponentProps();
        },
      );
      this.saves = saves;
      await this.setState({ ...this.getState(), file: target.path });
      if (generation !== this.loadGeneration) return;
      if (this.loaded) {
        this.render();
      }
    });
  }

  async onUnloadFile(): Promise<void> {
    return this.protectTransition(async () => {
      const generation = ++this.loadGeneration;
      await this.saves?.flush();
      if (generation !== this.loadGeneration) return;
      this.saves = null;
      this.file = null;
      this.rawJson = "";
      this.parseError = null;
      await this.setState({ ...this.getState(), file: "" });
      if (this.loaded) {
        this.render();
      }
    });
  }

  async onRename(file: TFile): Promise<void> {
    await this.onLoadFile(file);
  }

  canAcceptExtension(extension: string): boolean {
    return extension.toLowerCase() === "canvas";
  }

  onunload(): void {
    ++this.loadGeneration;
    const saves = this.saves;
    if (saves) {
      void saves.flush().catch((error: unknown) => {
        console.error("Canvas changes could not be saved during teardown", error);
      });
    }
    this.component?.destroy();
    this.component = null;
  }

  getViewType(): string {
    return CanvasViewType;
  }

  getDisplayText(): string {
    return this.file?.basename ?? "Canvas";
  }

  getIcon(): string {
    return "layout-dashboard";
  }

  async reloadFromDisk(): Promise<void> {
    if (this.file) await this.onLoadFile(this.file);
  }

  private async readFile(file: TFile, app: App): Promise<{ value: string; error: string | null }> {
    try {
      return { value: await app.vault.read(file), error: null };
    } catch (error) {
      return { value: "", error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async protectTransition(operation: () => Promise<void>): Promise<void> {
    const container = this.containerEl;
    const token = ++this.transitionToken;
    if (!this.transitioning) this.wasInert = Boolean(container.inert);
    this.transitioning = true;
    container.inert = true;
    try {
      await operation();
    } finally {
      if (token === this.transitionToken) {
        container.inert = this.wasInert;
        this.transitioning = false;
      }
    }
  }

  private updateComponentProps(): void {
    if (!this.component?.props) {
      return;
    }

    this.component.props.parseError = this.parseError;
    this.component.props.saveState = this.saveState;
    this.component.props.saveError = this.saveError;
  }

  private render(): void {
    if (!this.containerEl) {
      return;
    }

    if (this.component) {
      this.component.destroy();
      this.component = null;
    }

    this.containerEl.empty();
    const saves = this.saves;
    this.component = mountComponent(CanvasViewComponent, {
      target: this.containerEl,
      props: {
        app: this.app,
        rawJson: this.rawJson,
        parseError: this.parseError,
        saveState: this.saveState,
        saveError: this.saveError,
        snapToGrid: this.plugin?.settings.snapToGrid ?? false,
        snapToObjects: this.plugin?.settings.snapToObjects ?? true,
        onDocumentChange: (nextRawJson: string) => {
          if (!saves || this.saves !== saves) return;
          this.rawJson = nextRawJson;
          saves.enqueue(nextRawJson);
        },
        onRetrySave: () => {
          void saves?.flush().catch(() => undefined);
        },
        onReload: () => {
          void this.reloadFromDisk().catch(() => undefined);
        },
      },
    });
  }
}

export { CanvasViewComponent, CanvasViewComponent as Root };
