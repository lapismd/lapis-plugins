// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "@lapis-notes/api";

const harness = vi.hoisted(() => ({
  options: null as null | {
    container: HTMLElement;
    readonly?: boolean;
    documentTitle?: string;
    backendUrl?: string;
    view?: { exportPdf?: boolean };
    onSave?: (event: {
      blob: Blob;
      bytes: Uint8Array;
      format: "docx" | "pdf";
      warnings: unknown[];
    }) => void | Promise<void>;
    onDirtyChange?: (dirty: boolean) => void;
  },
  opened: null as null | File | ArrayBuffer,
  destroyed: 0,
  exported: 0,
  open: Promise.resolve(),
  exportBytes: new Uint8Array([7, 8]),
}));

vi.mock("../../vendor/wordcanvas/frontend/src/wordcanvas", () => ({
  WordCanvas: class WordCanvas {
    constructor(options: typeof harness.options) {
      harness.options = options;
    }

    openDocx(file: File | ArrayBuffer) {
      harness.opened = file;
      return harness.open;
    }

    exportDocx() {
      harness.exported += 1;
      const bytes = harness.exportBytes;
      return Promise.resolve({
        arrayBuffer: async () => new Uint8Array(bytes).buffer,
      } as Blob);
    }

    destroy() {
      harness.destroyed += 1;
    }
  },
}));

import { mountDocxViewer } from "./mount-docx";

function file(path = "Sample.docx"): TFile {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return {
    path,
    name,
    basename: name.replace(/\.[^.]+$/, ""),
    extension: "docx",
  } as TFile;
}

function app(bytes: ArrayBuffer = new Uint8Array([1, 2, 3]).buffer) {
  const files = new Map<string, TFile>();
  const writes: { path: string; data: ArrayBuffer }[] = [];
  const modifyBinary = vi.fn(async (target: TFile, data: ArrayBuffer) => {
    writes.push({ path: target.path, data });
  });
  const createBinary = vi.fn(async (path: string, data: ArrayBuffer) => {
    const name = path.slice(path.lastIndexOf("/") + 1);
    const created = {
      path,
      name,
      basename: name.replace(/\.[^.]+$/, ""),
      extension: name.slice(name.lastIndexOf(".") + 1),
    } as TFile;
    files.set(path, created);
    writes.push({ path, data });
    return created;
  });
  return {
    app: {
      vault: {
        readBinary: vi.fn(async () => bytes),
        modifyBinary,
        createBinary,
        getFileByPath: (path: string) => files.get(path) ?? null,
      },
    } as unknown as App,
    modifyBinary,
    createBinary,
    writes,
    files,
  };
}

describe("mountDocxViewer", () => {
  beforeEach(() => {
    harness.options = null;
    harness.opened = null;
    harness.destroyed = 0;
    harness.exported = 0;
    harness.open = Promise.resolve();
    harness.exportBytes = new Uint8Array([7, 8]);
  });

  it("opens a file view for editing and writes docx bytes back to the vault", async () => {
    const { app: lapis, modifyBinary, writes } = app();
    const container = document.createElement("div");
    Object.defineProperty(container, "clientHeight", { value: 640 });
    const handle = mountDocxViewer({
      app: lapis,
      file: file(),
      containerEl: container,
      role: "file",
    });
    await vi.waitFor(() => {
      expect(harness.options?.onSave).toEqual(expect.any(Function));
    });
    expect(harness.options?.readonly).toBeUndefined();
    expect(harness.options?.backendUrl).toBeUndefined();
    expect(harness.options?.view).toBeUndefined();
    expect(harness.options?.documentTitle).toBe("Sample");
    expect(harness.opened).toBeInstanceOf(File);
    const source = new Uint8Array([4, 5, 6]);
    await harness.options?.onSave?.({
      blob: new Blob([source]),
      bytes: source,
      format: "docx",
      warnings: [],
    });
    expect(modifyBinary).toHaveBeenCalledOnce();
    expect(writes[0]?.path).toBe("Sample.docx");
    expect(new Uint8Array(writes[0]?.data ?? new ArrayBuffer(0))).toEqual(source);
    handle.destroy();
    expect(harness.exported).toBe(0);
    expect(harness.destroyed).toBe(1);
    await harness.options?.onSave?.({
      blob: new Blob([source]),
      bytes: source,
      format: "docx",
      warnings: [],
    });
    expect(modifyBinary).toHaveBeenCalledOnce();
  });

  it("keeps a note embed read-only", async () => {
    const { app: lapis } = app();
    const container = document.createElement("div");
    mountDocxViewer({
      app: lapis,
      file: file(),
      containerEl: container,
      role: "embed",
    });
    await vi.waitFor(() => {
      expect(harness.options?.readonly).toBe(true);
    });
    expect(harness.options?.onSave).toBeUndefined();
    expect(harness.options?.view).toBeUndefined();
    expect(harness.options?.backendUrl).toBeUndefined();
  });

  it("writes a PDF beside the Word file and overwrites that sibling", async () => {
    const { app: lapis, modifyBinary, createBinary, writes } = app();
    const container = document.createElement("div");
    const handle = mountDocxViewer({
      app: lapis,
      file: file("Notes/Sample.docx"),
      containerEl: container,
      role: "file",
    });
    await vi.waitFor(() => {
      expect(harness.options?.onSave).toEqual(expect.any(Function));
    });
    const source = new Uint8Array([9, 8, 7]);
    const savePdf = () =>
      harness.options?.onSave?.({
        blob: new Blob([source]),
        bytes: source,
        format: "pdf",
        warnings: [],
      });
    await savePdf();
    expect(createBinary).toHaveBeenCalledOnce();
    expect(modifyBinary).not.toHaveBeenCalled();
    expect(writes[0]?.path).toBe("Notes/Sample.pdf");
    expect(new Uint8Array(writes[0]?.data ?? new ArrayBuffer(0))).toEqual(source);
    await savePdf();
    expect(createBinary).toHaveBeenCalledOnce();
    expect(modifyBinary).toHaveBeenCalledOnce();
    expect(writes[1]?.path).toBe("Notes/Sample.pdf");
    expect(new Uint8Array(writes[1]?.data ?? new ArrayBuffer(0))).toEqual(source);
    handle.destroy();
    await savePdf();
    expect(createBinary).toHaveBeenCalledOnce();
    expect(modifyBinary).toHaveBeenCalledOnce();
  });

  it("saves a dirty file once before the view closes", async () => {
    const { app: lapis, modifyBinary, writes } = app();
    const container = document.createElement("div");
    const handle = mountDocxViewer({
      app: lapis,
      file: file(),
      containerEl: container,
      role: "file",
    });
    await vi.waitFor(() => {
      expect(harness.options?.onDirtyChange).toEqual(expect.any(Function));
    });
    harness.options?.onDirtyChange?.(true);
    handle.destroy();
    await vi.waitFor(() => {
      expect(harness.destroyed).toBe(1);
    });
    expect(harness.exported).toBe(1);
    expect(modifyBinary).toHaveBeenCalledOnce();
    expect(writes[0]?.path).toBe("Sample.docx");
    expect(new Uint8Array(writes[0]?.data ?? new ArrayBuffer(0))).toEqual(
      harness.exportBytes,
    );
    expect(container.childElementCount).toBe(0);
  });

  it("destroys an editor that finishes opening after the view has closed", async () => {
    let release: (() => void) | undefined;
    harness.open = new Promise((resolve) => {
      release = resolve;
    });
    const { app: lapis } = app(new ArrayBuffer(1));
    const container = document.createElement("div");
    const handle = mountDocxViewer({
      app: lapis,
      file: file(),
      containerEl: container,
      role: "embed",
    });
    await vi.waitFor(() => {
      expect(harness.options).not.toBeNull();
    });
    handle.destroy();
    release?.();
    await harness.open;
    expect(harness.destroyed).toBeGreaterThan(0);
    expect(container.childElementCount).toBe(0);
  });
});
