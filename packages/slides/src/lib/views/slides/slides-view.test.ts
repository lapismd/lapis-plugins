// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  mountedProps: null as null | Record<string, unknown>,
  component: { id: "slides-component" },
  unmount: vi.fn(),
}));

vi.mock("./slides-view.svelte", () => ({ default: { name: "SlidesView" } }));
vi.mock("svelte", () => ({
  mount: vi.fn((_component, options: { props: Record<string, unknown> }) => {
    harness.mountedProps = options.props;
    return harness.component;
  }),
  unmount: harness.unmount,
}));

vi.mock("@lapis-notes/api", () => {
  class WorkspaceLeaf {
    app: unknown;
    id: string;
    parent: { children: unknown[] };
    close = vi.fn();

    constructor(app: unknown, id: string) {
      this.app = app;
      this.id = id;
      this.parent = { children: [this] };
    }
  }

  class TextFileView {
    app: unknown;
    leaf: WorkspaceLeaf;
    file: { path: string; baseName: string } | null = null;
    state: Record<string, unknown> = {};
    actions: unknown[] = [];
    editor = {
      value: "",
      getValue() {
        return this.value;
      },
      setValue(value: string) {
        this.value = value;
      },
    };
    containerEl = (() => {
      const element = document.createElement("div");
      return Object.assign(element, {
      empty() {
          element.replaceChildren();
      },
      });
    })();

    constructor(leaf?: WorkspaceLeaf) {
      this.leaf = leaf as WorkspaceLeaf;
      this.app = leaf?.app;
    }

    getState() {
      return this.state;
    }
  }

  return {
    TextFileView,
    WorkspaceLeaf,
    useLocale: () => ({ t: (value: string) => value }),
  };
});

import { WorkspaceLeaf } from "@lapis-notes/api";
import { SlidesView, SlidesViewType } from "./index";

function createView() {
  const workspace = {
    activeLeaf: null as unknown,
    getLeafById: vi.fn(),
    setActiveLeaf: vi.fn(),
  };
  const app = { workspace };
  const WorkspaceLeafConstructor = WorkspaceLeaf as unknown as new (
    app: unknown,
    id: string,
  ) => WorkspaceLeaf;
  const leaf = new WorkspaceLeafConstructor(app, "slides-leaf") as never;
  const view = new SlidesView(leaf);
  return { app, leaf: leaf as unknown as WorkspaceLeaf, view, workspace };
}

describe("SlidesView", () => {
  beforeEach(() => {
    harness.mountedProps = null;
    harness.unmount.mockClear();
  });

  it("keeps the legacy view identity and Markdown file contract", () => {
    const { view } = createView();
    view.file = { path: "Deck.md", baseName: "Deck" } as never;

    expect(view.getViewType()).toBe(SlidesViewType);
    expect(view.getDisplayText()).toBe("Deck");
    expect(view.getIcon()).toBe("lucide-presentation");
    expect(view.canAcceptExtension("md")).toBe(true);
    expect(view.canAcceptExtension("markdown")).toBe(true);
    expect(view.canAcceptExtension("txt")).toBe(false);
  });

  it("reads, writes, and clears its inherited editor", () => {
    const { view } = createView();
    view.setViewData("# Deck");
    expect(view.getViewData()).toBe("# Deck");
    view.clear();
    expect(view.getViewData()).toBe("");
  });

  it("mounts the presentation and returns to its explicit source leaf", () => {
    const { app, leaf, view, workspace } = createView();
    const WorkspaceLeafConstructor = WorkspaceLeaf as unknown as new (
      app: unknown,
      id: string,
    ) => WorkspaceLeaf;
    const source = new WorkspaceLeafConstructor(app, "source-leaf");
    workspace.getLeafById.mockReturnValue(source);
    view.file = { path: "Deck.md", baseName: "Deck" } as never;
    (view as unknown as { state: Record<string, unknown> }).state = {
      id: "source-leaf",
    };

    view.load();
    expect(harness.mountedProps).toMatchObject({
      app,
      editor: view.editor,
      sourcePath: "Deck.md",
    });

    (harness.mountedProps?.onClose as () => void)();
    expect(leaf.close).toHaveBeenCalledOnce();
    expect(workspace.setActiveLeaf).toHaveBeenCalledWith(source);
  });

  it("falls back to a sibling source leaf and unmounts cleanly", () => {
    const { app, leaf, view, workspace } = createView();
    const WorkspaceLeafConstructor = WorkspaceLeaf as unknown as new (
      app: unknown,
      id: string,
    ) => WorkspaceLeaf;
    const sibling = new WorkspaceLeafConstructor(app, "sibling");
    (leaf as unknown as { parent: { children: unknown[] } }).parent.children = [
      leaf,
      sibling,
    ];

    view.load();
    (harness.mountedProps?.onClose as () => void)();
    expect(workspace.setActiveLeaf).toHaveBeenCalledWith(sibling);

    view.unload();
    expect(harness.unmount).toHaveBeenCalledWith(harness.component);
  });
});
