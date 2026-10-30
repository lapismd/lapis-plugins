// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  viewRegistration: null as null | unknown[],
  editorView: null as null | Record<string, unknown>,
  extensions: null as null | unknown[],
  command: null as null | { id: string; name: string; callback: () => void },
  embedExtension: null as null | string,
  embedHandler: null as null | ((props: {
    app: unknown;
    containerEl: HTMLElement;
    state: Record<string, unknown>;
  }) => { destroy?: () => void } | undefined),
  mount: vi.fn(() => ({ id: "viewer" })),
  unmount: vi.fn(async () => undefined),
}));

vi.mock("./DocxViewer.svelte", () => ({
  default: class DocxViewer {},
}));

vi.mock("./views/docx-view", () => ({
  DocxFileView: class DocxFileView {},
}));

vi.mock("svelte", () => ({
  mount: harness.mount,
  unmount: harness.unmount,
}));

vi.mock("@lapis-notes/api", () => {
  class Plugin {
    app: {
      embedRegistry: {
        register: (extension: string, handler: typeof harness.embedHandler) => () => void;
      };
      workspace: { activeLeaf: unknown; getActiveFile: () => unknown };
    };

    constructor(app: Plugin["app"]) {
      this.app = app;
    }

    register(): void {}

    registerView(...args: unknown[]) {
      harness.viewRegistration = args;
    }

    registerEditorView(contribution: Record<string, unknown>) {
      harness.editorView = contribution;
    }

    registerExtensions(...args: unknown[]) {
      harness.extensions = args;
    }

    addCommand(command: typeof harness.command) {
      harness.command = command;
    }
  }

  return { Plugin };
});

import { DOCXPlugin } from "./docx-plugin";

function createApp() {
  const leaf = { setViewState: vi.fn(async () => undefined) };
  const app = {
    embedRegistry: {
      register: vi.fn((extension: string, handler: typeof harness.embedHandler) => {
        harness.embedExtension = extension;
        harness.embedHandler = handler;
        return () => undefined;
      }),
    },
    workspace: {
      activeLeaf: leaf,
      getActiveFile: vi.fn(() => ({
        path: "Sample.docx",
        extension: "docx",
      })),
    },
  };
  return { app, leaf };
}

describe("DOCXPlugin", () => {
  beforeEach(() => {
    harness.viewRegistration = null;
    harness.editorView = null;
    harness.extensions = null;
    harness.command = null;
    harness.embedExtension = null;
    harness.embedHandler = null;
    harness.mount.mockClear();
    harness.unmount.mockClear();
  });

  it("registers the file view, association, extension, command, and embed", () => {
    const { app, leaf } = createApp();
    new DOCXPlugin(app as never).onload();
    expect(harness.viewRegistration?.[0]).toBe("lapis-docx");
    expect(harness.editorView).toMatchObject({
      id: "lapis-docx-file",
      viewType: "lapis-docx",
      filenamePatterns: ["*.docx"],
      priority: "exclusive",
    });
    expect(harness.extensions).toEqual([["docx"], "lapis-docx"]);
    expect(harness.command?.id).toBe("open-word");
    expect(harness.command?.name).toBe("Open Word");
    expect(harness.embedExtension).toBe("docx");
    const container = document.createElement("div");
    const handle = harness.embedHandler?.({
      app,
      containerEl: container,
      state: { file: { path: "Sample.docx", extension: "docx" } },
    });
    expect(harness.mount).toHaveBeenCalledOnce();
    expect(container.style.height).toBe("24rem");
    handle?.destroy?.();
    expect(harness.unmount).toHaveBeenCalledOnce();
    harness.command?.callback();
    expect(leaf.setViewState).toHaveBeenCalledWith({
      type: "lapis-docx",
      state: { file: "Sample.docx" },
    });
  });
});
