import { expect, it, vi } from "vitest";
import { fixture, nativeFixture, writer } from "./file-editing.test.fixture";

it("holds fresh bound preview input until native intent admission", async () => {
  const f = nativeFixture();
  const target = f.bind();
  expect(target.session.text!.state.readonly).toBe(true);
  expect(() => target.edit("too early")).toThrow(/protected/);
  expect(f.conditionalWrite).not.toHaveBeenCalled();
  f.admit();
  await vi.waitFor(() =>
    expect(target.session.text!.state.readonly).toBe(false)
  );
  expect(f.state()).toMatchObject({ active: true, dirty: false });
  target.binding.release();
  await f.app.fileEditingSessions.afterMutations(async () => {});
  expect(f.state()).toBeUndefined();
});

it("admits a retained dirty source without flushing before its binding is installed", async () => {
  const f = nativeFixture();
  const target = writer();
  target.edit("retained draft");
  const bound = f.bind(target);
  expect(target.session.text!.state.readonly).toBe(true);
  expect(f.conditionalWrite).not.toHaveBeenCalled();
  f.admit();
  await vi.waitFor(() =>
    expect(target.session.text!.state.readonly).toBe(false)
  );
  await target.session.flush();
  expect(f.disk()).toBe("retained draft");
  await f.app.fileEditingSessions.guard("note.md", async () => {
    expect(f.state()).toMatchObject({ active: false, dirty: false });
    expect(target.session.text!.state.readonly).toBe(true);
  });
  expect(f.state()).toMatchObject({ active: true, generation: 2 });
  bound.binding.release();
  await f.app.fileEditingSessions.afterMutations(async () => {});
  expect(f.state()).toBeUndefined();
});

it("joins existing preview persistence while retaining native intent and input protection", async () => {
  const f = nativeFixture();
  const target = f.bind();
  f.admit();
  await vi.waitFor(() =>
    expect(target.session.text!.state.readonly).toBe(false)
  );
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const original = f.conditionalWrite.getMockImplementation()!;
  f.conditionalWrite.mockImplementationOnce(async (...args) => {
    await pending;
    await original(...args);
  });
  target.edit("in-flight draft");
  const saving = target.session.flush();
  const guarded = f.app.fileEditingSessions.guard("note.md", async () => {
    expect(f.disk()).toBe("in-flight draft");
    expect(f.state()?.active).toBe(false);
  });
  await vi.waitFor(() =>
    expect(target.session.text!.state.readonly).toBe(true)
  );
  expect(f.state()?.active).toBe(true);
  finish();
  await saving;
  await guarded;
  expect(f.events).toContain("yield");
  expect(f.state()).toMatchObject({ active: true, generation: 2 });
  target.binding.release();
  await f.app.fileEditingSessions.afterMutations(async () => {});
});

it("uses the source session's acknowledged text instead of unrelated vault reads", async () => {
  const f = fixture();
  const target = f.bind();
  target.edit("local draft");
  f.external("external");
  await f.adapter.readMarkdown!({ path: "note.md" });
  await expect(target.session.flush()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  expect(f.conditionalWrite.mock.calls[0][2]).toBe("original");
  expect(f.modify).not.toHaveBeenCalled();
  expect(f.disk()).toBe("external");
  expect(f.app.fileEditingSessions.textConflicts.entries[0]).toMatchObject({
    baseline: "original",
    local: "local draft",
    external: "external",
  });
});

it("resolves a bound draft through the original App and starts subsequent saves at the new baseline", async () => {
  const f = fixture();
  const target = f.bind();
  target.edit("retained draft");
  f.external("external");
  await expect(target.session.flush()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  await f.app.fileEditingSessions.textConflicts.entries[0].resolve(
    "keep-local"
  );
  expect(f.disk()).toBe("retained draft");
  expect(target.session.dirty).toBe(false);
  target.edit("next save");
  await target.session.flush();
  expect(f.conditionalWrite.mock.calls.at(-1)?.[2]).toBe("retained draft");
  target.binding.release();
  expect(target.subscribers()).toBe(0);
});

it("revalidates external acceptance and retains a new decision when disk changes again", async () => {
  const f = fixture();
  const target = f.bind();
  target.edit("draft");
  f.external("first external");
  await expect(target.session.flush()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  f.external("second external");
  await expect(
    f.app.fileEditingSessions.textConflicts.entries[0].resolve("use-external")
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  expect(target.session.text!.state.value).toBe("draft");
  await f.app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external"
  );
  expect(target.session.text!.state.value).toBe("second external");
  expect(target.session.dirty).toBe(false);
  expect(f.modify).not.toHaveBeenCalled();
});

it("keeps independent baselines for two previews of the same file", async () => {
  const f = fixture();
  const first = f.bind();
  f.external("new baseline");
  const second = f.bind(writer("new baseline"));
  first.edit("old document draft");
  await expect(first.session.flush()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  second.edit("new document draft");
  await second.session.flush();
  expect(f.disk()).toBe("new document draft");
  expect(f.conditionalWrite.mock.calls.map((call) => call[2])).toEqual([
    "original",
    "new baseline",
  ]);
  expect(f.app.fileEditingSessions.textConflicts.entries[0].local).toBe(
    "old document draft"
  );
});

it("keeps a failed retired writer in the App barrier until its retained draft is resolved", async () => {
  const f = fixture();
  const target = f.bind();
  target.edit("retired draft");
  f.external("external");
  await expect(target.session.flush()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  // Mira retains the binding while the failed surface is detached.
  await expect(
    f.app.fileEditingSessions.guard(undefined, async () => undefined)
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  await f.app.fileEditingSessions.textConflicts.entries[0].resolve(
    "keep-local"
  );
  target.binding.release();
  await expect(f.app.fileEditingSessions.flush()).resolves.toEqual({
    flushed: false,
  });
  expect(f.disk()).toBe("retired draft");
});

it("joins bound pending edits before admitting an external mutation", async () => {
  const f = fixture();
  const target = f.bind();
  target.edit("pending draft");
  await f.app.fileEditingSessions.guard("note.md", async () => {
    expect(f.disk()).toBe("pending draft");
    expect(target.session.text!.state.readonly).toBe(true);
    expect(() => target.edit("during mutation")).toThrow(/protected/);
  });
  expect(target.session.text!.state.readonly).toBe(false);
});

it("rejects unbound writes on a conditional host without an unconditional fallback", async () => {
  const f = fixture();
  await expect(
    f.adapter.writeMarkdown!({ path: "note.md" }, "unsafe")
  ).rejects.toThrow(/bound|session/i);
  expect(f.modify).not.toHaveBeenCalled();
  expect(f.conditionalWrite).not.toHaveBeenCalled();
});

it("rejects a conditional binding without text authority or a valid Markdown file", () => {
  const f = fixture();
  const target = writer();
  const { text: _text, ...withoutText } = target.session;
  expect(() =>
    f.adapter.bindMarkdownEditingSession!("note.md", withoutText)
  ).toThrow(/text|session/i);
  expect(() =>
    f.adapter.bindMarkdownEditingSession!("missing.md", target.session)
  ).toThrow(/not found/i);
  expect(target.subscribers()).toBe(0);
});

it("preserves ordinary-host persistence while registering its bound session", async () => {
  const f = fixture(false);
  const target = f.bind();
  target.edit("legacy draft");
  await f.app.fileEditingSessions.flush("note.md");
  expect(f.disk()).toBe("legacy draft");
  expect(f.modify).toHaveBeenCalledExactlyOnceWith(f.file, "legacy draft");
  expect(f.conditionalWrite).not.toHaveBeenCalled();
  target.binding.release();
  target.binding.release();
  await expect(f.app.fileEditingSessions.flush()).resolves.toEqual({
    flushed: false,
  });
});

it("rejects a renamed captured destination instead of redirecting its queued draft", async () => {
  const f = fixture();
  const target = f.bind();
  target.edit("original destination draft");
  f.file.path = "renamed.md";
  await expect(target.session.flush()).rejects.toThrow(/target|destination/i);
  expect(f.modify).not.toHaveBeenCalled();
  expect(f.conditionalWrite).not.toHaveBeenCalled();
});
