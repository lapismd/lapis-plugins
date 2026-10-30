import { FileView, type TFile, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import PdfViewer from "../PdfViewer.svelte";
import { PDF_VIEW_TYPE } from "../ids";

export class PdfFileView extends FileView {
  #component: Record<string, unknown> | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return PDF_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename ?? "PDF";
  }

  getIcon(): string {
    return "file-text";
  }

  canAcceptExtension(extension: string): boolean {
    return extension.toLowerCase() === "pdf";
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.file = file;
    this.mountViewer();
  }

  async onUnloadFile(_file: TFile): Promise<void> {
    this.file = null;
    this.unmountViewer();
  }

  async onRename(file: TFile): Promise<void> {
    this.file = file;
    this.mountViewer();
  }

  onload(): void {
    this.prepareHost();
  }

  onunload(): void {
    this.unmountViewer();
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

  private mountViewer(): void {
    this.prepareHost();
    this.unmountViewer();
    if (!this.file) return;
    this.#component = mount(PdfViewer, {
      target: this.contentEl,
      props: { app: this.app, file: this.file, role: "file" },
    }) as Record<string, unknown>;
  }

  private unmountViewer(): void {
    if (!this.#component) return;
    void unmount(this.#component);
    this.#component = null;
  }
}
