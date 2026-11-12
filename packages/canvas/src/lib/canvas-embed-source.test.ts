import { expect, test, vi } from "vitest";
import { CanvasEmbedSource } from "./canvas-embed-source";

const file = (path: string): any => ({ path, extension: "canvas", copy() { return { ...this }; } });
function fixture(read: (...args: any[]) => Promise<string> = async () => "Initial") {
  const events = new Map<string, Set<(...args: any[]) => void>>();
  const vault = {
    read: vi.fn(read),
    getFileByPath: vi.fn((path: string) => file(path)),
    on(event: string, callback: (...args: any[]) => void) {
      if (!events.has(event)) events.set(event, new Set());
      events.get(event)!.add(callback);
      return { event, callback };
    },
    offref: vi.fn(({ event, callback }) => { events.get(event)?.delete(callback); }),
  };
  const changed = vi.fn();
  const source = new CanvasEmbedSource({ vault } as any, file("Folder/Live.canvas"), changed);
  return { vault, source, changed, emit(event: string, ...args: any[]) { for (const callback of events.get(event) ?? []) callback(...args); }, listeners() { return [...events.values()].reduce((count, entries) => count + entries.size, 0); } };
}

test("reads the source and updates only for matching file modifications", async () => {
  const f = fixture();
  await f.source.ready;
  expect(f.changed).toHaveBeenLastCalledWith({ value: "Initial", sourcePath: "Folder/Live.canvas", error: null });
  f.emit("modify", file("Other.canvas"));
  expect(f.vault.read).toHaveBeenCalledTimes(1);
  f.vault.read.mockResolvedValueOnce("Updated");
  f.emit("modify", file("Folder/Live.canvas"));
  await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith({ value: "Updated", sourcePath: "Folder/Live.canvas", error: null });
  f.source.destroy();
  expect(f.listeners()).toBe(0);
});

test("a stale initial read cannot replace a newer modification", async () => {
  let finish!: (value: string) => void;
  const f = fixture(() => new Promise<string>((resolve) => { finish = resolve; }));
  f.vault.read.mockResolvedValueOnce("Latest");
  f.emit("modify", file("Folder/Live.canvas"));
  await Promise.resolve();
  finish("Old");
  await f.source.ready;
  expect(f.changed.mock.calls.map(([snapshot]) => snapshot.value)).toEqual(["Latest"]);
  f.source.destroy();
});

test("destroy cancels pending publication and releases each subscription once", async () => {
  let finish!: (value: string) => void;
  const f = fixture(() => new Promise<string>((resolve) => { finish = resolve; }));
  expect(f.listeners()).toBe(4);
  f.source.destroy(); f.source.destroy();
  finish("Late"); await f.source.ready;
  expect(f.changed).not.toHaveBeenCalled();
  expect(f.vault.offref).toHaveBeenCalledTimes(4);
});

test("rename retargets subsequent reads, including folder moves", async () => {
  const f = fixture(); await f.source.ready;
  f.emit("rename", file("Moved"), "Folder");
  await Promise.resolve();
  expect(f.vault.read).toHaveBeenLastCalledWith(expect.objectContaining({ path: "Moved/Live.canvas" }));
  f.emit("rename", file("Moved/Renamed.canvas"), "Moved/Live.canvas");
  await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith(expect.objectContaining({ sourcePath: "Moved/Renamed.canvas" }));
  f.source.destroy();
});

test("delete invalidates an earlier read and a recreated source can recover", async () => {
  let finish!: (value: string) => void;
  const f = fixture(() => new Promise<string>((resolve) => { finish = resolve; }));
  f.emit("delete", file("Folder"));
  finish("Deleted old value"); await f.source.ready;
  expect(f.changed).toHaveBeenCalledTimes(1);
  expect(f.changed).toHaveBeenLastCalledWith(expect.objectContaining({ error: expect.stringContaining("removed") }));
  f.vault.read.mockResolvedValueOnce("Recreated");
  f.emit("create", file("Folder/Live.canvas")); await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith(expect.objectContaining({ value: "Recreated", error: null }));
  f.source.destroy();
});

test("read errors are visible and a later update recovers without writing the source", async () => {
  const f = fixture(async () => { throw new Error("read denied"); }); await f.source.ready;
  expect(f.changed).toHaveBeenLastCalledWith(expect.objectContaining({ error: "read denied" }));
  f.vault.read.mockResolvedValueOnce("Recovered");
  f.emit("modify", file("Folder/Live.canvas")); await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith(expect.objectContaining({ value: "Recovered", error: null }));
  f.source.destroy();
});
