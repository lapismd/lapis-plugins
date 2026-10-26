import { FileView, TFile, type WorkspaceLeaf } from "@lapis-notes/api";
import MediaViewComponent from "./media-view.svelte";
import { mount, unmount } from "svelte";
import { MIME_TYPES, openMediaSource, type MediaSource } from "./open-media-source";

export const MediaViewType = "media";

export { MIME_TYPES };

const IMAGE_EXTENSION = Object.keys(MIME_TYPES);

export function isImageAsset(file: TFile | string) {
  if (typeof file === "string") {
    const index = file.lastIndexOf(".");
    const ext = index === -1 ? file : file.substring(index + 1);
    return IMAGE_EXTENSION.includes(ext.toLowerCase());
  }
  return isImageAsset(file.extension);
}

export class MediaView extends FileView {
  private component: unknown = null;
  private source: MediaSource | null = null;
  private generation = 0;

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onLoadFile(file: TFile): Promise<void> {
    this.file = file;
    this.reload();
    return Promise.resolve();
  }

  onUnloadFile(_file: TFile): Promise<void> {
    this.file = null;
    this.reload();
    return Promise.resolve();
  }

  onRename(file: TFile): Promise<void> {
    this.file = file;
    this.reload();
    return Promise.resolve();
  }

  canAcceptExtension(extension: string): boolean {
    return Object.keys(MIME_TYPES).includes(extension.toLowerCase());
  }

  private reload(): void {
    if (!this.containerEl) return;
    const generation = ++this.generation;
    this.revokeSource();
    const file = this.file;
    if (!file) {
      this.render("");
      return;
    }
    void openMediaSource(this.app, file)
      .then((source) => {
        if (generation !== this.generation) {
          source.revoke();
          return;
        }
        this.source = source;
        this.render(source.url);
      })
      .catch(() => {
        if (generation === this.generation) this.render("");
      });
  }

  private render(resourceUrl: string): void {
    if (!this.containerEl) return;
    if (this.component) {
      unmount(this.component as Parameters<typeof unmount>[0]);
      this.component = null;
    }
    this.containerEl.empty();
    this.component = mount(MediaViewComponent, {
      target: this.containerEl,
      props: { file: this.file, resourceUrl },
    });
  }

  private revokeSource(): void {
    this.source?.revoke();
    this.source = null;
  }

  onload(): void {
    this.containerEl.classList.add("markdown-media-view");
    this.reload();
  }

  onunload(): void {
    this.generation += 1;
    this.revokeSource();
    if (this.component) {
      unmount(this.component as Parameters<typeof unmount>[0]);
      this.component = null;
    }
  }

  getViewType(): string {
    return MediaViewType;
  }

  getDisplayText(): string {
    return this.file?.baseName ?? "Media";
  }
}
