import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { FileExplorerViewType } from "@lapis-notes/file-explorer";
import { HistoryPlugin } from "@lapis-notes/history";
import { expect, waitFor } from "storybook/test";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";
import { CompareCurrent } from "./Compare.stories";

const meta = {
  title: "Plugins/History/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HistorySidebar: Story = {
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
  render: CompareCurrent.render as Story["render"],
  play: CompareCurrent.play as Story["play"],
};

export const Overview: Story = {
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
