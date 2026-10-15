import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SyncWorkspaceDemo from "./SyncWorkspaceDemo.svelte";
import { expectSyncReady } from "./story-assertions";
import type { SyncStoryState } from "./preview-runtime";

const meta = {
  title: "Plugins/Sync/States",
  component: SyncWorkspaceDemo,
  tags: ["!autodocs", "visual-pending", "test"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SyncWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
function state(state: SyncStoryState, label: string, disabled = false): Story {
  return {
    args: { options: { state } },
    play: async ({ canvasElement }) => {
      const { plugin } = await expectSyncReady(canvasElement);
      const canvas = within(
        canvasElement.querySelector<HTMLElement>('[data-sync-pane="sync"]')!,
      );
      expect(canvas.getByTestId("sync-status")).toHaveTextContent(label);
      if (state === "synced") {
        const icon = canvasElement.querySelector<HTMLElement>(
          '[data-status-bar-item-id="sync:status"] [data-workspace-icon="circle-check"]',
        );
        expect(icon).toBeVisible();
        expect(getComputedStyle(icon!).color).toBe("rgb(22, 163, 74)");
      }
      if (disabled)
        expect(canvas.getByRole("button", { name: "Sync Now" })).toBeDisabled();
      if (state === "locked") {
        expect(canvas.queryByText("README.md")).toBeNull();
        expect(plugin.session.snapshot().changeSets).toEqual([]);
      }
    },
  };
}
export const Disconnected = state("setup", "Disabled", true);
export const Dirty = state("dirty", "Pending");
export const Synced = state("synced", "Synced");
export const Busy = state("syncing", "Uploading", true);
export const Offline = state("offline", "Offline");
export const Locked = state("locked", "Locked", true);
export const Conflicted = state("conflicted", "Merge required");
export const ErrorRecovery: Story = {
  args: { options: { state: "error" } },
  play: async ({ canvasElement }) => {
    const { app, plugin, runtime } = await expectSyncReady(canvasElement);
    const canvas = within(canvasElement);
    expect(canvas.getByRole("alert")).toHaveTextContent(
      "stale file generation",
    );
    expect(app.workspace.diagnostics.snapshot().entries.length).toBeGreaterThan(
      0,
    );
    await userEvent.click(canvas.getByRole("button", { name: "Sync Now" }));
    await waitFor(() =>
      expect(runtime?.calls.some((a) => a.type === "sync")).toBe(true),
    );
    expect(plugin.session.snapshot().lastError).toBeNull();
    expect(app.workspace.diagnostics.snapshot().entries).toHaveLength(0);
    expect(canvas.queryByRole("alert")).toBeNull();
  },
};
