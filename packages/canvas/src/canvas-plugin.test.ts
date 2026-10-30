import { describe, expect, it, vi } from "vitest";

vi.mock("@lapis-notes/api", async () => {
  class MockEmbedRegistry {
    readonly embedByExtension: Record<string, unknown> = {};

    register(extension: string, view: unknown): () => void {
      this.embedByExtension[extension.toLowerCase()] = view;
      return () => {
        delete this.embedByExtension[extension.toLowerCase()];
      };
    }

    get(extension: string): unknown {
      return this.embedByExtension[extension.toLowerCase()] ?? null;
    }
  }

  class MockPlugin {
    readonly unloaders = new Set<() => void>();

    constructor(
      readonly app: any,
      readonly manifest: any,
    ) {}

    register(callback: () => void): void {
      this.unloaders.add(callback);
    }

    unload(): void {
      this.unloaders.forEach((callback) => callback());
      this.unloaders.clear();
    }

    registerView(type: string, creator: unknown, access?: unknown): void {
      this.app.registerView(type, creator, access);
      this.register(() => this.app.unregisterView?.(type, creator));
    }

    registerEditorView(config: unknown): void {
      this.app.registerEditorView?.(config);
    }

    registerExtensions(extensions: string[], viewType: string): void {
      this.app.registerExtensions(extensions, viewType);
      this.register(() =>
        this.app.unregisterExtensions?.(extensions, viewType),
      );
    }

    addCommand(_command: unknown): void {}

    addRibbonIcon(_icon: string, _title: string, _callback: () => void): void {}

    loadData(): Promise<unknown> {
      return Promise.resolve(null);
    }
  }

  return {
    EmbedRegistry: MockEmbedRegistry,
    Plugin: MockPlugin,
  };
});

vi.mock("./canvas-view", () => ({
  CanvasView: class {},
  CanvasViewType: "lapis-canvas",
}));

vi.mock("@xyflow/svelte/dist/style.css?inline", () => ({
  default: "",
}));

vi.mock("./canvas-embed.svelte", () => ({
  default: Symbol("CanvasEmbed"),
}));

vi.mock("svelte", () => ({
  mount: vi.fn(() => ({ destroy: vi.fn() })),
  unmount: vi.fn(),
}));

import { EmbedRegistry } from "@lapis-notes/api";
import { CanvasPlugin } from "./canvas-plugin";

function createMockApp() {
  return {
    embedRegistry: new EmbedRegistry(),
    registerView: vi.fn(),
    unregisterView: vi.fn(),
    registerEditorView: vi.fn(),
    registerExtensions: vi.fn(),
    unregisterExtensions: vi.fn(),
    vault: {
      read: vi.fn(),
      create: vi.fn(),
    },
    workspace: {
      getLeaf: vi.fn(),
      revealLeaf: vi.fn(),
    },
    fileManager: {
      getAvailablePathForAttachment: vi.fn(),
    },
  } as any;
}

describe("CanvasPlugin", () => {
  it("registers the canvas file view and embed renderer", async () => {
    const app = createMockApp();
    const plugin = new CanvasPlugin(app);

    await plugin.onload();

    expect(app.registerView).toHaveBeenCalledWith(
      "lapis-canvas",
      expect.any(Function),
      { kind: "file" },
    );
    expect(app.registerEditorView).toHaveBeenCalledWith({
      id: "lapis-canvas-file",
      viewType: "lapis-canvas",
      label: "Canvas",
      filenamePatterns: ["*.canvas"],
      priority: "exclusive",
    });
    expect(app.registerExtensions).toHaveBeenCalledWith(
      ["canvas"],
      "lapis-canvas",
    );
    expect(app.embedRegistry.get("canvas")).toBeTypeOf("function");
  });

  it("removes the embed renderer on unload", async () => {
    const app = createMockApp();
    const plugin = new CanvasPlugin(app);

    await plugin.onload();
    plugin.unload();

    expect(app.embedRegistry.get("canvas")).toBeNull();
  });
});
