import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
import {
  bindRepository,
  RepositoryPlugin,
  type RepositoryServices,
} from "@lapis-notes/history/repository";
import { operationFixture } from "../../../../packages/history/test/repository/fixtures/operations";
import { repositoryLayout, type Placement } from "./layout";

export type RepositoryStoryOptions = {
  services?(app: App, base: RepositoryServices): RepositoryServices;
  data?: Record<string, unknown>;
};
type Runtime = { app: App; dispose(): Promise<void> };
const openings = new Set<Promise<Runtime>>();
export function createRepositoryStory(
  placement: Placement,
  operations: boolean,
  scenario: string,
  original = false,
  options: RepositoryStoryOptions = {}
) {
  const opening = bootRepositoryStory(
    placement,
    operations,
    scenario,
    original,
    options
  );
  openings.add(opening);
  return opening;
}
export async function cleanupRepositoryStories() {
  for (const opening of openings) await (await opening).dispose();
  openings.clear();
}
async function bootRepositoryStory(
  placement: Placement,
  operations: boolean,
  scenario: string,
  original: boolean,
  options: RepositoryStoryOptions
) {
  const fixture = operationFixture(scenario);
  let app!: App;
  const disposeModels = $effect.root(() => {
    app = new App({
      version: "0.0.1-story",
      configPath: ".lapis/app.json",
      adapter: new MemoryVaultAdapter({
        ".lapis/app.json": "{}",
        ".lapis/workspace.json": JSON.stringify(
          repositoryLayout(placement, operations)
        ),
      }),
      appDatabase: new MemoryAppDatabase("repository-story"),
      workspaceShell: { application: { name: "Lapis Notes" } },
      markdownRenderer: async () => {},
    });
  });
  const unbind = bindRepository(app, () => {
    const base: RepositoryServices = {
      reader: fixture.reader,
      ...(original
        ? {
            original: fixture.reader,
            sources: async () => ({ original: true }),
          }
        : {}),
      close: () => fixture.close(),
    };
    return options.services?.(app, base) ?? base;
  });
  let closing: Promise<void> | undefined;
  const dispose = () =>
    (closing ??= (async () => {
      await app.workspace.disposeWorkspaceHost();
      for (const plugin of [...app.plugins.corePlugins].reverse())
        await plugin.disable();
      unbind();
      await app.metadataCache.dispose();
      await app.appDatabase.close();
      disposeModels();
    })());
  try {
    app.plugins.registerCorePlugins([
      { plugin: RepositoryPlugin, required: true },
    ]);
    await app.vault.load();
    await app.configuration.load();
    if (options.data)
      await app.configuration.updatePluginData(
        "repository-history",
        options.data
      );
    await app.plugins.loadPlugins({
      communityPlugins: "disabled",
      optionalCorePlugins: "configured",
    });
    await app.workspace.loadLayout();
    return { app, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}
