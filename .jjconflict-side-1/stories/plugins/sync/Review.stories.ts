import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SyncWorkspaceDemo from "./SyncWorkspaceDemo.svelte";
import { expectSyncReady } from "./story-assertions";
import { REVISION_IDS, SYNC_STORY_FILES } from "./preview-runtime";

const meta = {
  title: "Plugins/Sync/Review",
  component: SyncWorkspaceDemo,
  tags: ["!autodocs", "visual-pending", "test", "sync-unfinished"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SyncWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CompareAndRestore: Story = {
  args: { options: { kind: "compare" } },
  play: async ({ canvasElement }) => {
    const { app, plugin, runtime } = await expectSyncReady(canvasElement);
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("sync-file-diff")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Restore this version" }),
    );
    await waitFor(() =>
      expect(runtime?.calls.some((a) => a.type === "restore-file")).toBe(true),
    );
    const file = app.vault.getFileByPath("README.md")!;
    expect(await app.vault.read(file)).toBe(
      "# Atlas\n\nA shared research vault.\n",
    );
    expect(await app.vault.read(file)).not.toBe(SYNC_STORY_FILES["README.md"]);
    expect(plugin.session.snapshot().status).toBe("idle-dirty");
    expect(plugin.session.snapshot().pendingFiles[0]?.path).toBe("README.md");
    expect(plugin.session.snapshot().revisions[0]?.reason).toBe("restore-file");
  },
};
export const Merge: Story = {
  args: { options: { kind: "merge", state: "conflicted" } },
  play: async ({ canvasElement }) => {
    const { app, plugin, runtime } = await expectSyncReady(canvasElement);
    const canvas = within(canvasElement);
    const publish = canvas.getByRole("button", {
      name: "Publish merge revision",
    });
    expect(publish).toBeDisabled();
    expect(
      canvasElement.querySelector('[data-ui-component="merge-editor"]'),
    ).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Use remote" }));
    await waitFor(() => expect(publish).toBeEnabled());
    await userEvent.click(publish);
    await waitFor(() =>
      expect(runtime?.calls.some((a) => a.type === "publish-merge")).toBe(true),
    );
    expect(plugin.session.snapshot().revisions[0]?.parents).toEqual([
      REVISION_IDS.laptop,
      REVISION_IDS.phone,
    ]);
    expect(plugin.session.snapshot().mergeDraft).toBeNull();
    expect(
      await app.vault.read(app.vault.getFileByPath("README.md")!),
    ).toContain("phone project overview");
    expect(canvas.getByText(/No merge draft is active/)).toBeVisible();
  },
};
export const StatusAndUnload: Story = {
  args: { options: { state: "dirty" } },
  play: async ({ canvasElement }) => {
    const { app, plugin, runtime } = await expectSyncReady(canvasElement);
    const status = canvasElement.querySelector<HTMLElement>(
      '[data-status-bar-item-id="sync:status"]',
    )!;
    await userEvent.click(status);
    const body = within(canvasElement.ownerDocument.body);
    const popover = await body.findByRole("dialog", { name: "Sync status" });
    await waitFor(() => expect(popover).toHaveFocus());
    expect(
      within(popover).getByRole("heading", { name: "Lapis Server" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(body.queryByRole("dialog", { name: "Sync status" })).toBeNull(),
    );
    expect(status).toHaveFocus();
    await app.plugins.disablePlugin("sync");
    expect(runtime?.disposed).toBe(true);
    expect(runtime?.listeners.size).toBe(0);
    expect(app.workspace.getLeavesOfType("sync")).toHaveLength(0);
    expect(plugin.settingsRegistration).toBeNull();
    expect(
      canvasElement.querySelector('[data-status-bar-item-id="sync:status"]'),
    ).toBeNull();
    expect(
      canvasElement.ownerDocument.querySelector(
        '[data-testid="sync-status-overlay-root"]',
      ),
    ).toBeNull();
  },
};
