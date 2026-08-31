// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";

const revealHarness = vi.hoisted(() => ({
  instances: [] as Array<{
    initialize: ReturnType<typeof vi.fn>;
    configure: ReturnType<typeof vi.fn>;
    getIndices: ReturnType<typeof vi.fn>;
    layout: ReturnType<typeof vi.fn>;
    slide: ReturnType<typeof vi.fn>;
    sync: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("reveal.js", () => ({
  default: class Reveal {
    initialize = vi.fn(async () => undefined);
    configure = vi.fn();
    getIndices = vi.fn(() => ({ h: 1, v: 0, f: 0 }));
    layout = vi.fn();
    slide = vi.fn();
    sync = vi.fn();
    destroy = vi.fn();

    constructor() {
      revealHarness.instances.push(this);
    }
  },
}));

vi.mock("reveal.js/plugin/notes/notes", () => ({ default: {} }));

import SlidesViewComponent from "./slides-view.svelte";

type ChangeHandler = (value: string) => void;

function createEditor(initial: string) {
  let value = initial;
  let changeHandler: ChangeHandler | null = null;
  const reference = { id: "editor-change" };
  const stopTracking = vi.fn();
  const editor = {
    getValue: vi.fn(() => value),
    setValue: vi.fn((next: string) => {
      value = next;
    }),
    trackChanges: vi.fn(() => stopTracking),
    on: vi.fn((_event: string, handler: ChangeHandler) => {
      changeHandler = handler;
      return reference;
    }),
    offref: vi.fn(),
  };
  return {
    editor,
    emit(next: string) {
      value = next;
      changeHandler?.(next);
    },
    reference,
    stopTracking,
  };
}

describe("SlidesViewComponent", () => {
  let target: HTMLDivElement;
  let boundsSpy: ReturnType<typeof vi.spyOn>;
  let frameId = 0;
  const frames = new Map<number, ReturnType<typeof setTimeout>>();

  beforeEach(() => {
    revealHarness.instances.length = 0;
    target = document.createElement("div");
    document.body.appendChild(target);
    boundsSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(0, 0, 1200, 800));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frameId += 1;
      const id = frameId;
      frames.set(
        id,
        setTimeout(() => {
          frames.delete(id);
          callback(performance.now());
        }, 0),
      );
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      const timer = frames.get(id);
      if (timer) clearTimeout(timer);
      frames.delete(id);
    });
  });

  afterEach(() => {
    for (const timer of frames.values()) clearTimeout(timer);
    frames.clear();
    target.remove();
    boundsSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("renders the recursive deck, refreshes live content, and retains Reveal indices", async () => {
    const editor = createEditor(
      "# Start\n\n---\n\n## Goals\n\n- First\n\nNotes: Explain goals",
    );
    const onClose = vi.fn();
    const component = mount(SlidesViewComponent, {
      target,
      props: {
        app: {} as never,
        editor: editor.editor as never,
        sourcePath: "Release Walkthrough.md",
        onClose,
      },
    });

    await vi.waitFor(() => {
      expect(
        target.querySelector('[data-testid="slides-deck"]')?.getAttribute(
          "data-reveal-ready",
        ),
      ).toBe("true");
    });
    expect(target.textContent).toContain("## Goals");
    expect(target.querySelector("aside.notes")?.textContent).toContain(
      "Explain goals",
    );

    const reveal = revealHarness.instances[0];
    reveal.slide.mockClear();
    editor.emit(
      "# Start\n\n---\n\n## Updated goals\n\n- First\n- Second\n\nNotes: Explain goals",
    );

    await vi.waitFor(() => {
      expect(target.textContent).toContain("## Updated goals");
      expect(reveal.slide).toHaveBeenCalledWith(1, 0, 0);
    });

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(onClose).toHaveBeenCalledOnce();

    await unmount(component);
    expect(editor.stopTracking).toHaveBeenCalledOnce();
    expect(editor.editor.offref).toHaveBeenCalledWith(editor.reference);
    expect(reveal.destroy).toHaveBeenCalledOnce();
  });
});
