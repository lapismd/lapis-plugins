import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NativeRemotesDemo from "./NativeRemotesDemo.svelte";
import {
  cleanupNativeRemotesStories,
  nativeRemotesStoryFor,
} from "./native-runtime.svelte";
const meta = {
  title: "Plugins/History/Repository/Native backup synchronization",
  component: NativeRemotesDemo,
  args: { syncScenario: "paused" },
  tags: ["visual-pending", "!autodocs"],
  parameters: {
    layout: "fullscreen",
    catalogLayout: "full-viewport",
    a11y: { test: "error" },
  },
  beforeEach: () => cleanupNativeRemotesStories,
} satisfies Meta<typeof NativeRemotesDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function settings(element: HTMLElement) {
  const canvas = within(element);
  await canvas.findByRole(
    "group",
    { name: "JJ Log header" },
    { timeout: 30000 }
  );
  const runtime = nativeRemotesStoryFor(element);
  runtime.plugin.remotes!.manage();
  await canvas.findByRole("heading", { name: "Remotes and credentials" });
  await canvas.findByText("Automatic synchronization", { exact: true });
  return { canvas, runtime, sync: runtime.synchronization! };
}
export const ManualByDefault: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, runtime, sync } = await settings(canvasElement);
    const selection = canvas.getByRole("switch", {
      name: "Synchronize the connected backup automatically",
    });
    await expect(selection).not.toBeChecked();
    await expect(sync.commands).toEqual([]);
    await userEvent.click(selection);
    await waitFor(() => expect(selection).toBeChecked());
    await expect(runtime.commands).toEqual([{ kind: "set_automatic_sync" }]);
    await expect(sync.commands).toEqual([]);
    await userEvent.click(canvas.getByRole("button", { name: "Sync now" }));
    await waitFor(() =>
      expect(sync.commands).toEqual([{ kind: "run", expected_revision: 1 }])
    );
  },
};
const busy: Story["play"] = async ({ canvasElement }) => {
  const { canvas, sync } = await settings(canvasElement);
  await expect(canvas.getByRole("button", { name: "Sync now" })).toBeDisabled();
  await expect(sync.commands).toEqual([]);
};
export const Fetching: Story = {
  args: { syncScenario: "fetching" },
  play: busy,
};
export const Applying: Story = {
  args: { syncScenario: "applying" },
  play: busy,
};
export const Publishing: Story = {
  args: { syncScenario: "publishing" },
  play: busy,
};
export const Conflicts: Story = {
  args: { syncScenario: "conflicts" },
  play: async ({ canvasElement }) => {
    const { canvas, sync } = await settings(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Review 1 conflicts" })
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog", {
        name: "Resolve backup synchronization conflicts",
      })
    );
    await userEvent.click(
      await dialog.findByRole("button", { name: "Use local version (binary)" })
    );
    await waitFor(() =>
      expect(sync.commands.map((c) => c.kind)).toEqual(["inspect", "resolve"])
    );
    await expect(sync.commands[1]).toMatchObject({
      kind: "resolve",
      expected_revision: 0,
      candidate: "d".repeat(40),
      path: "Research/Diagram.png",
      resolution: { kind: "term", id: 0 },
    });
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).queryByRole("dialog", {
          name: "Resolve backup synchronization conflicts",
        })
      ).toBeNull()
    );
  },
};
export const ExactApplyRecovery: Story = {
  args: { syncScenario: "recovery" },
  play: async ({ canvasElement }) => {
    const { canvas, sync } = await settings(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Sync now" })
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Retry applying merged files" })
    );
    await waitFor(() =>
      expect(sync.commands).toEqual([
        {
          kind: "resume_apply",
          expected_revision: 0,
          request_id: "retained-apply-request",
        },
      ])
    );
  },
};
export const LostResponse: Story = {
  args: { syncScenario: "lost-response" },
  play: async ({ canvasElement }) => {
    const { canvas, sync } = await settings(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Sync now" }));
    await expect(
      await canvas.findByRole("button", { name: "Retry applying merged files" })
    ).toBeEnabled();
    await expect(sync.commands).toEqual([
      { kind: "run", expected_revision: 0 },
    ]);
  },
};
export const NarrowDarkRecovery: Story = {
  ...ExactApplyRecovery,
  args: { syncScenario: "recovery", narrow: true },
  globals: { colorMode: "dark" },
};
export const SelectionFailure: Story = {
  args: { syncScenario: "selection-failure" },
  play: async ({ canvasElement }) => {
    const { canvas, runtime, sync } = await settings(canvasElement);
    const selection = canvas.getByRole("switch", {
      name: "Synchronize the connected backup automatically",
    });
    await userEvent.click(selection);
    await expect(
      await within(canvasElement.ownerDocument.body).findByText(
        "Native backup selection unavailable",
        { exact: true }
      )
    ).toBeVisible();
    await expect(selection).not.toBeChecked();
    await expect(runtime.commands).toEqual([{ kind: "set_automatic_sync" }]);
    await expect(sync.commands).toEqual([]);
  },
};
