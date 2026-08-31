import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Bookmarks/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: WORKSPACE_SHELL_DOCS_PARAMETERS,
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BookmarksSidebar: Story = {
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "bookmarks",
      layout: "right-sidebar",
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitForRegistrySurface(
      canvasElement,
      '[data-testid="bookmarks-panel"]'
    );
  },
};

export const Overview: Story = {
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "bookmarks",
      layout: "left-sidebar",
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitForRegistrySurface(
      canvasElement,
      '[data-testid="bookmarks-panel"]'
    );
  },
};
