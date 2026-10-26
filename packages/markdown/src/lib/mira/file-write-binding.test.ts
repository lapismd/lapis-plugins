import {
  FileEditingSessionRegistry,
  type App,
  type TFile,
} from "@lapis-notes/api";
import type {
  MiraMarkdownEditingSession,
  MiraMarkdownTextState,
} from "@lapismd/mira/extensions";
import { expect, it, vi } from "vitest";
import { createLapisMiraFileAdapter } from "./file-adapter";
import type {
  NativeEditingIntents,
  EditingIntentState,
} from "@lapis-notes/api/native-editing-intents";

function writer(initial = "original") {
  let value = initial,
    persistedValue = initial,
    error: Error | null = null,
    saving = false,
    holds = 0;
  let write: (value: string) => void | Promise<void> = () => {
    throw new Error("Writer is not bound");
  };
  const listeners = new Set<(state: MiraMarkdownTextState) => void>();
  const state = () => ({
    value,
    persistedValue,
    error,
    saving,
    dirty: value !== persistedValue,
    readonly: holds > 0,
  });
  const emit = () => {
    for (const listener of listeners) listener(state());
  };
  const release = () => {
    holds--;
    emit();
  };
  const session: MiraMarkdownEditingSession = {
    hold() {
      holds++;
      emit();
      let held = true;
      return () => {
        if (held) {
          held = false;
          release();
        }
      };
    },
    get dirty() {
      return value !== persistedValue || saving || error !== null;
    },
    async flush() {
      if (!session.dirty) return;
      const snapshot = value;
      saving = true;
      emit();
      try {
        await write(snapshot);
        persistedValue = snapshot;
        error = null;
      } catch (cause) {
        error = cause as Error;
        throw cause;
      } finally {
        saving = false;
        emit();
      }
    },
    async protect() {
      holds++;
      emit();
      try {
        await session.flush();
        return release;
      } catch (cause) {
        release();
        throw cause;
      }
    },
    text: {
      get state() {
        return state();
      },
      subscribe(listener) {
        listeners.add(listener);
        listener(state());
        return () => {
          listeners.delete(listener);
        };
      },
      protectRecovery: vi.fn(async () => {
        holds++;
        emit();
        return {
          release,
          acceptLocal() {
            persistedValue = value;
            error = null;
            emit();
          },
          useExternal(contents) {
            value = contents;
            persistedValue = contents;
            error = null;
            emit();
          },
        };
      }),
    },
  };
  return {
    session,
    bind: (persist: typeof write) => {
      write = persist;
    },
    edit: (contents: string) => {
      if (holds) throw new Error("Writer is protected");
      value = contents;
      emit();
    },
    subscribers: () => listeners.size,
  };
}

function fixture(
  conditional = true,
  native?: (read: () => string) => NativeEditingIntents
) {
  let disk = "original";
  const file = { path: "note.md", name: "note.md", extension: "md" } as TFile;
  const modify = vi.fn(async (_file: TFile, contents: string) => {
    disk = contents;
  });
  const conditionalWrite = vi.fn(
    async (_file: TFile, contents: string, expected: string | null) => {
      if (disk !== expected)
        throw Object.assign(new Error("changed externally"), {
          code: "ECONFLICT",
        });
      disk = contents;
    }
  );
  const app = {
    vault: {
      supportsConditionalTextWrites: conditional,
      getFileByPath: (path: string) => (path === "note.md" ? file : null),
      read: vi.fn(async () => disk),
      cachedRead: vi.fn(async () => disk),
      modify,
      modifyIfUnchanged: conditionalWrite,
    },
    fileEditingSessions: new FileEditingSessionRegistry(native?.(() => disk)),
  } as unknown as App;
  const adapter = createLapisMiraFileAdapter(app);
  function bind(target = writer()) {
    const binding = adapter.bindMarkdownEditingSession!(
      "note.md",
      target.session
    );
    target.bind(binding.write);
    return { ...target, binding };
  }
  return {
    app,
    file,
    adapter,
    bind,
    modify,
    conditionalWrite,
    disk: () => disk,
    external: (contents: string) => {
      disk = contents;
    },
  };
}

function nativeFixture() {
  let state: EditingIntentState | undefined;
  let admit!: () => void;
  const admission = new Promise<void>((resolve) => {
    admit = resolve;
  });
  const events: string[] = [];
  const f = fixture(true, (read) => ({
    async read(path) {
      return { path, text: read(), version: read() };
    },
    async call(command) {
      events.push(command.kind);
      if (command.kind === "acquire") {
        await admission;
        state ??= {
          editor_id: command.editor_id,
          path: command.path,
          generation: 1,
          revision: 0,
          dirty: false,
          active: true,
          detached: false,
        };
      } else if (command.kind === "changed") {
        state!.revision = command.revision;
        state!.dirty = true;
      } else if (command.kind === "yield") {
        expect(command.revision).toBe(state!.revision);
        state!.active = false;
        state!.dirty = false;
      } else if (command.kind === "resume") {
        state!.generation = command.generation;
        state!.active = true;
      } else if (command.kind === "retire") {
        state = undefined;
        return { kind: "retired" };
      }
      return state
        ? { kind: "state", state: { ...state } }
        : { kind: "missing" };
    },
  }));
  return { ...f, admit, events, state: () => state };
}

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
