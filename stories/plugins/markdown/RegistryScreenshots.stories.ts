import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  openRegistryFile,
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Markdown/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function editorStory(mode: "live-preview" | "source" | "preview"): Story {
  return {
    render: (() => ({
      Component: PanelDemo,
      props: { kind: "explorer", layout: "left-sidebar" },
    })) as Story["render"],
    play: async ({ canvasElement }) => {
      await openRegistryFile(canvasElement, "Notes/Welcome.md", { mode });
      await waitForRegistrySurface(
        canvasElement,
        mode === "preview"
          ? '[data-ui-component="markdown-mira-preview"]'
          : ".markdown-view__editor",
      );
    },
  };
}

function sidebarStory(kind: "outline" | "backlinks", selector: string): Story {
  return {
    render: (() => ({
      Component: PanelDemo,
      props: { kind, layout: "right-sidebar" },
    })) as Story["render"],
    play: async ({ canvasElement }) => {
      await registryPanelApp(canvasElement);
      await waitForRegistrySurface(canvasElement, selector);
    },
  };
}

export const LivePreview = editorStory("live-preview");
export const Source = editorStory("source");
export const Reading = editorStory("preview");
export const OutlineSidebar = sidebarStory(
  "outline",
  '[data-testid="outline-panel"]',
);
export const BacklinksSidebar = sidebarStory(
  "backlinks",
  '[data-testid="backlinks-panel"]',
);
