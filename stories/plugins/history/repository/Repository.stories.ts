import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "./RepositoryDemo.svelte";
import { cleanupRepositoryStories } from "./runtime.svelte";

const meta = {
  title: "Plugins/History/Repository/Panels/History",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  beforeEach: () => cleanupRepositoryStories,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(canvasElement.querySelector(".repository-shell")).not.toBeNull(),
      {
        timeout: 30_000,
      }
    );
    const header = within(
      await canvas.findByRole("group", {
        name: args.operations ? "Op Log header" : "JJ Log header",
      })
    );
    await expect(header.queryByRole("combobox")).toBeNull();
    await expect(
      await canvas.findByRole("list", {
        name: args.operations ? "Operation graph" : "Revision graph",
      })
    ).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Refresh" })
    ).toBeVisible();
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
} satisfies Meta<typeof RepositoryDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MiddleTopTabs: Story = {};
export const StackedTabs: Story = { args: { placement: "stacked" } };
export const LeftSidebar: Story = { args: { placement: "left" } };
export const RightSidebar: Story = { args: { placement: "right" } };
export const BottomPanel: Story = { args: { placement: "bottom" } };
export const SidebarAsAGroup: Story = { args: { placement: "group" } };
export const Dark: Story = { globals: { colorMode: "dark" } };
export const Narrow: Story = { args: { narrow: true } };
export const OperationLog: Story = { args: { operations: true } };
export const OperationLogDark: Story = {
  args: { operations: true },
  globals: { colorMode: "dark" },
};
export const OperationLogNarrow: Story = {
  args: { operations: true, narrow: true },
};

export const MultipleOperationHeads: Story = {
  args: { scenario: "multiple" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const heads = within(
      await canvas.findByRole(
        "group",
        { name: "Operation heads" },
        { timeout: 30_000 }
      )
    );
    const head = heads.getAllByRole("button", {
      name: /^Inspect operation /,
    })[0];
    await waitFor(() => expect(head).not.toBeDisabled());
    await userEvent.click(head);
    const log = within(
      canvas.getByRole("region", {
        name: args.operations
          ? "Repository operation log"
          : "Repository history",
        exact: true,
      })
    );
    await expect(
      await log.findByRole("list", {
        name: args.operations ? "Operation graph" : "Revision graph",
      })
    ).toBeVisible();
  },
};
export const MultipleOperationLogHeads: Story = {
  ...MultipleOperationHeads,
  args: { scenario: "operation-multiple-heads", operations: true },
};
