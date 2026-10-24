import { FileView, type TFile, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import { TranscriptReading } from "@lapis-notes/transcripts";
import sampleMeetingUrl from "../../../../packages/transcripts/assets/sample-meeting.m4a?url";

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
  }

  async onUnloadFile(_file: TFile): Promise<void> {
    this.file = null;
  }

  async onRename(file: TFile): Promise<void> {
    this.file = file;
  }

  onload(): void {
    Object.assign(this.contentEl.style, {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      minWidth: "0",
      minHeight: "0",
      overflow: "hidden",
    });
    if (this.#component) void unmount(this.#component);
    this.#component = mount(TranscriptReading, {
      target: this.contentEl,
      props: {
        app: this.app,
        leaf: this.leaf,
        returnViewType: TRANSCRIPT_READING_VIEW,
        audioUrl: sampleMeetingUrl,
      },
    }) as Record<string, unknown>;
  }

  onunload(): void {
    if (this.#component) void unmount(this.#component);
    this.#component = null;
  }
}
