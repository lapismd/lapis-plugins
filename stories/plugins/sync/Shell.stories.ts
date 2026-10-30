import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { FileView, type WorkspaceLeaf } from "@lapis-notes/api";
import SyncWorkspaceDemo from "./SyncWorkspaceDemo.svelte";
import { expectSyncReady } from "./story-assertions";
const meta = {
  title: "Plugins/Sync/Shell",
  component: SyncWorkspaceDemo,
  tags: ["!autodocs", "visual-pending", "test", "sync-unfinished"],
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
  await plugin.settingsSource?.action({ type: "test-connection" });
}
export const Desktop: Story = {
  args: { options: { shell: true } },
  play: ({ canvasElement }) => exerciseShell(canvasElement),
};
export const Mobile: Story = {
  args: { options: { shell: true }, mobile: true },
  play: ({ canvasElement }) => exerciseShell(canvasElement),
};

export const PendingFileNavigation: Story = {
  args: { options: { shell: true } },
  play: async ({ canvasElement }) => {
    const { app, plugin } = await expectSyncReady(canvasElement);
    const fileLeaves = (path: string) => {
      const leaves: WorkspaceLeaf[] = [];
      app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof FileView && leaf.view.file?.path === path)
          leaves.push(leaf);
      });
      return leaves;
    };
    const file = app.vault.getFileByPath("README.md")!;
    const existing = app.workspace.getLeaf("tab");
    await existing.openFile(file);
    await plugin.openPane("sync");
    const pending = await within(canvasElement).findByRole("region", {
      name: "Pending changes",
    });
    for (let attempt = 0; attempt < 2; attempt++) {
      await userEvent.click(
        within(pending).getByRole("button", { name: "README.md", exact: true }),
      );
      await waitFor(() => expect(app.workspace.activeLeaf).toBe(existing));
      expect(fileLeaves("README.md")).toHaveLength(1);
      expect(
        within(canvasElement)
          .getByRole("toolbar", { name: "Workspace tabs" })
          .querySelector('button[aria-pressed="true"]'),
      ).toHaveTextContent("README.md");
    }
    await userEvent.click(
      within(pending).getByRole("button", {
        name: "notes/research.md",
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(app.workspace.getActiveFile()?.path).toBe("notes/research.md"),
    );
    const opened = fileLeaves("notes/research.md");
    expect(opened).toHaveLength(1);
    await userEvent.click(
      within(pending).getByRole("button", {
        name: "notes/research.md",
        exact: true,
      }),
    );
    await waitFor(() => expect(app.workspace.activeLeaf).toBe(opened[0]));
    expect(fileLeaves("notes/research.md")).toHaveLength(1);
  },
};
