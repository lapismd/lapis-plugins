import { FileView, type TFile, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import TranscriptReading from "../TranscriptReading.svelte";
import { returnToTranscriptSource } from "../return-to-source";

export const TRANSCRIPT_READING_VIEW = "lapis-transcripts-reading";

export class TranscriptReadingView extends FileView {
  #component: Record<string, unknown> | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return TRANSCRIPT_READING_VIEW;
  }

  getDisplayText(): string {
    return this.file?.basename ?? "Transcript";
  }

  getIcon(): string {
    return "audio-lines";
  }

  canAcceptExtension(extension: string): boolean {
    const normalized = extension.toLowerCase();
    return normalized === "md" || normalized === "markdown";
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.file = file;
    this.mount();
  }

  async onUnloadFile(_file: TFile): Promise<void> {
    this.file = null;
  }

  async onRename(file: TFile): Promise<void> {
    this.file = file;
    this.mount();
  }

  onload(): void {
    this.prepareHost();
    this.mount();
  }

  protected async onClose(): Promise<void> {
    await returnToTranscriptSource(
      this.app,
      this.leaf,
      this.getState() as Record<string, unknown>,
    );
  }

  onunload(): void {
    this.unmount();
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

  private mount(): void {
    this.prepareHost();
    this.unmount();
    this.#component = mount(TranscriptReading, {
      target: this.contentEl,
      props: {
        app: this.app,
        leaf: this.leaf,
        mode: "file",
        filePath: this.file?.path ?? "",
        returnViewType: TRANSCRIPT_READING_VIEW,
      },
    }) as Record<string, unknown>;
  }

  private unmount(): void {
    if (!this.#component) return;
    void unmount(this.#component);
    this.#component = null;
  }
}
