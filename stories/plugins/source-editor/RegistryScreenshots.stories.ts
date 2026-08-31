import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  openRegistryFile,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Source Editor/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: WORKSPACE_SHELL_DOCS_PARAMETERS,
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JsonEditor: Story = {
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "explorer",
      layout: "left-sidebar",
      hideSidebars: true,
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await openRegistryFile(canvasElement, "Projects/settings.json");
    await waitForRegistrySurface(canvasElement, ".source-text-file-view");
    const leftSidebar = canvasElement.querySelector<HTMLElement>(
      '[data-workspace-surface="left-sidebar"]'
    );
    if ((leftSidebar?.getBoundingClientRect().width ?? 0) >= 2) {
      throw new Error("Focused Source Editor story left the sidebar visible");
    }
  },
};

export const Overview: Story = {
  name: "Overview",
  render: JsonEditor.render,
  play: JsonEditor.play,
};
