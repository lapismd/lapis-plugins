import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FileEditingSessionRegistry } from "@lapis-notes/api";
import type { MiraMarkdownEditingBinding, MiraMarkdownEditingSession, MiraMarkdownTextState } from "@lapismd/mira/extensions";
import { CanvasDocumentSession } from "./canvas-document-session";

const document = (text: string) => JSON.stringify({ metadata: { keep: true }, nodes: [{ id: "text", type: "text", x: 0, y: 0, width: 260, height: 160, text }] });

function fixture() {
  let disk = document("Saved");
  const registry = new FileEditingSessionRegistry();
  const vault = {
    supportsConditionalTextWrites: true,
    read: vi.fn(async () => disk),
    modifyIfUnchanged: vi.fn(async (_file: unknown, value: string, expected: string | null) => {
      if (expected !== disk) throw Object.assign(new Error("drift"), { code: "ECONFLICT" });
      disk = value;
    }),
  };
  let holds = 0;
  const reset = vi.fn();
  const session = new CanvasDocumentSession({
    app: { vault, fileEditingSessions: registry } as any,
    file: { path: "Board.canvas", copy() { return this; } } as any,
    baseline: disk,
    hold: () => { holds++; return () => { holds--; }; },
    reset,
    changed: vi.fn(),
  });
  return { session, registry, vault, reset, get holds() { return holds; }, get disk() { return disk; }, external(value: string) { disk = value; } };
}

/** Public Mira editing port: drafts can exist before its bound write runs. */
function editor() {
  let value = "Saved", saved = value, error: Error | null = null;
  let holds = 0;
  const listeners = new Set<(state: MiraMarkdownTextState) => void>();
  const state = (): MiraMarkdownTextState => ({ value, persistedValue: saved, dirty: value !== saved, saving: false, readonly: holds > 0, error });
  const emit = () => { for (const listener of listeners) listener(state()); };
  let binding: MiraMarkdownEditingBinding;
  const port: MiraMarkdownEditingSession = {
    get dirty() { return value !== saved || error !== null; },
    hold: vi.fn(() => { holds++; emit(); return () => { holds--; emit(); }; }),
    async flush() {
      if (!port.dirty) return;
      try { await binding.write(value); saved = value; error = null; emit(); }
      catch (cause) { error = cause as Error; emit(); throw cause; }
    },
    async protect() { const release = port.hold!(); await port.flush(); return release; },
    text: {
      get state() { return state(); },
      subscribe(listener) { listeners.add(listener); listener(state()); return () => { listeners.delete(listener); }; },
      async protectRecovery() {
        const release = port.hold!();
        return {
          release,
          acceptLocal() { saved = value; error = null; emit(); },
          useExternal(next) { value = saved = next; error = null; emit(); },
        };
      },
    },
  };
  return { port, attach(next: MiraMarkdownEditingBinding) { binding = next; }, update(next: string) { value = next; emit(); }, get value() { return value; } };
}
function attach(f: ReturnType<typeof fixture>, e = editor()) {
  e.attach(f.session.bindText("text", e.port, (value) => { f.session.enqueue(document(value)); }));
  return e;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

test("pending text buffers belong to the parent file before Mira debounce writes", () => {
  const f = fixture();
  const e = attach(f);
  e.update("Unflushed draft");
  expect(f.registry.hasDirty("Board.canvas")).toBe(true);
  expect(f.vault.modifyIfUnchanged).not.toHaveBeenCalled();
});

test("App flush drains child text into the captured Canvas before acknowledging it", async () => {
  const f = fixture();
  const e = attach(f);
  e.update("Latest text");
  await f.registry.flush("Board.canvas");
  expect(JSON.parse(f.disk).nodes[0].text).toBe("Latest text");
  expect(e.port.dirty).toBe(false);
  expect(f.session.dirty).toBe(false);
});

test("failed JSON persistence leaves the child draft dirty and retryable", async () => {
  const f = fixture();
  const e = attach(f);
  e.update("Retained text");
  f.vault.modifyIfUnchanged.mockRejectedValueOnce(new Error("disk full"));
  await expect(f.session.flush()).rejects.toThrow("disk full");
  expect(e.port.dirty).toBe(true);
  expect(JSON.parse(f.disk).nodes[0].text).toBe("Saved");
  await f.session.flush();
  expect(JSON.parse(f.disk).nodes[0].text).toBe("Retained text");
  expect(e.port.dirty).toBe(false);
});

test("protection holds child input synchronously before its first await", async () => {
  const f = fixture();
  const e = attach(f);
  const protection = f.session.protect();
  expect(e.port.hold).toHaveBeenCalled();
  expect(f.holds).toBeGreaterThan(0);
  const release = await protection;
  release();
  expect(e.port.text!.state.readonly).toBe(false);
  expect(f.holds).toBe(0);
});

test("conflict review includes pending text and keep-local acknowledges the complete document", async () => {
  const f = fixture();
  const e = attach(f);
  f.session.enqueue(document("Saved"));
  e.update("Pending local text");
  f.external(document("External"));
  await vi.advanceTimersByTimeAsync(250);
  const conflict = f.registry.textConflicts.entries[0];
  expect(JSON.parse(conflict.local).nodes[0].text).toBe("Pending local text");
  await conflict.resolve("keep-local");
  expect(JSON.parse(f.disk).nodes[0].text).toBe("Pending local text");
  expect(JSON.parse(f.disk).metadata).toEqual({ keep: true });
  expect(e.port.dirty).toBe(false);
  expect(f.session.dirty).toBe(false);
});

test("accepting external deletion cleans removed child buffers before resetting the board", async () => {
  const f = fixture();
  const e = attach(f);
  e.update("Pending local text");
  f.external('{"nodes":[]}');
  await expect(f.session.flush()).rejects.toThrow("File changed on disk");
  f.reset.mockImplementation(() => { expect(e.port.dirty).toBe(false); expect(e.value).toBe(""); });
  await f.registry.textConflicts.entries[0].resolve("use-external");
  expect(f.reset).toHaveBeenCalledWith('{"nodes":[]}');
  expect(f.session.dirty).toBe(false);
});

test("a protected native saved-text refresh also replaces clean child editor buffers", async () => {
  const f = fixture();
  const e = attach(f);
  await f.session.native.refreshSavedText(document("New native text"));
  expect(e.value).toBe("New native text");
  expect(e.port.dirty).toBe(false);
  expect(f.reset).toHaveBeenCalledWith(document("New native text"));
});

test("a detached pending editor retains its component until App retry acknowledges the JSON", async () => {
  const f = fixture();
  const e = attach(f);
  e.update("Detached pending text");
  const cleanup = vi.fn();
  f.session.retire(cleanup);
  f.vault.modifyIfUnchanged.mockRejectedValueOnce(new Error("disk full"));
  await expect(f.session.flush()).rejects.toThrow("disk full");
  expect(cleanup).not.toHaveBeenCalled();
  expect(f.registry.hasDirty("Board.canvas")).toBe(true);
  await f.registry.flush("Board.canvas");
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(JSON.parse(f.disk).nodes[0].text).toBe("Detached pending text");
  expect(f.holds).toBe(0);
});

test("reviewed merged text resets pending editor buffers after conditional persistence", async () => {
  const f = fixture();
  const e = attach(f);
  e.update("Local text");
  f.external(document("External text"));
  await expect(f.session.flush()).rejects.toThrow("File changed on disk");
  await f.registry.textConflicts.entries[0].resolveMerged(document("Reviewed merged text"));
  expect(e.value).toBe("Reviewed merged text");
  expect(JSON.parse(f.disk).nodes[0].text).toBe("Reviewed merged text");
  expect(f.session.dirty).toBe(false);
});

test("clipboard snapshots include pending text without acknowledging or writing it", () => {
  const f = fixture();
  const e = attach(f);
  e.update("Pending clipboard text");
  const snapshot = f.session.snapshot(JSON.parse(f.disk));
  expect(snapshot.nodes?.[0]).toMatchObject({ text: "Pending clipboard text" });
  expect(f.session.dirty).toBe(true);
  expect(f.vault.modifyIfUnchanged).not.toHaveBeenCalled();
});
