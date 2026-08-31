// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  notices: [] as string[],
  command: null as null | { id: string; name: string; callback: () => unknown },
  menuHandler: null as null | ((context: unknown) => void),
  viewRegistration: null as null | unknown[],
}));

vi.mock("reveal.js/dist/reveal.css?inline", () => ({
  default: ".reveal { display: block; }",
}));

vi.mock("./views/slides", () => ({
  SlidesView: class SlidesView {},
  SlidesViewType: "slides",
}));

vi.mock("@lapis-notes/api", () => {
  class FileView {
    file: { path: string; extension: string } | null = null;
  }

  class WorkspaceLeaf {
    id = "leaf";
    view: unknown = null;
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

  return {
    FileView,
    Notice,
    Plugin,
    WorkspaceLeaf,
    useLocale: () => ({ t: (value: string) => value }),
  };
});

import { FileView } from "@lapis-notes/api";
import { SlidesPlugin } from "./slides-plugin";

function createApp() {
  const target = {
    setViewState: vi.fn(async () => undefined),
  };
  const workspace = {
    activeLeaf: null as unknown,
    getLeaf: vi.fn(() => target),
    activateLeaf: vi.fn(),
    revealLeaf: vi.fn(async () => undefined),
    requestSaveLayout: vi.fn(),
  };
  return { app: { workspace }, target, workspace };
}

function markdownLeaf(path = "Deck.md") {
  const FileViewConstructor = FileView as unknown as new () => FileView;
  const view = new FileViewConstructor() as FileView & {
    file: { path: string; extension: string };
  };
  view.file = {
    path,
    extension: path.split(".").at(-1) ?? "",
  } as never;
  return { id: "source-leaf", view };
}

describe("SlidesPlugin", () => {
  beforeEach(() => {
    harness.notices.length = 0;
    harness.command = null;
    harness.menuHandler = null;
    harness.viewRegistration = null;
    document.head.replaceChildren();
  });

  it("registers the file view, Markdown menu item, command, and scoped Reveal CSS", async () => {
    const { app } = createApp();
    const plugin = new SlidesPlugin(app as never);

    await plugin.onload();

    expect(harness.viewRegistration?.[0]).toBe("slides");
    expect(harness.viewRegistration?.[2]).toEqual({ kind: "file" });
    expect(harness.command).toMatchObject({
      id: "start-presentation",
      name: "Start presentation",
    });
    expect(harness.menuHandler).toBeTypeOf("function");
    expect(document.querySelector("#plugin-slides-styles")?.textContent).toBe(
      ".reveal { display: block; }",
    );

    plugin.onunload();
    expect(document.querySelector("#plugin-slides-styles")).toBeNull();
  });

  it("notices when no source leaf or non-Markdown file is active", async () => {
    const { app, workspace } = createApp();
    const plugin = new SlidesPlugin(app as never);
    await plugin.onload();

    await harness.command?.callback();
    workspace.activeLeaf = markdownLeaf("diagram.json");
    await harness.command?.callback();

    expect(harness.notices).toEqual([
      "No active file to present",
      "Slides are only available for markdown files",
    ]);
  });

  it("opens a new Slides tab that retains its explicit source leaf", async () => {
    const { app, target, workspace } = createApp();
    const source = markdownLeaf("Release Walkthrough.markdown");
    workspace.activeLeaf = source;
    const plugin = new SlidesPlugin(app as never);
    await plugin.onload();

    await harness.command?.callback();

    expect(workspace.getLeaf).toHaveBeenCalledWith("tab");
    expect(target.setViewState).toHaveBeenCalledWith(
      {
        type: "slides",
        state: {
          file: "Release Walkthrough.markdown",
          id: "source-leaf",
        },
      },
      { history: true },
    );
    expect(workspace.activateLeaf).toHaveBeenCalledWith(target, {
      focusRootHost: false,
      source: "api",
      operation: "start-presentation",
    });
    expect(workspace.revealLeaf).toHaveBeenCalledWith(target);
    expect(workspace.requestSaveLayout).toHaveBeenCalledOnce();
  });

  it("uses the Markdown menu leaf rather than another active leaf", async () => {
    const { app, target, workspace } = createApp();
    workspace.activeLeaf = markdownLeaf("Other.md");
    const source = markdownLeaf("Menu Deck.md");
    const plugin = new SlidesPlugin(app as never);
    await plugin.onload();

    let onClick: (() => void) | undefined;
    type MenuItem = {
      setSection: ReturnType<typeof vi.fn>;
      setTitle: ReturnType<typeof vi.fn>;
      setIcon: ReturnType<typeof vi.fn>;
      onClick: ReturnType<typeof vi.fn>;
    };
    const item: MenuItem = {
      setSection: vi.fn().mockReturnThis(),
      setTitle: vi.fn().mockReturnThis(),
      setIcon: vi.fn().mockReturnThis(),
      onClick: vi.fn((callback: () => void) => {
        onClick = callback;
        return item;
      }),
    };
    const menu: {
      addItem: ReturnType<typeof vi.fn>;
      addSeparator: ReturnType<typeof vi.fn>;
    } = {
      addItem: vi.fn(),
      addSeparator: vi.fn(),
    };
    menu.addItem = vi.fn((callback: (item: MenuItem) => void) => {
        callback(item);
        return menu;
      });
    menu.addSeparator = vi.fn(() => menu);

    harness.menuHandler?.({ menu, leaf: source });
    onClick?.();
    await vi.waitFor(() => expect(target.setViewState).toHaveBeenCalled());

    expect(item.setSection).toHaveBeenCalledWith("view");
    expect(item.setIcon).toHaveBeenCalledWith("lucide-presentation");
    expect(target.setViewState).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.objectContaining({ file: "Menu Deck.md" }),
      }),
      { history: true },
    );
  });
});
