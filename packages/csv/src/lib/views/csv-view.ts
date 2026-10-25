import { FileView, type TFile, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import CsvTable from "../CsvTable.svelte";
import { CSV_EXTENSIONS, CSV_VIEW_TYPE } from "../ids";

const tableExtensions = new Set<string>(CSV_EXTENSIONS);

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
    return "table";
  }

  canAcceptExtension(extension: string): boolean {
    return tableExtensions.has(extension.toLowerCase());
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.file = file;
    this.mountTable();
  }

  async onUnloadFile(_file: TFile): Promise<void> {
    this.file = null;
    this.unmountTable();
  }

  async onRename(file: TFile): Promise<void> {
    this.file = file;
    this.mountTable();
  }

  onload(): void {
    this.prepareHost();
  }

  onunload(): void {
    this.unmountTable();
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

  private mountTable(): void {
    this.prepareHost();
    this.unmountTable();
    if (!this.file) return;
    this.#component = mount(CsvTable, {
      target: this.contentEl,
      props: { app: this.app, file: this.file, role: "file" },
    }) as Record<string, unknown>;
  }

  private unmountTable(): void {
    if (!this.#component) return;
    void unmount(this.#component);
    this.#component = null;
  }
}
