/// <reference path="../../types/reveal.d.ts" />
import { TextFileView, WorkspaceLeaf, useLocale } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import SlidesViewComponent from "./slides-view.svelte";

const { t } = useLocale("slides");

export const SlidesViewType = "slides";

export class SlidesView extends TextFileView {
  private component: ReturnType<typeof mount> | null = null;

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  getViewType(): string {
    return SlidesViewType;
  }

  getDisplayText(): string {
    return this.file?.baseName ?? t("Presentation");
  }

  getIcon(): string {
    return "lucide-presentation";
  }

  getViewData(): string {
    return this.editor.getValue();
  }

  setViewData(data: string): void {
    this.editor.setValue(data);
  }

  clear(): void {
    this.editor.setValue("");
  }

  canAcceptExtension(extension: string): boolean {
    return ["md", "markdown"].includes(extension);
  }

  load(): void {
    if (!this.containerEl) {
      return;
    }

    this.unload();
    this.containerEl.empty();
    this.actions = [];
    this.component = mount(SlidesViewComponent, {
      target: this.containerEl,
      props: {
        app: this.app,
        editor: this.editor,
        sourcePath: this.file?.path ?? "",
        onClose: () => {
          const previousLeaf = this.getPreviousLeaf();
          this.leaf.close();

          const nextLeaf = previousLeaf ?? this.app.workspace.activeLeaf;
          if (nextLeaf) {
            this.app.workspace.setActiveLeaf(nextLeaf);
          }
        },
      },
    });
  }

  private getPreviousLeaf(): WorkspaceLeaf | null {
    const id = this.getState()["id"];
    if (typeof id === "string") {
      const previousLeaf = this.app.workspace.getLeafById(id);
      if (previousLeaf && previousLeaf !== this.leaf) {
        return previousLeaf;
      }
    }

    for (const child of this.leaf.parent.children) {
      if (child instanceof WorkspaceLeaf && child !== this.leaf) {
        return child;
      }
    }

    return null;
  }

  unload(): void {
    if (this.component) {
      unmount(this.component);
      this.component = null;
    }
  }
}
