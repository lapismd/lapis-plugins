import {
  FileView,
  Notice,
  Plugin,
  matchesEditorAssociationGlob,
  type App,
  type MarkdownViewMenuContext,
  type PluginManifest,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import manifestSpec from "../../manifest.json";
import { TRANSCRIPTS_PLUGIN_ID } from "./ids";
import { TRANSCRIPT_FILENAME_PATTERN } from "./transcript-association";
import TranscriptReading from "./TranscriptReading.svelte";
import {
  TRANSCRIPT_READING_VIEW,
  TranscriptReadingView,
} from "./views/reading-view";

export { TRANSCRIPTS_PLUGIN_ID, TRANSCRIPT_FILENAME_PATTERN, TRANSCRIPT_READING_VIEW };

function isMarkdownFile(file: TFile | null | undefined): file is TFile {
  if (!file) return false;
  const extension = file.extension.toLowerCase();
  return extension === "md" || extension === "markdown";
}

export class TranscriptsPlugin extends Plugin {
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  onload(): void {
    this.registerView(
      TRANSCRIPT_READING_VIEW,
      (leaf) => new TranscriptReadingView(leaf),
      { kind: "file" },
    );
    this.registerEditorView({
      id: `${TRANSCRIPT_READING_VIEW}-file`,
      viewType: TRANSCRIPT_READING_VIEW,
      label: "Transcript",
      filenamePatterns: [TRANSCRIPT_FILENAME_PATTERN],
      priority: "exclusive",
    });
    this.registerMarkdownViewMenuItem(this.addMarkdownViewMenuItem);
    this.registerMarkdownEmbedder(this.renderMarkdownEmbed);
    this.addCommand({
      id: "open-transcript",
      name: "Open transcript",
      icon: "lucide-audio-lines",
      callback: () => this.openTranscript(this.app.workspace.activeLeaf),
    });
  }

  private readonly renderMarkdownEmbed = ({
    app,
    containerEl,
    file,
  }: {
    app: App;
    containerEl: HTMLElement;
    file: TFile;
  }) => {
    if (
      !matchesEditorAssociationGlob(TRANSCRIPT_FILENAME_PATTERN, file.path)
    ) {
      return false;
    }
    containerEl.style.display = "flex";
    containerEl.style.flexDirection = "column";
    containerEl.style.height = "24rem";
    containerEl.style.minHeight = "0";
    containerEl.style.overflow = "hidden";
    const component = mount(TranscriptReading, {
      target: containerEl,
        props: {
          app,
          mode: "file",
          filePath: file.path,
          label: file.basename,
        },
    });
    return {
      destroy() {
        void unmount(component);
        containerEl.replaceChildren();
      },
    };
  };

  private readonly addMarkdownViewMenuItem = ({
    menu,
    leaf,
  }: MarkdownViewMenuContext): void => {
    menu
      .addItem((item) => {
        item
          .setSection("view")
          .setTitle("Open transcript")
          .setIcon("lucide-audio-lines")
          .onClick(() => {
            void this.openTranscript(leaf);
          });
      })
      .addSeparator();
  };

  private markdownFile(leaf: WorkspaceLeaf | null | undefined): TFile | null {
    const view = leaf?.view;
    if (view instanceof FileView) return view.file;
    return null;
  }

  private async openTranscript(
    source: WorkspaceLeaf | null | undefined,
  ): Promise<void> {
    if (!source) {
      new Notice("No active file to open as a transcript");
      return;
    }
    const file = this.markdownFile(source);
    if (!isMarkdownFile(file)) {
      new Notice("Transcripts are only available for Markdown files");
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState(
      {
        type: TRANSCRIPT_READING_VIEW,
        state: { file: file.path, id: source.id },
      },
      { history: true },
    );
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: "open-transcript",
    });
    await this.app.workspace.revealLeaf(leaf);
    this.app.workspace.requestSaveLayout();
  }
}

export default TranscriptsPlugin;
