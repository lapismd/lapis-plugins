import {
  App,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  installApplicationCompatibility,
} from "@lapis-notes/api";
import type {
  EditingIntentState,
  NativeEditingIntents,
} from "@lapis-notes/api/native-editing-intents";
import { MarkdownPlugin } from "@lapis-notes/markdown";

/** Disposable transport state only; the real App/Mira writer persists content. */
export async function createNativePreviewFixture() {
  const path = "Native preview.md";
  const original = "# Native preview\n\nThe original note.";
  const adapter = new MemoryVaultAdapter({ [path]: original });
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    async writeTextIfUnchanged(
      file: string,
      text: string,
      expected: string | null
    ) {
      const current = (await adapter.exists(file))
        ? await adapter.read(file)
        : null;
      if (current !== expected)
        throw Object.assign(new Error("File changed"), { code: "ECONFLICT" });
      await adapter.write(file, text);
    },
  });
  let admit!: () => void;
  const admission = new Promise<void>((resolve) => {
    admit = resolve;
  });
  const states = new Map<string, EditingIntentState>();
  const retired = new Set<string>();
  const port: NativeEditingIntents = {
    async read(file) {
      return (await adapter.exists(file))
        ? {
            path: file,
            text: await adapter.read(file),
            version: await adapter.read(file),
          }
        : null;
    },
    async call(command) {
      if (command.kind === "list")
        return { kind: "states", states: [...states.values()] };
      const id = command.editor_id;
      if (command.kind === "acquire") {
        if (command.path === path) await admission;
        states.set(id, {
          editor_id: id,
          path: command.path,
          generation: 1,
          revision: 0,
          dirty: false,
          active: true,
          detached: false,
        });
      }
      const state = states.get(id);
      if (command.kind === "changed" && state) {
        state.revision = command.revision;
        state.dirty = true;
      } else if (command.kind === "yield" && state) {
        state.active = false;
        state.dirty = false;
      } else if (command.kind === "resume" && state) {
        state.generation = command.generation;
        state.active = true;
      } else if (command.kind === "retire") {
        states.delete(id);
        retired.add(id);
      }
      if (retired.has(id)) return { kind: "retired" };
      return state
        ? { kind: "state", state: { ...state } }
        : { kind: "missing" };
    },
  };
  const database = new MemoryAppDatabase(
    `native-preview-${crypto.randomUUID()}`
  );
  const app = new App({
    version: "native-preview-story",
    adapter,
    appDatabase: database,
    nativeEditingIntents: port,
    markdownRenderer: async () => {},
  });
  const compatibility = installApplicationCompatibility(app);
  await database.open();
  app.plugins.registerCorePlugins([{ plugin: MarkdownPlugin, required: true }]);
  await app.vault.load();
  await app.configuration.load();
  await app.plugins.loadPlugins({
    communityPlugins: "disabled",
    optionalCorePlugins: "disabled",
  });
  await app.metadataCache.load();
  const file = app.vault.getFileByPath(path)!;
  return {
    app,
    file,
    adapter,
    original,
    admit,
    state: () => [...states.values()].find((state) => state.path === path),
    async dispose() {
      admit();
      await app.plugins.flushPendingConfigWrites();
      await app.fileEditingSessions.settleOperations();
      await app.fileEditingSessions.guard(undefined, async () => {
        await app.workspace.disposeWorkspaceHost();
        await app.metadataCache.dispose({ persist: false });
        for (const plugin of [...app.plugins.plugins.values()].reverse())
          await plugin.disable();
      });
      await app.fileEditingSessions.dispose();
      await database.close();
      compatibility();
    },
  };
}

export type NativePreviewFixture = Awaited<
  ReturnType<typeof createNativePreviewFixture>
>;
