import type { App, TFile } from "@lapis-notes/api";

export type DocxMountRole = "file" | "embed";

export type DocxMount = {
  destroy: () => void;
};

type DocxSaveFormat = "docx" | "pdf";

type DocxSaveEvent = {
  blob: Blob;
  bytes: Uint8Array;
  format: DocxSaveFormat;
  warnings: unknown[];
};

type WordCanvasEditor = {
  openDocx: (file: File | ArrayBuffer) => Promise<void>;
  exportDocx: () => Promise<Blob>;
  destroy: () => void;
};

type WordCanvasConstructor = new (options: {
  container: HTMLElement;
  readonly?: boolean;
  documentTitle?: string;
  backendUrl?: string;
  view?: { exportPdf?: boolean };
  onSave?: (event: DocxSaveEvent) => void | Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}) => WordCanvasEditor;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function docxBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

export function mountDocxViewer(options: {
  app: App;
  file: TFile;
  containerEl: HTMLElement;
  role: DocxMountRole;
}): DocxMount {
  const editable = options.role === "file";
  const host = options.containerEl.ownerDocument.createElement("div");
  host.className = "docx-viewer";
  host.dataset.testid = "docx-viewer";
  host.dataset.docxRole = options.role;
  host.dataset.docxError = "";
  host.style.width = "100%";
  host.style.overflow = "hidden";
  options.containerEl.replaceChildren(host);

  let disposed = false;
  let writingClose = false;
  let dirty = false;
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

  const persist = async (bytes: Uint8Array): Promise<void> => {
    if (disposed && !writingClose) return;
    await options.app.vault.modifyBinary(options.file, docxBuffer(bytes));
  };

  const save = async (event: DocxSaveEvent): Promise<void> => {
    if (disposed && !writingClose) return;
    if (event.format !== "docx") {
      throw new Error("The DOCX viewer only writes a Word document");
    }
    await persist(event.bytes);
  };

  const finish = (current: WordCanvasEditor | undefined): void => {
    current?.destroy();
    if (editor === current) editor = undefined;
    resizeObserver?.disconnect();
    host.remove();
  };

  const destroy = () => {
    if (disposed) return;
    disposed = true;
    const current = editor;
    if (!editable || !dirty || !current) {
      finish(current);
      return;
    }
    writingClose = true;
    void current
      .exportDocx()
      .then(async (blob) => {
        await persist(new Uint8Array(await blob.arrayBuffer()));
      })
      .catch(() => undefined)
      .finally(() => {
        writingClose = false;
        finish(current);
      });
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
        documentTitle: options.file.basename,
        ...(editable
          ? {
              view: { exportPdf: false },
              onSave: save,
              onDirtyChange: (nextDirty) => {
                dirty = nextDirty;
              },
            }
          : { readonly: true }),
      });
      editor = next;
      if (disposed) {
        if (!writingClose && editor === next) {
          next.destroy();
          editor = undefined;
        }
        return;
      }
      const file = new File([bytes], options.file.name, { type: DOCX_MIME });
      await next.openDocx(file);
      if (disposed && !writingClose && editor === next) {
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
