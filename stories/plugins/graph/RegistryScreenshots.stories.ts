import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
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

function graphStory(
  kind: "graph" | "local-graph",
  layout: "middle-top-tabs" | "right-sidebar",
): Story {
  return {
    render: (() => ({
      Component: PanelDemo,
      props: {
        kind,
        layout,
        diagnostics: "none",
        graphData: "registry-rich",
      },
    })) as Story["render"],
    play: async ({ canvasElement }) => {
      await registryPanelApp(canvasElement);
      await waitForRegistrySurface(
        canvasElement,
        kind === "graph"
          ? '[data-testid="graph-panel"]'
          : '[data-testid="local-graph-panel"]',
      );
      await waitFor(
        () => {
          const panel = canvasElement.querySelector<HTMLElement>(
            kind === "graph"
              ? '[data-testid="graph-panel"]'
              : '[data-testid="local-graph-panel"]',
          );
          expect(panel?.querySelector('[data-ui-part="status"]')).toBeNull();
          expect(panel?.querySelector("canvas")).toBeVisible();
          if (kind === "graph") {
            expect(panel).toHaveTextContent(/\d+ nodes • \d+ links/);
            const stats = panel?.textContent?.match(
              /(\d+) nodes • (\d+) links/,
            );
            expect(Number(stats?.[1] ?? 0)).toBeGreaterThanOrEqual(12);
            expect(Number(stats?.[2] ?? 0)).toBeGreaterThanOrEqual(14);
          }
        },
        { timeout: 20_000 },
      );
    },
  };
}

export const GlobalGraph = graphStory("graph", "middle-top-tabs");
export const LocalGraph = graphStory("local-graph", "right-sidebar");
