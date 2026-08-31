import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import { FileExplorerViewType } from "@lapis-notes/file-explorer";
import { LocalGraphViewType } from "@lapis-notes/graph";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Graph/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: WORKSPACE_SHELL_DOCS_PARAMETERS,
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function graphStory(
  kind: "graph" | "local-graph",
  layout: "middle-top-tabs" | "right-sidebar"
): Story {
  return {
    parameters:
      kind === "local-graph" ? { visualDelta: { delay: 250 } } : undefined,
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
          : '[data-testid="local-graph-panel"]'
      );
      await waitFor(
        () => {
          const panel = canvasElement.querySelector<HTMLElement>(
            kind === "graph"
              ? '[data-testid="graph-panel"]'
              : '[data-testid="local-graph-panel"]'
          );
          expect(panel?.querySelector('[data-ui-part="status"]')).toBeNull();
          expect(panel?.querySelector("canvas")).toBeVisible();
          if (kind === "graph") {
            expect(panel).toHaveTextContent(/\d+ nodes • \d+ links/);
            const stats = panel?.textContent?.match(
              /(\d+) nodes • (\d+) links/
            );
            expect(Number(stats?.[1] ?? 0)).toBeGreaterThanOrEqual(12);
            expect(Number(stats?.[2] ?? 0)).toBeGreaterThanOrEqual(14);
          }
        },
        { timeout: 20_000 }
      );
      if (kind === "local-graph") {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await waitFor(() => {
          const panel = canvasElement.querySelector<HTMLElement>(
            '[data-testid="local-graph-panel"]'
          );
          expect(panel?.querySelector('[data-ui-part="status"]')).toBeNull();
          expect(panel?.querySelector("canvas")).toBeVisible();
        });
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      }
    },
  };
}

const globalGraphStory = graphStory("graph", "middle-top-tabs");
export const GlobalGraph = globalGraphStory;
export const LocalGraph = graphStory("local-graph", "right-sidebar");

export const Overview: Story = {
  ...globalGraphStory,
  name: "Overview",
  play: async (context) => {
    await globalGraphStory.play?.(context);
    const app = await registryPanelApp(context.canvasElement);
    const explorer = app.workspace.ensureSideLeaf(FileExplorerViewType, "left");
    await explorer.setViewState({ type: FileExplorerViewType });
    await app.workspace.revealLeaf(explorer);
    const localGraph = app.workspace.ensureSideLeaf(
      LocalGraphViewType,
      "right"
    );
    await localGraph.setViewState({ type: LocalGraphViewType });
    await app.workspace.revealLeaf(localGraph);
    await waitForRegistrySurface(
      context.canvasElement,
      '[data-testid="lapis-editor-explorer"]'
    );
    await waitForRegistrySurface(
      context.canvasElement,
      '[data-testid="local-graph-panel"]'
    );
  },
};
