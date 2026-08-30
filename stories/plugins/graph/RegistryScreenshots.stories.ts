import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Graph/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function graphStory(kind: "graph" | "local-graph"): Story {
  return {
    render: (() => ({
      Component: PanelDemo,
      props: { kind, layout: "right-sidebar" },
    })) as Story["render"],
    play: async ({ canvasElement }) => {
      await registryPanelApp(canvasElement);
      await waitForRegistrySurface(
        canvasElement,
        kind === "graph"
          ? '[data-testid="graph-panel"]'
          : '[data-testid="local-graph-panel"]',
      );
    },
  };
}

export const GlobalGraph = graphStory("graph");
export const LocalGraph = graphStory("local-graph");
