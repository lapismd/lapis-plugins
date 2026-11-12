import { expect, test, vi } from "vitest";
import type { App, TFile } from "@lapis-notes/api";
import { CanvasImageSource } from "./canvas-image-source";
const imageFile = (path = "Art.svg", extension = "svg") => ({ path, extension, name: path.split("/").at(-1)!, copy() { return { ...this }; } }) as unknown as TFile;
function fixture(read: (file: TFile) => Promise<string> = async () => "blob:initial") {
  const files = new Map<string, TFile>([["Art.svg", imageFile()]]);
  const events = new Map<string, Set<(...args: any[]) => void>>();
  const vault = {
    getFileByPath: (path: string) => files.get(path) ?? null,
    getResourceUrl: vi.fn(read), revokeResourceUrl: vi.fn(), modify: vi.fn(),
    on(event: string, callback: (...args: any[]) => void) { if (!events.has(event)) events.set(event, new Set()); events.get(event)!.add(callback); return { event, callback }; },
    offref: vi.fn(({ event, callback }) => { events.get(event)?.delete(callback); }),
  };
  const app = { vault, metadataCache: { getFirstLinkpathDest: () => null } } as unknown as App;
  const changed = vi.fn();
  const source = new CanvasImageSource(app, "Art.svg", "Board.canvas", changed);
  return { app, files, vault, source, changed, emit(event: string, ...args: any[]) { for (const callback of events.get(event) ?? []) callback(...args); } };
}
test("matching image updates acquire a new URL and release the previous lease", async () => {
  const f = fixture(); await f.source.ready;
  expect(f.changed).toHaveBeenLastCalledWith({ url: "blob:initial", error: null });
  f.emit("modify", imageFile("Other.svg")); expect(f.vault.getResourceUrl).toHaveBeenCalledTimes(1);
  f.vault.getResourceUrl.mockResolvedValueOnce("blob:next"); f.emit("modify", imageFile()); await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith({ url: "blob:next", error: null });
  expect(f.vault.revokeResourceUrl).toHaveBeenCalledWith("blob:initial");
  expect(f.vault.modify).not.toHaveBeenCalled(); f.source.destroy();
  expect(f.vault.revokeResourceUrl.mock.calls).toEqual([["blob:initial"], ["blob:next"]]);
});
test("a stale asynchronous resource read releases its lease without publishing", async () => {
  let finish!: (value: string) => void;
  const f = fixture(() => new Promise((resolve) => { finish = resolve; }));
  f.vault.getResourceUrl.mockResolvedValueOnce("blob:latest"); f.emit("modify", imageFile()); await Promise.resolve();
  finish("blob:stale"); await f.source.ready;
  expect(f.changed.mock.calls).toEqual([[{ url: "blob:latest", error: null }]]);
  expect(f.vault.revokeResourceUrl).toHaveBeenCalledWith("blob:stale"); f.source.destroy();
});
test("disposal cancels pending publication and releases every URL and listener once", async () => {
  let finish!: (value: string) => void;
  const f = fixture(() => new Promise((resolve) => { finish = resolve; }));
  f.source.destroy(); f.source.destroy(); finish("blob:late"); await f.source.ready;
  expect(f.changed).not.toHaveBeenCalled(); expect(f.vault.offref).toHaveBeenCalledTimes(4);
  expect(f.vault.revokeResourceUrl.mock.calls).toEqual([["blob:late"]]);
});
test("missing or unsupported backgrounds do not acquire resources and image creation recovers", async () => {
  const f = fixture(); await f.source.ready; f.files.clear(); f.emit("delete", imageFile()); await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith(expect.objectContaining({ url: null, error: expect.stringContaining("existing vault image") }));
  f.files.set("Art.svg", imageFile("Art.svg", "pdf")); f.emit("create", imageFile()); await Promise.resolve();
  expect(f.vault.getResourceUrl).toHaveBeenCalledTimes(1);
  f.files.set("Art.svg", imageFile()); f.emit("create", imageFile()); await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith({ url: "blob:initial", error: null }); f.source.destroy();
});
test("resource failures clear the old lease and can recover on a later update", async () => {
  const f = fixture(); await f.source.ready;
  f.vault.getResourceUrl.mockRejectedValueOnce(new Error("Read denied")); f.emit("modify", imageFile()); await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith({ url: null, error: "Read denied" });
  expect(f.vault.revokeResourceUrl).toHaveBeenCalledWith("blob:initial");
  f.vault.getResourceUrl.mockResolvedValueOnce("blob:recovered"); f.emit("modify", imageFile()); await Promise.resolve();
  expect(f.changed).toHaveBeenLastCalledWith({ url: "blob:recovered", error: null }); f.source.destroy();
});
test("sibling surfaces retain separate leases even when the public vault shares a URL", async () => {
  let leases = 0;
  const f = fixture(async () => { leases++; return "blob:shared"; });
  f.vault.revokeResourceUrl.mockImplementation(() => { leases--; });
  const sibling = new CanvasImageSource(f.app, "Art.svg", "Other.canvas", vi.fn());
  await Promise.all([f.source.ready, sibling.ready]); expect(leases).toBe(2);
  f.source.destroy(); expect(leases).toBe(1);
  f.emit("modify", imageFile()); await Promise.resolve(); expect(leases).toBe(1);
  sibling.destroy(); expect(leases).toBe(0);
});
