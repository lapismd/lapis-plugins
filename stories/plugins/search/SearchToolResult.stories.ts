import { SearchToolResult } from "@lapis-notes/search";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { App, FileView } from "@lapis-notes/api";
import SearchToolResultDemo from "./SearchToolResultDemo.svelte";

const meta = {
  title: "Plugins/Search/Tool results",
  component: SearchToolResult,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof SearchToolResult>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AccessibleFileNavigation: Story = {
  render: () => ({
    Component: SearchToolResultDemo,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-app-shell-ready="true"]'),
      ).not.toBeNull(),
    );
    const hit = await canvas.findByRole("button", { name: /^Open auth.md/ });
    await expect(hit).toHaveAccessibleName("Open auth.md Projects/auth.md");
    await expect(hit).toHaveTextContent("auth.md");
    await expect(hit).toHaveTextContent("Projects/auth.md");
    await userEvent.click(hit);
    const fixture = canvas.getByTestId(
      "search-tool-result-demo",
    ) as HTMLElement & { __lapisApp?: App };
    await waitFor(() =>
      expect(
        (fixture.__lapisApp?.workspace.activeLeaf?.view as FileView)?.file
          ?.path,
      ).toBe("Projects/auth.md"),
    );
    await expect(
      canvas.getByRole("region", { name: "Search tool result" }),
    ).toBeVisible();
  },
};

export const EmptyResults: Story = {
  render: () => ({
    Component: SearchToolResultDemo,
    props: { empty: true },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const empty = await canvas.findByText("No matching notes.");
    const root = empty.closest(
      '[data-ui-component="empty"][data-ui-part="empty"]',
    );
    expect(root).not.toBeNull();
    expect(root?.querySelector("svg")).not.toBeNull();
  },
};
