import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { FileExplorerViewType } from "@lapis-notes/file-explorer";
import { HistoryPlugin } from "@lapis-notes/history";
import { expect, waitFor } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";
import { CompareCurrent } from "./Compare.stories";
import { compareCurrentSource } from "./Compare.example-sources";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";

const registrySource = pluginWorkspaceSource(
  "@lapis-notes/history",
  "HistoryPlugin"
);

const meta = {
  title: "Plugins/History/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "App-backed History timelines and comparisons showing the public plugin inside the Lapis workspace.",
      },
    },
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HistorySidebar: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "The History timeline lists seeded revisions for the active note in the right sidebar."
  ),
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "history",
      layout: "right-sidebar",
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitForRegistrySurface(
      canvasElement,
      '[data-testid="history-panel"]'
    );
  },
};

export const Compare: Story = {
  name: "Compare",
  parameters: registryStoryParameters(
    compareCurrentSource,
    "A one-way compare places the selected stored revision beside the current file."
  ),
  render: CompareCurrent.render as Story["render"],
  play: CompareCurrent.play as Story["play"],
};

export const Overview: Story = {
  parameters: registryStoryParameters(
    compareCurrentSource,
    "The overview combines Explorer, History, and a live-file comparison in one workspace."
  ),
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "history",
      layout: "right-sidebar",
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    const app = await registryPanelApp(canvasElement);
    const plugin = app.plugins.plugins.get("history");
    if (!(plugin instanceof HistoryPlugin)) {
      throw new Error("History plugin is not registered");
    }
    const model = await plugin.getHistoryViewModel();
    const revision = model.history?.revisions[0];
    if (!model.filePath || !revision) {
      throw new Error("History Overview requires a seeded revision");
    }
    await plugin.openHistoryCompareView({
      filePath: model.filePath,
      revisionId: revision.revisionId,
      compareMode: "current",
    });
    const explorer = app.workspace.ensureSideLeaf(FileExplorerViewType, "left");
    await explorer.setViewState({ type: FileExplorerViewType });
    await app.workspace.revealLeaf(explorer);
    await waitFor(() => {
      expect(
        canvasElement.querySelector('[data-testid="history-compare-panel"]')
      ).toBeVisible();
      expect(
        canvasElement.querySelector('[data-testid="history-panel"]')
      ).toBeVisible();
      expect(
        canvasElement.querySelector('[data-testid="lapis-editor-explorer"]')
      ).toBeVisible();
    });
  },
};
