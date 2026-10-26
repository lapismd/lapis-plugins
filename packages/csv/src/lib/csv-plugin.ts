import {
  Plugin,
  type App,
  type PluginManifest,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import manifestSpec from "../../manifest.json";
import CsvTable from "./CsvTable.svelte";
import {
  CSV_EXTENSIONS,
  CSV_FILENAME_PATTERNS,
  CSV_PLUGIN_ID,
  CSV_VIEW_TYPE,
} from "./ids";
import { csvSourceExtensions } from "./codemirror/csv-source-extensions";
import { registerCsvViewSettings } from "./csv-view-settings";
import { CsvFileView } from "./views/csv-view";

export { CSV_PLUGIN_ID, CSV_VIEW_TYPE, CSV_FILENAME_PATTERNS };

const tableExtensions = new Set<string>(CSV_EXTENSIONS);

function isTableFile(file: TFile | null | undefined): file is TFile {
  return tableExtensions.has(file?.extension.toLowerCase() ?? "");
}

function mountTable(
  app: App,
  containerEl: HTMLElement,
  file: TFile,
): { destroy: () => void } {
  containerEl.style.display = "flex";
  containerEl.style.flexDirection = "column";
  containerEl.style.width = "100%";
  containerEl.style.height = "auto";
  containerEl.style.minHeight = "0";
  containerEl.style.overflow = "auto";
  const component = mount(CsvTable, {
    target: containerEl,
    props: { app, file, role: "embed" },
  });
  return {
    destroy: () => {
      void unmount(component);
    },
  };
}

export class CSVPlugin extends Plugin {
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  onload(): void {
    this.registerView(CSV_VIEW_TYPE, (leaf) => new CsvFileView(leaf), {
      kind: "file",
    });
    this.registerEditorView({
      id: `${CSV_VIEW_TYPE}-file`,
      viewType: CSV_VIEW_TYPE,
      label: "CSV",
      filenamePatterns: [...CSV_FILENAME_PATTERNS],
      priority: "exclusive",
    });
    this.registerExtensions([...CSV_EXTENSIONS], CSV_VIEW_TYPE);
    this.registerEditorExtension(
      () => csvSourceExtensions(this.app),
      CSV_VIEW_TYPE,
    );
    for (const extension of CSV_EXTENSIONS) {
      this.register(
        this.app.embedRegistry.register(extension, ({ app, containerEl, state }) => {
          const file = state.file as TFile | undefined;
          if (!isTableFile(file) || file.extension.toLowerCase() !== extension) return;
          return mountTable(app, containerEl, file);
        }),
      );
    }
    this.addCommand({
      id: "open-csv",
      name: "Open CSV",
      icon: "lucide-table",
      callback: () => this.openTable(this.app.workspace.activeLeaf),
    });
    this.addCommand({
      id: "toggle-csv-source",
      name: "Toggle CSV source",
      icon: "lucide-file-code",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.activeLeaf?.view;
        if (!(view instanceof CsvFileView)) return false;
        if (!checking) view.toggleMode();
        return true;
      },
    });
    this.addCommand({
      id: "show-csv-canvas",
      name: "Show CSV canvas",
      icon: "lucide-grid-3x3",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.activeLeaf?.view;
        if (!(view instanceof CsvFileView)) return false;
        if (!checking) view.showCanvas();
        return true;
      },
    });
    registerCsvViewSettings(this);
  }

  private openTable(leaf: WorkspaceLeaf | null): void {
    const file = this.app.workspace.getActiveFile();
    if (!isTableFile(file) || !leaf) return;
    void leaf.setViewState({
      type: CSV_VIEW_TYPE,
      state: { file: file.path },
    });
  }
}

export default CSVPlugin;
