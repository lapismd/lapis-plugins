import { FileView, type TFile, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import CsvSourceView from "../components/csv-source-view.svelte";
import { readDefaultCsvView } from "../csv-view-settings";
import CsvSheet from "../CsvSheet.svelte";
import CsvTable from "../CsvTable.svelte";
import { CSV_EXTENSIONS, CSV_VIEW_TYPE } from "../ids";
import { csvViewMode, type CsvViewMode } from "./csv-view-mode";

const tableExtensions = new Set<string>(CSV_EXTENSIONS);

export type { CsvViewMode };
export { csvViewMode };

export class CsvFileView extends FileView {
  #component: Record<string, unknown> | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return CSV_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename ?? "CSV";
  }

  getIcon(): string {
    const mode = this.mode();
    if (mode === "source") return "file-code";
    if (mode === "canvas") return "grid-3x3";
    return "table";
  }

  canAcceptExtension(extension: string): boolean {
    return tableExtensions.has(extension.toLowerCase());
  }

  mode(): CsvViewMode {
    return csvViewMode(this.getState(), readDefaultCsvView(this.app));
  }

  showMode(mode: CsvViewMode): void {
    const file = this.file?.path ?? this.getState()["file"];
    void this.leaf.setViewState({
      type: CSV_VIEW_TYPE,
      state: { ...this.getState(), file, mode },
    });
  }

  toggleMode(): void {
    this.showMode(this.mode() === "source" ? readDefaultCsvView(this.app) : "source");
  }

  showCanvas(): void {
    this.showMode(this.mode() === "canvas" ? "table" : "canvas");
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.file = file;
    this.mountSurface();
  }

  async onUnloadFile(_file: TFile): Promise<void> {
    this.file = null;
    this.unmountSurface();
  }

  async onRename(file: TFile): Promise<void> {
    this.file = file;
    this.mountSurface();
  }

  onload(): void {
    this.prepareHost();
  }

  onunload(): void {
    this.unmountSurface();
  }

  private prepareHost(): void {
    Object.assign(this.contentEl.style, {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      minWidth: "0",
      minHeight: "0",
      overflow: "hidden",
    });
  }

  private mountSurface(): void {
    this.prepareHost();
    this.unmountSurface();
    const file = this.file;
    if (!file) return;
    if (this.mode() === "source") {
      this.#component = mount(CsvSourceView, {
        target: this.contentEl,
        props: {
          app: this.app,
          file,
          onShowTable: () => this.showMode("table"),
          onShowCanvas: () => this.showMode("canvas"),
        },
      }) as Record<string, unknown>;
      return;
    }
    if (this.mode() === "canvas") {
      this.#component = mount(CsvSheet, {
        target: this.contentEl,
        props: {
          app: this.app,
          file,
          onShowTable: () => this.showMode("table"),
          onToggleSource: () => this.showMode("source"),
        },
      }) as Record<string, unknown>;
      return;
    }
    this.#component = mount(CsvTable, {
      target: this.contentEl,
      props: {
        app: this.app,
        file,
        role: "file",
        onToggleSource: () => this.showMode("source"),
        onShowCanvas: () => this.showMode("canvas"),
      },
    }) as Record<string, unknown>;
  }

  private unmountSurface(): void {
    if (!this.#component) return;
    void unmount(this.#component);
    this.#component = null;
  }
}
