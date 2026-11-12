import { expect, test, vi } from "vitest";
import { canvasTextFile, createCanvasTextAdapter } from "./canvas-text-preview";

const virtual = canvasTextFile("card");
const note = { path: "Folder/Note.md", name: "Note.md", extension: "md", kind: "markdown" as const };
function setup() {
  const base = {
    resolveLink: vi.fn(() => note), readMarkdown: vi.fn(async () => "Vault note body"),
    writeMarkdown: vi.fn(async () => {}), watchFile: vi.fn(() => vi.fn()),
  };
  const source = { value: "Virtual card text" };
  const write = vi.fn();
  const adapter = createCanvasTextAdapter(source, write, undefined, { adapter: base, file: virtual, sourcePath: "Folder/Board.canvas" });
  return { adapter, base, source, write };
}

test("virtual text links resolve relative to their owning Canvas rather than a synthetic path", async () => {
  const f = setup();
  expect(await f.adapter.resolveLink({ href: "Note.md", path: "Note.md", sourcePath: virtual.path })).toEqual(note);
  expect(f.base.resolveLink).toHaveBeenCalledWith(expect.objectContaining({ sourcePath: "Folder/Board.canvas" }));
});

test("virtual reads/writes stay local while resolved note reads use the public vault adapter", async () => {
  const f = setup();
  expect(await f.adapter.readMarkdown!(virtual)).toBe("Virtual card text");
  expect(await f.adapter.readMarkdown!(note)).toBe("Vault note body");
  await f.adapter.writeMarkdown!(virtual, "Edited card");
  expect(f.write).toHaveBeenCalledWith("Edited card");
  expect(f.base.writeMarkdown).not.toHaveBeenCalled();
  await f.adapter.writeMarkdown!(note, "Edited vault note");
  expect(f.base.writeMarkdown).toHaveBeenCalledWith(note, "Edited vault note");
});

test("vault-file watchers use the public adapter and virtual watchers stay private", () => {
  const f = setup(); const changed = vi.fn();
  const stopVirtual = f.adapter.watchFile!(virtual, changed);
  expect(f.base.watchFile).not.toHaveBeenCalled();
  f.adapter.reload(); expect(changed).toHaveBeenCalledTimes(1);
  if (typeof stopVirtual === "function") stopVirtual();
  f.adapter.reload(); expect(changed).toHaveBeenCalledTimes(1);
  f.adapter.watchFile!(note, changed);
  expect(f.base.watchFile).toHaveBeenCalledWith(note, changed);
});


test("virtual and real file editing bindings keep their separate owners", () => {
  const localBinding = { write: vi.fn(), release: vi.fn() };
  const vaultBinding = { write: vi.fn(), release: vi.fn() };
  const bindLocal = vi.fn(() => localBinding);
  const bindVault = vi.fn(() => vaultBinding);
  const session = { dirty: false, flush: vi.fn(async () => {}), protect: vi.fn(async () => () => {}) };
  const adapter = createCanvasTextAdapter({ value: "Card" }, vi.fn(), bindLocal, {
    adapter: { resolveLink: () => null, bindMarkdownEditingSession: bindVault },
    file: virtual, sourcePath: "Folder/Board.canvas",
  });
  expect(adapter.bindMarkdownEditingSession!(virtual.path, session)).toBe(localBinding);
  expect(bindVault).not.toHaveBeenCalled();
  expect(adapter.bindMarkdownEditingSession!(note.path, session)).toBe(vaultBinding);
  expect(bindLocal).toHaveBeenCalledTimes(1);
  expect(bindVault).toHaveBeenCalledWith(note.path, session);
});


test("unbound standalone virtual cards never register a synthetic vault writer", () => {
  const register = vi.fn(); const bind = vi.fn();
  const adapter = createCanvasTextAdapter({ value: "Card" }, vi.fn(), undefined, {
    adapter: { resolveLink: () => null, bindMarkdownEditingSession: bind, registerEditingSession: register },
    file: virtual, sourcePath: "Board.canvas",
  });
  expect(adapter.bindMarkdownEditingSession).toBeUndefined();
  adapter.registerEditingSession!(virtual.path, { dirty: false, flush: async () => {}, protect: async () => () => {} });
  expect(register).not.toHaveBeenCalled();
  expect(bind).not.toHaveBeenCalled();
});
