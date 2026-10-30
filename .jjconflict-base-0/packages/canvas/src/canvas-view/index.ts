import {
  FileView,
  type Menu,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import CanvasViewComponent from "./canvas-view.svelte";
import type { CanvasPlugin, CanvasSettings } from "../canvas-plugin";

export const CanvasViewType = "lapis-canvas";
type CanvasSaveState = "saved" | "saving" | "error";

export class CanvasView extends FileView {
  private component: any = null;
  private rawJson = "";
  private parseError: string | null = null;
  private saveState: CanvasSaveState = "saved";
  private queuedRawJson: string | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
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

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.file = file.copy();
    await this.readFile(file);
    await this.setState({ ...this.getState(), file: file.path });
    if (this.loaded) {
      this.render();
    }
  }

  async onUnloadFile(): Promise<void> {
    this.file = null;
    this.rawJson = "";
    this.parseError = null;
    await this.setState({ ...this.getState(), file: "" });
    if (this.loaded) {
      this.render();
    }
  }

  async onRename(file: TFile): Promise<void> {
    this.file = file.copy();
    await this.setState({ ...this.getState(), file: file.path });
    if (this.loaded) {
      this.render();
    }
  }

  canAcceptExtension(extension: string): boolean {
    return extension.toLowerCase() === "canvas";
  }

  onunload(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    if (this.queuedRawJson && this.file) {
      void this.app.vault.modify(this.file, this.queuedRawJson);
    }

    if (this.component) {
      unmount(this.component);
      this.component = null;
    }
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
    if (!this.file) {
      return;
    }

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    this.queuedRawJson = null;
    await this.readFile(this.file);
    this.saveState = "saved";
    this.render();
  }

  private async readFile(file: TFile): Promise<void> {
    try {
      this.rawJson = await this.app.vault.read(file);
      this.parseError = null;
    } catch (error) {
      this.rawJson = "";
      this.parseError = error instanceof Error ? error.message : String(error);
    }
  }

  private handleDocumentChange(rawJson: string): void {
    this.rawJson = rawJson;
    this.queuedRawJson = rawJson;
    this.saveState = "saving";
    this.updateComponentProps();

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      void this.flushSave();
    }, 250);
  }

  private async flushSave(): Promise<void> {
    if (!this.file || !this.queuedRawJson) {
      return;
    }

    const nextRawJson = this.queuedRawJson;
    this.queuedRawJson = null;
    this.saveTimer = null;

    try {
      await this.app.vault.modify(this.file, nextRawJson);
      this.rawJson = nextRawJson;
      this.saveState = "saved";
    } catch (error) {
      this.queuedRawJson = nextRawJson;
      this.saveState = "error";
      this.parseError = error instanceof Error ? error.message : String(error);
    }

    this.updateComponentProps();
  }

  private updateComponentProps(): void {
    if (!this.component?.props) {
      return;
    }

    this.component.props.file = this.file;
    this.component.props.rawJson = this.rawJson;
    this.component.props.parseError = this.parseError;
    this.component.props.saveState = this.saveState;
  }

  private render(): void {
    if (!this.containerEl) {
      return;
    }

    if (this.component) {
      unmount(this.component);
      this.component = null;
    }

    this.containerEl.empty();
    this.component = mount(CanvasViewComponent, {
      target: this.containerEl,
      props: {
        app: this.app,
        file: this.file,
        rawJson: this.rawJson,
        parseError: this.parseError,
        saveState: this.saveState,
        snapToGrid: this.plugin?.settings.snapToGrid ?? false,
        snapToObjects: this.plugin?.settings.snapToObjects ?? true,
        onDocumentChange: (nextRawJson: string) => {
          this.handleDocumentChange(nextRawJson);
        },
        onReload: () => {
          void this.reloadFromDisk();
        },
      },
    });
  }
}

export { CanvasViewComponent, CanvasViewComponent as Root };
