import {
  FileView,
  Notice,
  Plugin,
  useLocale,
  WorkspaceLeaf,
  type App,
  type MarkdownViewMenuContext,
  type PluginManifest,
  type TFile,
} from "@lapis-notes/api";
import manifestSpec from "@lapis-notes/slides/manifest.json";
import { SlidesView, SlidesViewType } from "./views/slides";
import revealStyles from "reveal.js/dist/reveal.css?inline";

const { t } = useLocale("slides");
const slidesStyleId = "plugin-slides-styles";

function ensureSlidesStyles(): void {
  if (typeof document === "undefined") {
    return;
  }

  let styleEl = document.getElementById(
    slidesStyleId,
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = slidesStyleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = revealStyles;
}

function removeSlidesStyles(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.getElementById(slidesStyleId)?.remove();
}

function isMarkdownFile(file: TFile | null | undefined): file is TFile {
  if (!file) {
    return false;
  }

  const extension = file.extension.toLowerCase();
  return extension === "md" || extension === "markdown";
}

export class SlidesPlugin extends Plugin {
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    ensureSlidesStyles();
    this.registerView(SlidesViewType, (leaf) => new SlidesView(leaf), {
      kind: "file",
    });
    this.registerMarkdownViewMenuItem(this.addMarkdownViewMenuItem);
    this.addCommand({
      id: "start-presentation",
      name: t("Start presentation"),
      callback: () => {
        return this.startPresentation(this.app.workspace.activeLeaf);
      },
    });
  }

  onunload(): void {
    removeSlidesStyles();
  }

  private readonly addMarkdownViewMenuItem = ({
    menu,
    leaf,
  }: MarkdownViewMenuContext): void => {
    menu
      .addItem((item) => {
        item
          .setSection("view")
          .setTitle(t("Start presentation"))
          .setIcon("lucide-presentation")
          .onClick(() => {
            void this.startPresentation(leaf);
          });
      })
      .addSeparator();
  };

  private getMarkdownFile(
    leaf: WorkspaceLeaf | null | undefined,
  ): TFile | null {
    const view = leaf?.view;
    if (view instanceof FileView) {
      return view.file;
    }

    return null;
  }

  private async startPresentation(
    source: WorkspaceLeaf | null | undefined,
  ): Promise<void> {
    if (!source) {
      new Notice(t("No active file to present"));
      return;
    }

    const file = this.getMarkdownFile(source);
    if (!isMarkdownFile(file)) {
      new Notice(t("Slides are only available for markdown files"));
      return;
    }

    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState(
      {
        type: SlidesViewType,
        state: { file: file.path, id: source.id },
      },
      { history: true },
    );
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: "start-presentation",
    });
    await this.app.workspace.revealLeaf(leaf);
    this.app.workspace.requestSaveLayout();
  }
}

export default SlidesPlugin;
