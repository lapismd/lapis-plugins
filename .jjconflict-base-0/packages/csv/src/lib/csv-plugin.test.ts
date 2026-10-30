// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  viewRegistration: null as null | unknown[],
  editorView: null as null | Record<string, unknown>,
  extensions: null as null | unknown[],
  commands: [] as {
    id: string;
    name: string;
    callback?: () => void;
    checkCallback?: (checking: boolean) => boolean;
  }[],
  editorExtension: null as null | unknown,
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

vi.mock("./CsvSheet.svelte", () => ({
  default: class CsvSheet {},
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

    registerEditorExtension(extension: unknown) {
      harness.editorExtension = extension;
    }

    addCommand(command: (typeof harness.commands)[number]) {
      harness.commands.push(command);
    }
  }

  return { Plugin };
});

import { CSVPlugin } from "./csv-plugin";
import CsvSheet from "./CsvSheet.svelte";
import CsvTable from "./CsvTable.svelte";
import { CsvFileView } from "./views/csv-view";

function createApp(
  file: { path: string; extension: string } | null,
  defaultView?: "table" | "canvas",
) {
  const leaf = { setViewState: vi.fn(async () => undefined) };
  const app = {
    configuration: {
      getConfiguration: () => ({
        get: (_key: string, fallback: unknown) => defaultView ?? fallback,
      }),
    },
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
    harness.commands = [];
    harness.editorExtension = null;
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
    expect(harness.commands.map((command) => command.id)).toEqual([
      "open-csv",
      "toggle-csv-source",
      "show-csv-canvas",
    ]);
    expect(typeof harness.editorExtension).toBe("function");
    expect(harness.embeds.map((entry) => entry.extension)).toEqual(["csv", "tsv"]);

    const container = document.createElement("div");
    const csvEmbed = harness.embeds[0]?.handler({
      app,
      containerEl: container,
      state: { file: { path: "Sample.csv", extension: "csv" } },
    });
    expect(harness.mount).toHaveBeenCalledExactlyOnceWith(CsvSheet, {
      target: container,
      props: {
        app,
        file: { path: "Sample.csv", extension: "csv" },
        role: "embed",
      },
    });
    csvEmbed?.destroy?.();
    expect(harness.unmount).toHaveBeenCalledOnce();

    const tsvContainer = document.createElement("div");
    harness.embeds[1]?.handler({
      app,
      containerEl: tsvContainer,
      state: { file: { path: "Sample.csv", extension: "csv" } },
    });
    expect(harness.mount).toHaveBeenCalledOnce();

    harness.commands.find((command) => command.id === "open-csv")?.callback?.();
    expect(leaf.setViewState).toHaveBeenCalledWith({
      type: "lapis-csv",
      state: { file: "Sample.csv" },
    });
  });

  it("embeds the DOM table when the default view is the table", () => {
    const { app } = createApp({ path: "Sample.csv", extension: "csv" }, "table");
    new CSVPlugin(app as never).onload();
    const container = document.createElement("div");
    harness.embeds[0]?.handler({
      app,
      containerEl: container,
      state: { file: { path: "Sample.csv", extension: "csv" } },
    });
    expect(harness.mount).toHaveBeenCalledExactlyOnceWith(CsvTable, {
      target: container,
      props: {
        app,
        file: { path: "Sample.csv", extension: "csv" },
        role: "embed",
      },
    });
  });

  it("leaves a non-table file on its current view", () => {
    const { app, leaf } = createApp({ path: "Notes/Welcome.md", extension: "md" });
    new CSVPlugin(app as never).onload();
    harness.commands.find((command) => command.id === "open-csv")?.callback?.();
    expect(leaf.setViewState).not.toHaveBeenCalled();
  });

  it("toggles the active CSV leaf between the table and the source", () => {
    const { app } = createApp({ path: "Sample.csv", extension: "csv" });
    const view = new (CsvFileView as unknown as new () => CsvFileView)();
    const toggleMode = vi.fn();
    Object.assign(view, { toggleMode });
    app.workspace.activeLeaf = { view, setViewState: vi.fn() } as never;
    new CSVPlugin(app as never).onload();
    const command = harness.commands.find(
      (entry) => entry.id === "toggle-csv-source",
    );

    expect(command?.checkCallback?.(true)).toBe(true);
    expect(toggleMode).not.toHaveBeenCalled();
    expect(command?.checkCallback?.(false)).toBe(true);
    expect(toggleMode).toHaveBeenCalledOnce();
  });

  it("switches the active CSV leaf to the canvas sheet", () => {
    const { app } = createApp({ path: "Sample.csv", extension: "csv" });
    const view = new (CsvFileView as unknown as new () => CsvFileView)();
    const showCanvas = vi.fn();
    Object.assign(view, { showCanvas });
    app.workspace.activeLeaf = { view, setViewState: vi.fn() } as never;
    new CSVPlugin(app as never).onload();
    const command = harness.commands.find(
      (entry) => entry.id === "show-csv-canvas",
    );

    expect(command?.checkCallback?.(true)).toBe(true);
    expect(showCanvas).not.toHaveBeenCalled();
    expect(command?.checkCallback?.(false)).toBe(true);
    expect(showCanvas).toHaveBeenCalledOnce();
  });
});
