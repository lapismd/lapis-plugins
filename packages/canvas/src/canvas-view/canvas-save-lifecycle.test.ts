import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const harness = vi.hoisted(() => ({ renders: [] as any[] }));
vi.mock("@lapis-notes/api", () => ({
  FileView: class {
    app: any;
    file: any;
    loaded = true;
    containerEl = { empty: vi.fn() };
    constructor(leaf: any) { this.app = leaf.application; }
    getState() { return {}; }
    setState() { return Promise.resolve(); }
  },
  mountComponent: vi.fn((_component, { props }) => {
    harness.renders.push(props);
    return { props, destroy: vi.fn() };
  }),
}));
vi.mock("svelte", () => ({
  mount: vi.fn((_component, { props }) => {
    harness.renders.push(props);
    return {};
  }),
  unmount: vi.fn(),
}));
vi.mock("./canvas-view.svelte", () => ({ default: {} }));
import { CanvasView } from "./index";

const file = (path: string): any => ({
  path, basename: path, extension: "canvas", copy() { return { ...this }; },
});
function setup() {
  const app = { vault: { read: vi.fn(async () => '{"nodes":[]}'), modify: vi.fn(async () => {}) } };
  const view = new CanvasView({ application: app } as any);
  return { app, view };
}
const props = () => harness.renders.at(-1);
beforeEach(() => { vi.useFakeTimers(); harness.renders.length = 0; });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe("Canvas save ownership", () => {
  test("flushes the old file before switching to a new file", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("A draft");
    await view.onLoadFile(file("B.canvas"));
    await vi.advanceTimersByTimeAsync(300);
    expect(app.vault.modify.mock.calls.map(([target, value]: any[]) => [target.path, value]))
      .toEqual([["A.canvas", "A draft"]]);
  });

  test("flushes queued changes before unloading a file", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("A draft");
    await view.onUnloadFile();
    await vi.advanceTimersByTimeAsync(300);
    expect(app.vault.modify).toHaveBeenCalledWith(expect.objectContaining({ path: "A.canvas" }), "A draft");
  });

  test("blocks closing when persistence fails and allows an explicit retry", async () => {
    const { app, view } = setup();
    app.vault.modify.mockRejectedValueOnce(new Error("disk full"));
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("Retained draft");
    await expect((view as any).onClose()).rejects.toThrow("disk full");
    await (view as any).onClose();
    expect(app.vault.modify).toHaveBeenLastCalledWith(expect.objectContaining({ path: "A.canvas" }), "Retained draft");
  });

  test("serializes writes while draining the latest queued document", async () => {
    const { app, view } = setup();
    let complete!: () => void;
    app.vault.modify.mockImplementationOnce(() => new Promise<void>((resolve) => { complete = resolve; }));
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("First");
    await vi.advanceTimersByTimeAsync(250);
    props().onDocumentChange("Latest");
    await vi.advanceTimersByTimeAsync(250);
    expect(app.vault.modify).toHaveBeenCalledTimes(1);
    complete();
    await (view as any).onClose();
    expect(app.vault.modify.mock.calls.map((call: any[]) => call[1])).toEqual(["First", "Latest"]);
  });

  test("uses the public reactive mount contract for save and settings props", async () => {
    const { view } = setup();
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("Draft");
    expect(props().saveState).toBe("saving");
    expect(props().rawJson).toBe('{"nodes":[]}');
    await vi.advanceTimersByTimeAsync(250);
    expect(props().saveState).toBe("saved");
  });
  test("an older failed write does not overwrite a newer draft", async () => {
    const { app, view } = setup();
    let fail!: (error: Error) => void;
    app.vault.modify.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { fail = reject; }));
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("First");
    await vi.advanceTimersByTimeAsync(250);
    props().onDocumentChange("Latest");
    fail(new Error("disk full"));
    await vi.advanceTimersByTimeAsync(0);
    expect(props().saveState).toBe("error");
    await (view as any).onClose();
    expect(app.vault.modify.mock.calls.map((call: any[]) => call[1])).toEqual(["First", "Latest"]);
  });

  test("a slow old read cannot replace a newer file binding", async () => {
    const { app, view } = setup();
    let readA!: (value: string) => void;
    app.vault.read.mockImplementationOnce(() => new Promise<string>((resolve) => { readA = resolve; }));
    const oldLoad = view.onLoadFile(file("A.canvas"));
    await Promise.resolve();
    await view.onLoadFile(file("B.canvas"));
    expect(view.containerEl.inert).toBe(false);
    readA('{"nodes":[]}');
    await oldLoad;
    expect(view.file?.path).toBe("B.canvas");
  });

  test("protects the pane while a new file read is pending", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    let finishRead!: (value: string) => void;
    app.vault.read.mockImplementationOnce(() => new Promise<string>((resolve) => { finishRead = resolve; }));
    const loading = view.onLoadFile(file("B.canvas"));
    expect(view.containerEl.inert).toBe(true);
    await Promise.resolve();
    finishRead('{"nodes":[]}');
    await loading;
    expect(view.containerEl.inert).toBe(false);
  });

  test("drains board changes delivered while the next file is loading", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    const oldProps = props();
    let finishRead!: (value: string) => void;
    app.vault.read.mockImplementationOnce(() => new Promise<string>((resolve) => { finishRead = resolve; }));
    const loading = view.onLoadFile(file("B.canvas"));
    await Promise.resolve();
    oldProps.onDocumentChange("Delivered during transition");
    finishRead('{"nodes":[]}');
    await loading;
    expect(app.vault.modify).toHaveBeenCalledWith(expect.objectContaining({ path: "A.canvas" }), "Delivered during transition");
  });

});
