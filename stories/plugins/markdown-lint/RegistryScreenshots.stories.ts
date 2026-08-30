import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import { showRegistryProblems } from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Markdown Lint/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditorDiagnosticsWithProblems: Story = {
  render: (() => ({
    Component: PanelDemo,
    props: { kind: "explorer", layout: "left-sidebar" },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await showRegistryProblems(canvasElement, "Notes/Editorial review.md");
  },
};
