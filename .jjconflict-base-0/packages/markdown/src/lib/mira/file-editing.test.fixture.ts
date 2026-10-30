import {
  FileEditingSessionRegistry,
  type App,
  type TFile,
} from "@lapis-notes/api";
import type {
  MiraMarkdownEditingSession,
  MiraMarkdownTextState,
} from "@lapismd/mira/extensions";
import { expect, vi } from "vitest";
import { createLapisMiraFileAdapter } from "./file-adapter";
import type {
  NativeEditingIntents,
  EditingIntentState,
} from "@lapis-notes/api/native-editing-intents";

export function writer(initial = "original") {
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
          useExternal(contents: string) {
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

export function fixture(
  conditional = true,
  native?: (read: () => string | null) => NativeEditingIntents
) {
  let disk: string | null = "original";
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
    external: (contents: string | null) => {
      disk = contents;
    },
  };
}

export function nativeFixture() {
  let state: EditingIntentState | undefined;
  let admit!: () => void;
  const admission = new Promise<void>((resolve) => {
    admit = resolve;
  });
  const events: string[] = [];
  const f = fixture(true, (read) => ({
    async read(path) {
      const text = read();
      return text === null ? null : { path, text, version: text };
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
