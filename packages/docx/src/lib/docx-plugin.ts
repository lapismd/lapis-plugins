import {
  Plugin,
  type App,
  type PluginManifest,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import manifestSpec from "../../manifest.json";
import DocxViewer from "./DocxViewer.svelte";
import {
  DOCX_EMBED_EXTENSION,
  DOCX_FILENAME_PATTERN,
  DOCX_PLUGIN_ID,
  DOCX_VIEW_TYPE,
} from "./ids";
import { DocxFileView } from "./views/docx-view";

export { DOCX_PLUGIN_ID, DOCX_VIEW_TYPE, DOCX_FILENAME_PATTERN };

function isDocx(file: TFile | null | undefined): file is TFile {
  return file?.extension.toLowerCase() === "docx";
}

export class DOCXPlugin extends Plugin {
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  onload(): void {
    this.registerView(DOCX_VIEW_TYPE, (leaf) => new DocxFileView(leaf), {
      kind: "file",
    });
    this.registerEditorView({
      id: `${DOCX_VIEW_TYPE}-file`,
      viewType: DOCX_VIEW_TYPE,
      label: "DOCX",
      filenamePatterns: [DOCX_FILENAME_PATTERN],
      priority: "exclusive",
    });
    this.registerExtensions([DOCX_EMBED_EXTENSION], DOCX_VIEW_TYPE);
    this.register(
      this.app.embedRegistry.register(
        DOCX_EMBED_EXTENSION,
        ({ app, containerEl, state }) => {
          const file = state.file as TFile | undefined;
          if (!isDocx(file)) return;
          containerEl.style.display = "flex";
          containerEl.style.flexDirection = "column";
          containerEl.style.width = "100%";
          containerEl.style.height = "24rem";
          containerEl.style.minHeight = "24rem";
          containerEl.style.overflow = "hidden";
          const component = mount(DocxViewer, {
            target: containerEl,
            props: { app, file, role: "embed" },
          });
          return {
            destroy: () => {
              void unmount(component);
            },
          };
        },
      ),
    );
    this.addCommand({
      id: "open-word",
      name: "Open Word",
      icon: "lucide-file-text",
      callback: () => this.openDocx(this.app.workspace.activeLeaf),
    });
  }

  private openDocx(leaf: WorkspaceLeaf | null): void {
    const file = this.app.workspace.getActiveFile();
    if (!isDocx(file) || !leaf) return;
    void leaf.setViewState({
      type: DOCX_VIEW_TYPE,
      state: { file: file.path },
    });
  }
}

export default DOCXPlugin;
