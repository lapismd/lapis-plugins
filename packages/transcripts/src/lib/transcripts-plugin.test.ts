// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  notices: [] as string[],
  command: null as null | { id: string; name: string; callback: () => unknown },
  menuHandler: null as null | ((context: unknown) => void),
  viewRegistration: null as null | unknown[],
  editorView: null as null | Record<string, unknown>,
}));

vi.mock("./views/reading-view", () => ({
  TRANSCRIPT_READING_VIEW: "lapis-transcripts-reading",
  TranscriptReadingView: class TranscriptReadingView {},
}));

vi.mock("@lapis-notes/api", () => {
  class FileView {
    file: { path: string; extension: string } | null = null;
  }

  class Plugin {
    app: unknown;
    manifest: unknown;

    constructor(app: unknown, manifest: unknown) {
      this.app = app;
      this.manifest = manifest;
    }

    registerView(...args: unknown[]) {
      harness.viewRegistration = args;
    }

    registerEditorView(contribution: Record<string, unknown>) {
      harness.editorView = contribution;
    }

    registerMarkdownViewMenuItem(handler: (context: unknown) => void) {
      harness.menuHandler = handler;
    }

    addCommand(command: typeof harness.command) {
      harness.command = command;
    }
  }

  class Notice {
    constructor(message: string) {
      harness.notices.push(message);
    }
  }

  return { FileView, Notice, Plugin };
});

import { FileView } from "@lapis-notes/api";
import { TranscriptsPlugin } from "./transcripts-plugin";

function createApp() {
  const target = { setViewState: vi.fn(async () => undefined) };
  const workspace = {
    activeLeaf: null as unknown,
    getLeaf: vi.fn(() => target),
    activateLeaf: vi.fn(),
    revealLeaf: vi.fn(async () => undefined),
    requestSaveLayout: vi.fn(),
  };
  return { app: { workspace }, target, workspace };
}

function markdownLeaf(path = "Notes/Contract transcript.md") {
  const view = new (FileView as unknown as new () => FileView)() as FileView & {
    file: { path: string; extension: string };
  };
  view.file = {
    path,
    extension: path.split(".").at(-1) ?? "",
  } as never;
  return { id: "source-leaf", view };
}

describe("TranscriptsPlugin", () => {
  beforeEach(() => {
    harness.notices.length = 0;
    harness.command = null;
    harness.menuHandler = null;
    harness.viewRegistration = null;
    harness.editorView = null;
  });

  it("registers the reading view, command, and Markdown menu item", () => {
    const { app } = createApp();
    new TranscriptsPlugin(app as never).onload();

    expect(harness.viewRegistration?.[0]).toBe("lapis-transcripts-reading");
    expect(harness.viewRegistration?.[2]).toEqual({ kind: "file" });
    expect(harness.command).toMatchObject({
      id: "open-transcript",
      name: "Open transcript",
    });
    expect(harness.editorView).toEqual({
      id: "lapis-transcripts-reading-file",
      viewType: "lapis-transcripts-reading",
      label: "Transcript",
      filenamePatterns: ["*transcript.md"],
      priority: "exclusive",
    });
    expect(harness.menuHandler).toBeTypeOf("function");
  });

  it("notices when there is no Markdown note to open", async () => {
    const { app, workspace } = createApp();
    new TranscriptsPlugin(app as never).onload();

    await harness.command?.callback();
    workspace.activeLeaf = markdownLeaf("diagram.json");
    await harness.command?.callback();

    expect(harness.notices).toEqual([
      "No active file to open as a transcript",
      "Transcripts are only available for Markdown files",
    ]);
  });

  it("opens a transcript tab that remembers the source leaf", async () => {
    const { app, target, workspace } = createApp();
    const source = markdownLeaf("Notes/Contract transcript.markdown");
    workspace.activeLeaf = source;
    new TranscriptsPlugin(app as never).onload();

    await harness.command?.callback();

    expect(workspace.getLeaf).toHaveBeenCalledWith("tab");
    expect(target.setViewState).toHaveBeenCalledWith(
      {
        type: "lapis-transcripts-reading",
        state: {
          file: "Notes/Contract transcript.markdown",
          id: "source-leaf",
        },
      },
      { history: true },
    );
    expect(workspace.activateLeaf).toHaveBeenCalledWith(target, {
      focusRootHost: false,
      source: "api",
      operation: "open-transcript",
    });
    expect(workspace.revealLeaf).toHaveBeenCalledWith(target);
    expect(workspace.requestSaveLayout).toHaveBeenCalledOnce();
  });
});
