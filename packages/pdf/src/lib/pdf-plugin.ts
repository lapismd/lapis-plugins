import {
  Plugin,
  type App,
  type PluginManifest,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import manifestSpec from "../../manifest.json";
import PdfViewer from "./PdfViewer.svelte";
import {
  PDF_EMBED_EXTENSION,
  PDF_FILENAME_PATTERN,
  PDF_PLUGIN_ID,
  PDF_VIEW_TYPE,
} from "./ids";
import { registerPdfSettings } from "./pdf-settings";
import { PdfFileView } from "./views/pdf-view";

export { PDF_PLUGIN_ID, PDF_VIEW_TYPE, PDF_FILENAME_PATTERN };

function isPdf(file: TFile | null | undefined): file is TFile {
  return file?.extension.toLowerCase() === "pdf";
}

export class PDFPlugin extends Plugin {
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  onload(): void {
    registerPdfSettings(this);
    this.registerView(PDF_VIEW_TYPE, (leaf) => new PdfFileView(leaf), {
      kind: "file",
    });
    this.registerEditorView({
      id: `${PDF_VIEW_TYPE}-file`,
      viewType: PDF_VIEW_TYPE,
      label: "PDF",
      filenamePatterns: [PDF_FILENAME_PATTERN],
      priority: "exclusive",
    });
    this.registerExtensions([PDF_EMBED_EXTENSION], PDF_VIEW_TYPE);
    this.register(
      this.app.embedRegistry.register(PDF_EMBED_EXTENSION, ({ app, containerEl, state }) => {
        const file = state.file as TFile | undefined;
        if (!isPdf(file)) return;
        containerEl.style.display = "flex";
        containerEl.style.flexDirection = "column";
        containerEl.style.width = "100%";
        containerEl.style.height = "24rem";
        containerEl.style.minHeight = "24rem";
        containerEl.style.overflow = "hidden";
        const component = mount(PdfViewer, {
          target: containerEl,
          props: { app, file, role: "embed" },
        });
        return {
          destroy: () => {
            void unmount(component);
          },
        };
      }),
    );
    this.addCommand({
      id: "open-pdf",
      name: "Open PDF",
      icon: "lucide-file-text",
      callback: () => this.openPdf(this.app.workspace.activeLeaf),
    });
  }

  private openPdf(leaf: WorkspaceLeaf | null): void {
    const file = this.app.workspace.getActiveFile();
    if (!isPdf(file) || !leaf) return;
    void leaf.setViewState({
      type: PDF_VIEW_TYPE,
      state: { file: file.path },
    });
  }
}

export default PDFPlugin;
