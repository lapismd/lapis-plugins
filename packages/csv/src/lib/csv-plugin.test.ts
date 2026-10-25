// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  viewRegistration: null as null | unknown[],
  editorView: null as null | Record<string, unknown>,
  extensions: null as null | unknown[],
  command: null as null | { id: string; name: string; callback: () => void },
  embeds: [] as {
    extension: string;
    handler: (props: {
      app: unknown;
      containerEl: HTMLElement;
      state: Record<string, unknown>;
    }) => { destroy?: () => void } | undefined;
  }[],
  mount: vi.fn(() => ({ id: "table" })),
  unmount: vi.fn(async () => undefined),
}));

vi.mock("./CsvTable.svelte", () => ({
  default: class CsvTable {},
}));

vi.mock("./views/csv-view", () => ({
  CsvFileView: class CsvFileView {},
}));

vi.mock("svelte", () => ({
  mount: harness.mount,
  unmount: harness.unmount,
}));

vi.mock("@lapis-notes/api", () => {
  class Plugin {
    app: {
      embedRegistry: {
        register: (
          extension: string,
          handler: (typeof harness.embeds)[number]["handler"],
        ) => () => void;
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

import { CSVPlugin } from "./csv-plugin";

function createApp(file: { path: string; extension: string } | null) {
  const leaf = { setViewState: vi.fn(async () => undefined) };
  const app = {
    embedRegistry: {
      register: vi.fn(
        (
          extension: string,
          handler: (typeof harness.embeds)[number]["handler"],
        ) => {
          harness.embeds.push({ extension, handler });
          return () => undefined;
        },
      ),
    },
    workspace: {
      activeLeaf: leaf,
      getActiveFile: vi.fn(() => file),
    },
  };
  return { app, leaf };
}

describe("CSVPlugin", () => {
  beforeEach(() => {
    harness.viewRegistration = null;
    harness.editorView = null;
    harness.extensions = null;
    harness.command = null;
    harness.embeds = [];
    harness.mount.mockClear();
    harness.unmount.mockClear();
  });

  it("registers the table view, both extensions, the command, and both embeds", () => {
    const { app, leaf } = createApp({ path: "Sample.csv", extension: "csv" });
    new CSVPlugin(app as never).onload();
    expect(harness.viewRegistration?.[0]).toBe("lapis-csv");
    expect(harness.viewRegistration?.[2]).toEqual({ kind: "file" });
    expect(harness.editorView).toMatchObject({
      id: "lapis-csv-file",
      viewType: "lapis-csv",
      filenamePatterns: ["*.csv", "*.tsv"],
      priority: "exclusive",
    });
    expect(harness.extensions).toEqual([["csv", "tsv"], "lapis-csv"]);
    expect(harness.command?.id).toBe("open-csv");
    expect(harness.embeds.map((entry) => entry.extension)).toEqual(["csv", "tsv"]);

    const container = document.createElement("div");
    const csvEmbed = harness.embeds[0]?.handler({
      app,
      containerEl: container,
      state: { file: { path: "Sample.csv", extension: "csv" } },
    });
    expect(harness.mount).toHaveBeenCalledOnce();
    csvEmbed?.destroy?.();
    expect(harness.unmount).toHaveBeenCalledOnce();

    const tsvContainer = document.createElement("div");
    harness.embeds[1]?.handler({
      app,
      containerEl: tsvContainer,
      state: { file: { path: "Sample.csv", extension: "csv" } },
    });
    expect(harness.mount).toHaveBeenCalledOnce();

    harness.command?.callback();
    expect(leaf.setViewState).toHaveBeenCalledWith({
      type: "lapis-csv",
      state: { file: "Sample.csv" },
    });
  });

  it("leaves a non-table file on its current view", () => {
    const { app, leaf } = createApp({ path: "Notes/Welcome.md", extension: "md" });
    new CSVPlugin(app as never).onload();
    harness.command?.callback();
    expect(leaf.setViewState).not.toHaveBeenCalled();
  });
});
