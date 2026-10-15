import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import SyncWorkspaceDemo from "./SyncWorkspaceDemo.svelte";
import { expectSyncReady } from "./story-assertions";
const meta = {
  title: "Plugins/Sync/Shell",
  component: SyncWorkspaceDemo,
  tags: ["!autodocs", "visual-pending", "test"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SyncWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function exerciseShell(canvasElement: HTMLElement) {
  const { app, plugin } = await expectSyncReady(canvasElement);
  expect(
    app.plugins.isPluginEnabled("markdown"),
    JSON.stringify(app.workspace.diagnostics.snapshot()),
  ).toBe(true);
  expect(app.workspace.getLeavesOfType("file-explorer")).toHaveLength(1);
  expect(
    within(canvasElement).getByRole("list", { name: "Files" }),
  ).toBeInTheDocument();
  expect(
    canvasElement.querySelector('[data-sync-pane="history"]'),
    "The owned History pane should render",
  ).not.toBeNull();
  const file = app.vault.getFileByPath("README.md")!;
  const leaf = app.workspace.getLeaf("tab");
  await leaf.openFile(file);
  app.workspace.activateLeaf(leaf, { focusRootHost: false });
  await waitFor(() =>
    expect(app.workspace.getActiveFile()?.path).toBe("README.md"),
  );
  await waitFor(() =>
    expect(
      canvasElement.querySelector(".cm-editor"),
      "Opening README should mount the Markdown editor",
    ).not.toBeNull(),
  );
  expect(app.workspace.getActiveFile()?.path).toBe("README.md");
  await plugin.openPane("history");
  expect(app.workspace.getLeavesOfType("sync-history")).toHaveLength(1);
}
export const Desktop: Story = {
  args: { options: { shell: true } },
  play: ({ canvasElement }) => exerciseShell(canvasElement),
};
export const Mobile: Story = {
  args: { options: { shell: true }, mobile: true },
  play: ({ canvasElement }) => exerciseShell(canvasElement),
};
