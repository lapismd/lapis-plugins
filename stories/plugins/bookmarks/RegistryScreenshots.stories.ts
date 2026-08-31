import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";

const registrySource = pluginWorkspaceSource(
  "@lapis-notes/bookmarks",
  "BookmarksPlugin"
);

const meta = {
  title: "Plugins/Bookmarks/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "App-backed Bookmarks views showing the public plugin inside the Lapis workspace.",
      },
    },
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BookmarksSidebar: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "Bookmarks are grouped and displayed in the right sidebar."
  ),
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
  parameters: registryStoryParameters(
    registrySource,
    "The Bookmarks overview places the same public view in the left sidebar."
  ),
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
