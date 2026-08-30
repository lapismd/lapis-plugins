import type { Meta, StoryObj } from "@storybook/svelte-vite";
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
    props: { kind: "history", layout: "right-sidebar" },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitForRegistrySurface(
      canvasElement,
      '[data-testid="history-panel"]',
    );
  },
};

export const Compare: Story = {
  name: "Compare",
  render: CompareCurrent.render as Story["render"],
  play: CompareCurrent.play as Story["play"],
};
