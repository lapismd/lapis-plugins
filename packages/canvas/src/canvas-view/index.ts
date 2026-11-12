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
import { CanvasDocumentSession } from "../lib/canvas-document-session";
import CanvasViewComponent from "./canvas-view.svelte";
import type { CanvasPlugin, CanvasSettings } from "../canvas-plugin";

export const CanvasViewType = "lapis-canvas";
type CanvasSaveState = "saved" | "saving" | "error";

export class CanvasView extends FileView {
  private component: MountComponent<ComponentProps<typeof CanvasViewComponent>> | null = null;
  private rawJson = "";
  private parseError: string | null = null;
  private saveState: CanvasSaveState = "saved";
  private saves: CanvasDocumentSession | null = null;
  private saveError: string | null = null;
  private loadGeneration = 0;
  private transitionToken = 0;
  private transitioning = false;
  private releaseTransition: (() => void) | null = null;
  private inputHolds = 0;
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
      const previous = this.saves;
      const saves = new CanvasDocumentSession({
        app,
        file: target,
        baseline: result.error === null ? result.value : null,
        hold: () => this.holdInput(),
        reset: (value) => {
          if (this.saves !== saves) return;
          this.rawJson = value;
          if (this.component) this.component.props.rawJson = value;
        },
        changed: (status, error) => {
          if (this.saves !== saves) return;
          this.saveState = status;
          this.saveError = error === undefined ? null : error instanceof Error ? error.message : String(error);
          this.updateComponentProps();
        },
      });
      try {
        await saves.ready();
        if (generation !== this.loadGeneration) {
          saves.retire(() => {});
          return;
        }
      } catch (error) {
        saves.retire(() => {});
        throw error;
      }
      previous?.retire(() => {});
      this.file = target;
      this.rawJson = result.value;
      this.parseError = result.error;
      this.saveError = null;
      this.saveState = "saved";
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
      this.saves?.retire(() => {});
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
    const component = this.component;
    if (saves) {
      saves.retire(() => component?.destroy());
      this.component = null;
      void saves.flush().catch((error: unknown) => {
        console.error("Canvas changes could not be saved during teardown", error);
      });
    } else {
      component?.destroy();
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
    const token = ++this.transitionToken;
    if (!this.transitioning) this.releaseTransition = this.holdInput();
    this.transitioning = true;
    try {
      await operation();
    } finally {
      if (token === this.transitionToken) {
        this.releaseTransition?.();
        this.releaseTransition = null;
        this.transitioning = false;
      }
    }
  }

  private holdInput(): () => void {
    const container = this.containerEl;
    if (this.inputHolds++ === 0) this.wasInert = Boolean(container.inert);
    container.inert = true;
    if (this.component) this.component.props.inputBlocked = true;
    let held = true;
    return () => {
      if (!held) return;
      held = false;
      if (--this.inputHolds === 0) {
        container.inert = this.wasInert;
        if (this.component) this.component.props.inputBlocked = this.wasInert;
      }
    };
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
        sourcePath: this.file?.path ?? "",
        documentSession: saves,
        inputBlocked: this.inputHolds > 0 || Boolean(this.containerEl.inert),
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
