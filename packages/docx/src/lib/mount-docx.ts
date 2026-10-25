import type { App, TFile } from "@lapis-notes/api";

export type DocxMountRole = "file" | "embed";

export type DocxMount = {
  destroy: () => void;
};

type WordCanvasEditor = {
  openDocx: (file: File | ArrayBuffer) => Promise<void>;
  destroy: () => void;
};

type WordCanvasConstructor = new (options: {
  container: HTMLElement;
  readonly?: boolean;
  documentTitle?: string;
  backendUrl?: string;
}) => WordCanvasEditor;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function mountDocxViewer(options: {
  app: App;
  file: TFile;
  containerEl: HTMLElement;
  role: DocxMountRole;
}): DocxMount {
  const host = options.containerEl.ownerDocument.createElement("div");
  host.className = "docx-viewer";
  host.dataset.testid = "docx-viewer";
  host.dataset.docxRole = options.role;
  host.dataset.docxError = "";
  host.style.width = "100%";
  host.style.overflow = "hidden";
  options.containerEl.replaceChildren(host);

  let disposed = false;
  let editor: WordCanvasEditor | undefined;

  const syncHeight = () => {
    const height =
      options.containerEl.clientHeight ||
      options.containerEl.getBoundingClientRect().height;
    host.style.height = `${height > 0 ? height : 480}px`;
  };
  syncHeight();
  const resizeObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(syncHeight);
  resizeObserver?.observe(options.containerEl);

  const destroy = () => {
    if (disposed) return;
    disposed = true;
    resizeObserver?.disconnect();
    editor?.destroy();
    editor = undefined;
    host.remove();
  };

  void (async () => {
    try {
      const bytes = await options.app.vault.readBinary(options.file);
      if (disposed) return;
      const loaded = (await import(
        "../../vendor/wordcanvas/frontend/src/wordcanvas"
      )) as { WordCanvas: WordCanvasConstructor };
      if (disposed) return;
      const next = new loaded.WordCanvas({
        container: host,
        readonly: true,
        documentTitle: options.file.basename,
      });
      editor = next;
      if (disposed) {
        next.destroy();
        editor = undefined;
        return;
      }
      const file = new File([bytes], options.file.name, { type: DOCX_MIME });
      await next.openDocx(file);
      if (disposed) {
        next.destroy();
        editor = undefined;
      }
    } catch (error) {
      if (!disposed) {
        host.dataset.docxError =
          error instanceof Error ? error.message : "Unable to open this document";
      }
    }
  })();

  return { destroy };
}
