import {
  App,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { MarkdownPlugin, MarkdownView } from "@lapis-notes/markdown";
import { SlidesPlugin } from "@lapis-notes/slides";
import releaseWalkthrough from "../../../packages/slides/test/fixtures/release-walkthrough.md?raw";

export const SLIDES_DEMO_PATH = "Release Walkthrough.md";

function createSlidesLayout() {
  return {
    main: {
      id: "main",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        {
          id: "main-tabs",
          type: "tabs",
          stacked: false,
          currentTab: 0,
          children: [
            {
              id: "release-walkthrough",
              type: "leaf",
              state: {
                type: "markdown",
                state: { file: SLIDES_DEMO_PATH, mode: "source" },
                icon: "file-text",
                title: "Release Walkthrough",
              },
            },
          ],
        },
      ],
    },
    left: {
      id: "left",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [],
      width: "0px",
    },
    right: {
      id: "right",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [],
      width: "0px",
    },
    bottom: {
      id: "bottom-panel",
      type: "tabs",
      stacked: false,
      currentTab: 0,
      children: [],
      height: "0px",
    },
    floating: [],
    active: "release-walkthrough",
  };
}

export async function bootSlidesDemo(): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const adapter = new MemoryVaultAdapter(
    {
      ".obsidian/app.json": JSON.stringify(
        {
          "appearence.interface.showTabTitleBar": true,
          "editor.defaultEditingMode": "source",
        },
        null,
        2,
      ),
      ".obsidian/workspace.json": JSON.stringify(createSlidesLayout(), null, 2),
      [SLIDES_DEMO_PATH]: releaseWalkthrough,
    },
    {
      name: "Lapis Slides Registry",
      vaultId: "lapis-slides-registry",
      clock: 1_700_000_000_000,
    },
  );
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-slides-registry"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });

  app.plugins.registerCorePlugins([
    {
      plugin: MarkdownPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
    {
      plugin: SlidesPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
  ]);

  await app.vault.load();
  await app.configuration.load();
  await app.plugins.loadPlugins({
    communityPlugins: "disabled",
    optionalCorePlugins: "configured",
  });
  await app.workspace.loadLayout();

  const file = app.vault.getFileByPath(SLIDES_DEMO_PATH);
  if (!file) throw new Error(`Slides fixture is missing ${SLIDES_DEMO_PATH}`);
  const sourceLeaf =
    app.workspace.getLeavesOfType("markdown")[0] ?? app.workspace.getLeaf(false);
  if (sourceLeaf.view.getViewType() !== "markdown") {
    await sourceLeaf.openFile(file);
  }
  app.workspace.setActiveLeaf(sourceLeaf, { focus: false });
  if (!(sourceLeaf.view instanceof MarkdownView)) {
    throw new Error("Slides fixture did not open through public Markdown");
  }

  return {
    app,
    dispose: async () => {
      for (const plugin of [...app.plugins.corePlugins].reverse()) {
        await plugin.disable().catch(() => undefined);
      }
      await app.workspace.disposeWorkspaceHost();
    },
  };
}
