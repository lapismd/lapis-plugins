import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";
import SyncWorkspaceDemo from "./SyncWorkspaceDemo.svelte";
import { expectSyncReady } from "./story-assertions";

const source = pluginWorkspaceSource(
  "@lapis-notes/lapis-plugin-sync",
  "SyncPlugin",
  "sync:open-history",
);
const meta = {
  title: "Plugins/Sync/Registry Screenshots",
  component: SyncWorkspaceDemo,
  tags: ["registry-media", "visual-pending", "test", "sync-unfinished"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "Private Lapis Sync UI qualification with an explicitly injected preview runtime. These scenes use the real plugin and workspace shell; they do not connect to a server. End-to-end encryption is required by the production session.",
      },
    },
  },
} satisfies Meta<typeof SyncWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

async function ready(canvasElement: HTMLElement, kind: string) {
  const owner = await expectSyncReady(canvasElement);
  await waitFor(() => {
    expect(
      canvasElement.querySelector('[data-testid="lapis-editor-explorer"]'),
    ).toBeVisible();
    expect(
      canvasElement.querySelector(`[data-sync-pane="${kind}"]`),
    ).toBeVisible();
  });
  return owner;
}

async function showDiff(canvasElement: HTMLElement) {
  await ready(canvasElement, "history");
  const canvas = within(canvasElement);
  await userEvent.click(
    canvas.getByRole("button", { name: /Merge research notes/ }),
  );
  const files = await canvas.findByRole("region", {
    name: "Changed files",
    exact: true,
  });
  await userEvent.click(
    within(files).getByRole("button", { name: /README\.md/ }),
  );
  await waitFor(() =>
    expect(canvas.getByTestId("sync-file-diff")).toBeVisible(),
  );
  expect(canvas.getByTestId("sync-diff-header")).toContainElement(
    canvas.getByTestId("sync-compare-toolbar"),
  );
}

export const Banner: Story = {
  args: { options: { shell: true } },
  parameters: registryStoryParameters(
    source,
    "Explorer, branched revision history with an open diff, and pending changes in the right dock.",
  ),
  play: async ({ canvasElement }) => {
    await showDiff(canvasElement);
    expect(
      canvasElement.querySelector('[data-sync-pane="sync"]'),
    ).toBeVisible();
  },
};
export const Changes: Story = {
  args: { options: { shell: true } },
  parameters: registryStoryParameters(
    source,
    "Review pending changes, enrolled device tips, and checkpoint actions in the Sync dock.",
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, "sync");
    expect(
      within(canvasElement).getByRole("region", { name: "Pending changes" }),
    ).toBeVisible();
  },
};
export const History: Story = {
  args: { options: { shell: true } },
  parameters: registryStoryParameters(
    source,
    "A revision graph follows edits and merges across the laptop and phone.",
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, "history");
    expect(
      within(canvasElement).getByRole("button", {
        name: /Merge research notes/,
      }),
    ).toBeVisible();
  },
};
export const FileHistory: Story = {
  args: { options: { shell: true, kind: "file-history" } },
  parameters: registryStoryParameters(
    source,
    "README.md file history exposes changed content with the three-section comparison header.",
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, "file-history");
    const history = within(canvasElement);
    await userEvent.click(
      history.getByRole("button", { name: /Merge research notes/ }),
    );
    await waitFor(() =>
      expect(history.getByTestId("sync-file-diff")).toBeVisible(),
    );
  },
};
export const Merge: Story = {
  args: { options: { shell: true, kind: "merge", state: "conflicted" } },
  parameters: registryStoryParameters(
    source,
    "Resolve the laptop and phone versions before publishing a revision with both parents.",
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, "merge");
    expect(
      canvasElement.querySelector('[data-ui-component="merge-editor"]'),
    ).toBeVisible();
    expect(
      within(canvasElement).getByRole("button", {
        name: "Publish merge revision",
      }),
    ).toBeDisabled();
  },
};
export const Status: Story = {
  args: { options: { shell: true, state: "synced" } },
  parameters: registryStoryParameters(
    source,
    "The synced status icon is green, and its popover uses the application theme with connection health and copyable revision details.",
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, "sync");
    const status = canvasElement.querySelector<HTMLElement>(
      '[data-status-bar-item-id="sync:status"]',
    )!;
    const icon = status.querySelector<HTMLElement>(
      '[data-workspace-icon="circle-check"]',
    )!;
    expect(getComputedStyle(icon).color).toBe("rgb(22, 163, 74)");
    await userEvent.click(status);
    const body = within(canvasElement.ownerDocument.body);
    const popover = await body.findByRole("dialog", { name: "Sync status" });
    await waitFor(() => expect(popover).toHaveFocus());
    expect(within(popover).getByText("End-to-end encrypted")).toBeVisible();
    expect(within(popover).getByText("Connected")).toBeVisible();
    expect(
      within(popover).getByRole("button", { name: "Close status" }),
    ).toBeVisible();
  },
};
