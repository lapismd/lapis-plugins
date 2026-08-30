import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import BasesEditorShellDemo from "./shell/ShellDemo.svelte";

const meta = {
  title: "Plugins/Bases/Registry Screenshots",
  component: BasesEditorShellDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BasesEditorShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function story(scenario: "table" | "cards" | "grouped-list", selector: string): Story {
  return {
    args: { scenario },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(
        () => {
          expect(canvas.getByTestId("bases-editor-shell-status")).toHaveTextContent(
            "ready",
          );
          expect(canvasElement.querySelector(selector)).not.toBeNull();
        },
        { timeout: 20_000 },
      );
    },
  };
}

export const Table = story("table", '[data-ui-component="bases-table-view"]');
export const Cards = story("cards", '[data-ui-component="bases-card-view"]');
export const GroupedList = story(
  "grouped-list",
  '[data-ui-component="bases-list-view"]',
);
