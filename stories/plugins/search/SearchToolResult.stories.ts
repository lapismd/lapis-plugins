import { SearchToolResult } from "@lapis-notes/search";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import AiChatDemo from "../ai/AiChatDemo.svelte";
import { createNotesSearchSeedItems } from "../ai/AiChat.example-sources";

const meta = {
  title: "Plugins/Search/Tool results",
  component: SearchToolResult,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof SearchToolResult>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AccessibleFileNavigation: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      enableSearchResult: true,
      seedItems: createNotesSearchSeedItems(),
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Show details for notes_search",
      })
    );
    const hit = await canvas.findByRole("button", { name: /^Open auth.md/ });
    await expect(hit).toHaveAccessibleName("Open auth.md Projects/auth.md");
    await expect(hit).toHaveTextContent("auth.md");
    await expect(hit).toHaveTextContent("Projects/auth.md");
    await userEvent.click(hit);
    await expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
      "data-opened-paths",
      "Projects/auth.md"
    );
    await expect(canvas.getByTestId("ai-chat-panel")).toBeVisible();
  },
};
