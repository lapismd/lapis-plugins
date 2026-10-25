// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "@lapis-notes/api";

const harness = vi.hoisted(() => ({
  options: null as null | {
    container: HTMLElement;
    readonly?: boolean;
    documentTitle?: string;
    backendUrl?: string;
  },
  opened: null as null | File | ArrayBuffer,
  destroyed: 0,
  open: Promise.resolve(),
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

    destroy() {
      harness.destroyed += 1;
    }
  },
}));

import { mountDocxViewer } from "./mount-docx";

function file(): TFile {
  return {
    path: "Sample.docx",
    name: "Sample.docx",
    basename: "Sample",
    extension: "docx",
  } as TFile;
}

describe("mountDocxViewer", () => {
  beforeEach(() => {
    harness.options = null;
    harness.opened = null;
    harness.destroyed = 0;
    harness.open = Promise.resolve();
  });

  it("opens vault bytes in a read-only editor and destroys it on close", async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const app = {
      vault: { readBinary: vi.fn(async () => bytes) },
    } as unknown as App;
    const container = document.createElement("div");
    Object.defineProperty(container, "clientHeight", { value: 640 });
    const handle = mountDocxViewer({
      app,
      file: file(),
      containerEl: container,
      role: "file",
    });
    await vi.waitFor(() => {
      expect(harness.options?.readonly).toBe(true);
    });
    expect(harness.options?.backendUrl).toBeUndefined();
    expect(harness.options?.documentTitle).toBe("Sample");
    expect(harness.opened).toBeInstanceOf(File);
    expect(container.querySelector("[data-testid='docx-viewer']")).not.toBeNull();
    handle.destroy();
    expect(harness.destroyed).toBe(1);
    expect(container.querySelector("[data-testid='docx-viewer']")).toBeNull();
  });

  it("destroys an editor that finishes opening after the view has closed", async () => {
    let release: (() => void) | undefined;
    harness.open = new Promise((resolve) => {
      release = resolve;
    });
    const app = {
      vault: { readBinary: vi.fn(async () => new ArrayBuffer(1)) },
    } as unknown as App;
    const container = document.createElement("div");
    const handle = mountDocxViewer({
      app,
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
