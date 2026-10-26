import {
  FileTextPersistence,
  type App,
  type FileEditingSession,
} from "@lapis-notes/api";
import type {
  MiraMarkdownEditingBinding,
  MiraMarkdownEditingSession,
} from "@lapismd/mira/extensions";

/** One source session retains its App, destination and conditional baseline. */
export function bindLapisMarkdownEditingSession(
  app: App,
  path: string,
  session: MiraMarkdownEditingSession
): MiraMarkdownEditingBinding {
  const file = app.vault.getFileByPath(path);
  if (!file) throw new Error(`Markdown file not found: ${path}`);
  if (file.extension !== "md" && file.extension !== "markdown")
    throw new Error(`Cannot write non-Markdown file: ${path}`);
  const text = session.text;
  if (app.vault.supportsConditionalTextWrites && !text)
    throw new Error(
      "Conditional Markdown editing requires source text authority"
    );
  let tail = Promise.resolve();
  function serialize(run: () => Promise<void>): Promise<void> {
    const result = tail.then(run);
    tail = result.catch(() => undefined);
    return result;
  }
  const persistence = app.vault.supportsConditionalTextWrites
    ? new FileTextPersistence({
        vault: app.vault,
        file,
        baseline: text!.state.persistedValue,
        conflicts: app.fileEditingSessions.textConflicts,
        local: () => text!.state.value,
        async protect() {
          const lease = await text!.protectRecovery();
          return {
            release: () => lease.release(),
            saved: () => lease.acceptLocal(),
            reset: (contents) => lease.useExternal(contents),
          };
        },
        serialize,
      })
    : undefined;
  const owned: FileEditingSession = {
    get dirty() {
      return session.dirty;
    },
    flush: () => session.flush(),
    protect: () => session.protect(),
    native: text
      ? {
          hold() {
            if (typeof session.hold !== "function")
              throw new Error(
                "Native Markdown editing requires synchronous input protection"
              );
            return session.hold();
          },
          savedText: () => text.state.persistedValue,
        }
      : undefined,
  };
  const unregister = app.fileEditingSessions.register(path, owned);
  let observedValue = text?.state.value;
  let observedDirty = session.dirty;
  let unsubscribe: (() => void) | undefined;
  try {
    unsubscribe = text?.subscribe((state) => {
      const dirty = state.dirty || state.saving || state.error !== null;
      if (
        unregister.native &&
        dirty &&
        (!observedDirty || state.value !== observedValue)
      )
        unregister.changed();
      observedValue = state.value;
      observedDirty = dirty;
      persistence?.updateLocal(state.value);
      if (!state.dirty && !state.saving && state.error === null)
        persistence?.acceptBaseline(state.persistedValue);
    });
  } catch (error) {
    unregister();
    throw error;
  }
  let released = false;
  return {
    write(value) {
      return serialize(async () => {
        if (unregister.native) await unregister.ready();
        if (released) throw new Error("Markdown editing binding is released");
        if (file.path !== path)
          throw new Error("Markdown persistence target changed");
        if (persistence) await persistence.persist(value);
        else await app.vault.modify(file, value);
      });
    },
    release() {
      if (released) return;
      unsubscribe?.();
      unsubscribe = undefined;
      unregister();
      released = true;
    },
  };
}
