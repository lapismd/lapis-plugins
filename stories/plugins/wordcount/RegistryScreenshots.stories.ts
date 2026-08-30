import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import { openRegistryFile } from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Word Count/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditorWithFocusedStatusBar: Story = {
  render: (() => ({
    Component: PanelDemo,
    props: { kind: "explorer", layout: "left-sidebar" },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await openRegistryFile(canvasElement, "Notes/Welcome.md", {
      mode: "live-preview",
    });
    await waitFor(
      () => {
        const item = canvasElement.querySelector<HTMLElement>(
          '[data-status-bar-item-id="wordcount:status"]',
        );
        expect(item).not.toBeNull();
        expect(item).toHaveTextContent(/words/);
        expect(item).toHaveTextContent(/characters/);
      },
      { timeout: 12_000 },
    );
  },
};
