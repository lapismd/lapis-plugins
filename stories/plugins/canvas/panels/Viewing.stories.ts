import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import { CanvasEmbed } from "@lapis-notes/canvas";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";
import ViewingPanelDemo from "./ViewingPanelDemo.svelte";

const PLACEMENT_HOST: Record<PanelDemoLayout, string> = {
  "middle-top-tabs": "workspace-tabs",
  "stacked-tabs": "workspace-stacked-tabs",
  "left-sidebar": "workspace-sidebar",
  "right-sidebar": "workspace-sidebar",
  "bottom-panel": "workspace-bottom-panel-group",
  "sidebar-group": "workspace-sidebar-group",
};

const PLACEMENT_SURFACE: Record<PanelDemoLayout, string> = {
  "middle-top-tabs": "body",
  "stacked-tabs": "body",
  "left-sidebar": "left-sidebar",
  "right-sidebar": "right-sidebar",
  "bottom-panel": "bottom-panel",
  "sidebar-group": "right-sidebar",
};

const meta = {
  title: "Plugins/Canvas/Panels",
  component: CanvasEmbed,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      context: {
        exclude: [".canvas-node-label", ".canvas-node-shell"],
      },
    },
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "The legacy feature canvas, with a colored text note, two file notes, a link, a group, and three labeled connectors, in the shared workspace shell, in every governed panel placement. Middle (Top Tabs) also embeds that canvas in a note.",
      },
    },
  },
} satisfies Meta<typeof ViewingPanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const canvasViewingSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { CanvasPlugin } from "@lapis-notes/canvas";

  let { app }: { app: App } = $props();
</script>

<WorkspaceShell {app} />`;

function viewingParameters(layout: PanelDemoLayout, description: string) {
  const { visualDelta: _visualDelta, ...parameters } = placementParameters(
    "canvas",
    layout,
    canvasViewingSource,
    description,
  );
  return parameters;
}

function placementStory(layout: PanelDemoLayout, description: string): Story {
  return {
    name: PANEL_PLACEMENTS[layout].name,
    parameters: viewingParameters(layout, description),
    render: () => ({
      Component: ViewingPanelDemo,
      props: { layout },
    }),
    play: async ({ canvasElement }) => {
      await waitFor(
        () =>
          expect(
            canvasElement.querySelector('[data-status="ready"]'),
          ).not.toBeNull(),
        { timeout: 30_000 },
      );
      const fileView = await waitFor(
        () => {
          const view = canvasElement.querySelector<HTMLElement>(
            ".canvas-view-root:not([data-canvas-embed])",
          );
          expect(view).not.toBeNull();
          return view!;
        },
        { timeout: 30_000 },
      );
      expect(fileView.querySelector(".svelte-flow")).not.toBeNull();
      const host = fileView.closest(
        `[data-ui-component="${PLACEMENT_HOST[layout]}"]`,
      );
      expect(host).not.toBeNull();
      expect(fileView.closest("[data-workspace-surface]")).toHaveAttribute(
        "data-workspace-surface",
        PLACEMENT_SURFACE[layout],
      );
      expectSidebar(canvasElement, fileView, "left", layout === "left-sidebar");
      expectSidebar(
        canvasElement,
        fileView,
        "right",
        layout === "right-sidebar" || layout === "sidebar-group",
      );
      if (layout === "middle-top-tabs") {
        const embed = await waitFor(
          () => {
            const node = canvasElement.querySelector("[data-canvas-embed]");
            expect(node).not.toBeNull();
            return node!;
          },
          { timeout: 30_000 },
        );
        expect(embed.querySelector(".svelte-flow")).not.toBeNull();
        const plain = [...canvasElement.querySelectorAll("p")].find(
          (node) =>
            node.textContent?.includes(
              "A plain paragraph stays a Markdown preview.",
            ) && !node.closest(".canvas-view-root"),
        );
        expect(plain).toBeTruthy();
      }
    },
  };
}

function expectSidebar(
  canvasElement: HTMLElement,
  viewer: HTMLElement,
  side: "left" | "right",
  containsViewer: boolean,
) {
  const dock = canvasElement.querySelector(
    `[data-workspace-sidebar-side="${side}"]`,
  );
  expect(Boolean(dock?.contains(viewer))).toBe(containsViewer);
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  "The feature canvas in the middle pane, with the same board embedded in a note.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  "The sample canvas in stacked tabs.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  "The sample canvas in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  "The sample canvas in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  "The sample canvas in the bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  "The sample canvas inside a grouped right-sidebar item.",
);
