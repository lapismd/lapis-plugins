import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const harness = vi.hoisted(() => ({ renders: [] as any[] }));
vi.mock("@lapis-notes/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@lapis-notes/api")>()),
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
vi.mock("svelte", async (importOriginal) => ({
  ...(await importOriginal<typeof import("svelte")>()),
  mount: vi.fn((_component, { props }) => {
    harness.renders.push(props);
    return {};
  }),
  unmount: vi.fn(),
}));
vi.mock("./canvas-view.svelte", () => ({ default: {} }));
import { CanvasView } from "./index";
import { FileEditingSessionRegistry, type NativeEditingIntents } from "@lapis-notes/api";

const file = (path: string): any => ({
  path, basename: path, extension: "canvas", copy() { return { ...this }; },
});
function setup(native?: NativeEditingIntents) {
  const fileEditingSessions = new FileEditingSessionRegistry(native);
  vi.spyOn(fileEditingSessions, "register");
  const app = {
    vault: { supportsConditionalTextWrites: true, read: vi.fn(async () => '{"nodes":[]}'), modify: vi.fn(async (_target: any, _value: string) => {}), modifyIfUnchanged: vi.fn(async (_target: any, _value: string, _baseline: string | null) => {}) },
    fileEditingSessions,
  };
  app.vault.modifyIfUnchanged.mockImplementation(async (target: any, value: string) => app.vault.modify(target, value));
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
    await vi.advanceTimersByTimeAsync(0);
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
    await vi.advanceTimersByTimeAsync(0);
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
    await vi.advanceTimersByTimeAsync(0);
    oldProps.onDocumentChange("Delivered during transition");
    finishRead('{"nodes":[]}');
    await loading;
    expect(app.vault.modify).toHaveBeenCalledWith(expect.objectContaining({ path: "A.canvas" }), "Delivered during transition");
  });

  test("registers its captured Canvas writer with the owning App", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    expect(app.fileEditingSessions.register).toHaveBeenCalledWith("A.canvas", expect.objectContaining({
      flush: expect.any(Function), protect: expect.any(Function), native: expect.objectContaining({ hold: expect.any(Function) }),
    }));
    const session = vi.mocked(app.fileEditingSessions.register).mock.calls[0][1];
    props().onDocumentChange("Retained draft");
    expect(session.dirty).toBe(true);
    await session.flush();
    expect(session.dirty).toBe(false);
  });

  test("writes conditionally against the last acknowledged bytes", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("First draft");
    await (view as any).onClose();
    props().onDocumentChange("Second draft");
    await (view as any).onClose();
    expect(app.vault.modifyIfUnchanged.mock.calls.map((call: any[]) => call.slice(1)))
      .toEqual([["First draft", '{"nodes":[]}'], ["Second draft", "First draft"]]);
  });

  test("publishes external-write conflicts and keeps the local draft until reviewed", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("Local draft");
    app.vault.read.mockResolvedValue("External draft");
    app.vault.modifyIfUnchanged.mockRejectedValueOnce(Object.assign(new Error("drift"), { code: "ECONFLICT" }));
    await expect((view as any).onClose()).rejects.toThrow("File changed on disk");
    expect(app.fileEditingSessions.hasDirty("A.canvas")).toBe(true);
    expect(props().rawJson).toBe('{"nodes":[]}');
    const conflict = app.fileEditingSessions.textConflicts.entries[0];
    expect(conflict).toMatchObject({ path: "A.canvas", local: "Local draft", external: "External draft" });
    await conflict.resolve("keep-local");
    expect(app.vault.modifyIfUnchanged).toHaveBeenLastCalledWith(expect.objectContaining({ path: "A.canvas" }), "Local draft", "External draft");
    expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
    expect(app.fileEditingSessions.hasDirty("A.canvas")).toBe(false);
    await (view as any).onClose();
  });

  test("use-external recovery replaces the board only after explicit review", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("Local draft");
    app.vault.read.mockResolvedValue("External draft");
    app.vault.modifyIfUnchanged.mockRejectedValueOnce(Object.assign(new Error("drift"), { code: "ECONFLICT" }));
    await expect((view as any).onClose()).rejects.toThrow("File changed on disk");
    await app.fileEditingSessions.textConflicts.entries[0].resolve("use-external");
    expect(props().rawJson).toBe("External draft");
    expect(app.fileEditingSessions.hasDirty("A.canvas")).toBe(false);
    expect(app.vault.modify).not.toHaveBeenCalled();
  });

  test("retains an unexpectedly detached failed writer for App recovery", async () => {
    const { app, view } = setup();
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("Detached draft");
    app.vault.modify.mockRejectedValueOnce(new Error("disk full"));
    view.onunload();
    await vi.advanceTimersByTimeAsync(0);
    expect(app.fileEditingSessions.hasDirty("A.canvas")).toBe(true);
    expect(view.containerEl.inert).toBe(true);
    await app.fileEditingSessions.flush("A.canvas");
    expect(app.vault.modify).toHaveBeenLastCalledWith(expect.objectContaining({ path: "A.canvas" }), "Detached draft");
    expect(app.fileEditingSessions.hasDirty("A.canvas")).toBe(false);
    expect(view.containerEl.inert).toBe(false);
    logged.mockRestore();
  });

  test("native admission holds input and completes before the board is published", async () => {
    let admit!: () => void;
    const gate = new Promise<void>((resolve) => { admit = resolve; });
    const native: NativeEditingIntents = {
      read: vi.fn(async () => ({ path: "A.canvas", text: '{"nodes":[]}', version: "v1" })),
      call: vi.fn(async (command) => {
        if (command.kind !== "acquire") throw new Error("Unexpected native command");
        await gate;
        return { kind: "state" as const, state: { editor_id: command.editor_id, path: command.path, generation: 1, revision: 0, active: true, dirty: false, detached: false } };
      }),
    };
    const { view } = setup(native);
    const loading = view.onLoadFile(file("A.canvas"));
    await vi.advanceTimersByTimeAsync(0);
    expect(native.call).toHaveBeenCalledWith(expect.objectContaining({ kind: "acquire", path: "A.canvas" }));
    expect(view.containerEl.inert).toBe(true);
    expect(harness.renders).toHaveLength(0);
    admit();
    await loading;
    expect(view.containerEl.inert).toBe(false);
    expect(harness.renders).toHaveLength(1);
  });

  test("App guards hold the Canvas until a protected operation has completed", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("Draft");
    let complete!: () => void;
    const operation = app.fileEditingSessions.guard("A.canvas", () => {
      expect(view.containerEl.inert).toBe(true);
      expect(app.vault.modify).toHaveBeenCalledWith(expect.objectContaining({ path: "A.canvas" }), "Draft");
      return new Promise<void>((resolve) => { complete = resolve; });
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(view.containerEl.inert).toBe(true);
    complete();
    await operation;
    expect(view.containerEl.inert).toBe(false);
  });

  test("preserves legacy persistence on hosts without the optional conditional capability", async () => {
    const { app, view } = setup();
    app.vault.supportsConditionalTextWrites = false;
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("Legacy draft");
    await (view as any).onClose();
    expect(app.vault.modify).toHaveBeenCalledWith(expect.objectContaining({ path: "A.canvas" }), "Legacy draft");
    expect(app.vault.modifyIfUnchanged).not.toHaveBeenCalled();
    expect(app.fileEditingSessions.hasDirty("A.canvas")).toBe(false);
  });

  test("a conditional conflict never falls back if the host capability later disappears", async () => {
    const { app, view } = setup();
    await view.onLoadFile(file("A.canvas"));
    props().onDocumentChange("Local draft");
    app.vault.modifyIfUnchanged.mockRejectedValueOnce(Object.assign(new Error("drift"), { code: "ECONFLICT" }));
    await expect((view as any).onClose()).rejects.toThrow("File changed on disk");
    app.vault.supportsConditionalTextWrites = false;
    await expect((view as any).onClose()).rejects.toThrow("File changed on disk");
    expect(app.vault.modify).not.toHaveBeenCalled();
  });

});
