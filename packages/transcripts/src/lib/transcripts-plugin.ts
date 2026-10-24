import {
  FileView,
  Notice,
  Plugin,
  type App,
  type MarkdownViewMenuContext,
  type PluginManifest,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import manifestSpec from "../../manifest.json";
import { TRANSCRIPTS_PLUGIN_ID } from "./ids";
import {
  TRANSCRIPT_READING_VIEW,
  TranscriptReadingView,
} from "./views/reading-view";

export { TRANSCRIPTS_PLUGIN_ID, TRANSCRIPT_READING_VIEW };

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
    this.registerMarkdownViewMenuItem(this.addMarkdownViewMenuItem);
    this.addCommand({
      id: "open-transcript",
      name: "Open transcript",
      callback: () => this.openTranscript(this.app.workspace.activeLeaf),
    });
  }

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
