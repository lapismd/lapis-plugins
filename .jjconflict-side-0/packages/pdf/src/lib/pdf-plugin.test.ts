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

vi.mock("./PdfViewer.svelte", () => ({
  default: class PdfViewer {},
}));

vi.mock("./views/pdf-view", () => ({
  PdfFileView: class PdfFileView {},
}));

vi.mock("svelte", () => ({
  mount: harness.mount,
  unmount: harness.unmount,
}));

const settingsHarness = vi.hoisted(() => ({
  registerSettingsSection: vi.fn(() => () => undefined),
  schemaRegister: vi.fn(),
  schemaUnregister: vi.fn(),
  materialize: vi.fn(async () => undefined),
}));

vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: () => ({
    controller: {
      settings: { get: () => undefined },
      registerSettingsSection: settingsHarness.registerSettingsSection,
    },
  }),
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

import { PDFPlugin } from "./pdf-plugin";

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
        path: "Sample.pdf",
        extension: "pdf",
      })),
    },
    configuration: {
      schema: {
        register: settingsHarness.schemaRegister,
        unregister: settingsHarness.schemaUnregister,
      },
      materializeSchemaDefaults: settingsHarness.materialize,
    },
  };
  return { app, leaf };
}

describe("PDFPlugin", () => {
  beforeEach(() => {
    harness.viewRegistration = null;
    harness.editorView = null;
    harness.extensions = null;
    harness.command = null;
    harness.embedExtension = null;
    harness.embedHandler = null;
    harness.mount.mockClear();
    harness.unmount.mockClear();
    settingsHarness.registerSettingsSection.mockClear();
    settingsHarness.schemaRegister.mockClear();
    settingsHarness.materialize.mockClear();
  });

  it("registers the file view, association, extension, command, and embed", () => {
    const { app, leaf } = createApp();
    new PDFPlugin(app as never).onload();
    expect(harness.viewRegistration?.[0]).toBe("lapis-pdf");
    expect(harness.editorView).toMatchObject({
      id: "lapis-pdf-file",
      viewType: "lapis-pdf",
      filenamePatterns: ["*.pdf"],
      priority: "exclusive",
    });
    expect(harness.extensions).toEqual([["pdf"], "lapis-pdf"]);
    expect(settingsHarness.schemaRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "lapis-pdf",
        properties: {
          "lapis-pdf.forceDarkPages": expect.objectContaining({
            type: "boolean",
            default: true,
          }),
        },
      }),
    );
    expect(settingsHarness.registerSettingsSection).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "lapis-pdf",
        title: "PDF",
        fields: [
          expect.objectContaining({
            id: "lapis-pdf.forceDarkPages",
            title: "Invert PDF pages in dark mode",
            default: true,
          }),
        ],
      }),
    );
    expect(settingsHarness.materialize).toHaveBeenCalledOnce();
    expect(harness.command?.id).toBe("open-pdf");
    expect(harness.embedExtension).toBe("pdf");
    const container = document.createElement("div");
    const handle = harness.embedHandler?.({
      app,
      containerEl: container,
      state: { file: { path: "Sample.pdf", extension: "pdf" } },
    });
    expect(harness.mount).toHaveBeenCalledOnce();
    handle?.destroy?.();
    expect(harness.unmount).toHaveBeenCalledOnce();
    harness.command?.callback();
    expect(leaf.setViewState).toHaveBeenCalledWith({
      type: "lapis-pdf",
      state: { file: "Sample.pdf" },
    });
  });
});
