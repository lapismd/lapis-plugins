import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";
const input = JSON.stringify({
  metadata: "retain",
  nodes: [
    {
      id: "a",
      type: "text",
      text: "Alpha",
      x: 0,
      y: 0,
      width: 220,
      height: 140,
    },
    {
      id: "b",
      type: "text",
      text: "Beta",
      x: 420,
      y: 0,
      width: 220,
      height: 140,
    },
  ],
  edges: [],
});
const meta = {
  title: "Plugins/Canvas/Touch",
  component: ViewingPanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Native touch gestures and explicit multi-card selection share the existing board mutation and App input-protection boundaries.",
      },
      source: {
        language: "svelte",
        type: "code",
        code: '<script lang="ts">\n  import type { App } from "@lapis-notes/api";\n  import { WorkspaceShell } from "@lapis-notes/workspace";\n  let { app }: { app: App } = $props();\n</script>\n<WorkspaceShell {app} />',
      },
    },
  },
} satisfies Meta<typeof ViewingPanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
const render = () => ({
  Component: ViewingPanelDemo,
  props: {
    layout: "middle-top-tabs",
    canvasPath: "Touch.canvas",
    files: { "Touch.canvas": input },
  },
});
export const NativeTouchFixture: Story = {
  name: "Native touch fixture",
  render,
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('.svelte-flow__node[data-id="a"]'),
        ).toBeVisible(),
      { timeout: 30_000 },
    );
  },
};
export const ExplicitSelection: Story = {
  name: "Explicit selection supports grouping and App protection",
  render,
  play: async ({ canvasElement }) => {
    const app = await waitFor(
      () => {
        const host = canvasElement.querySelector<HTMLElement>(
          '[data-panel-kind="canvas"][data-status="ready"]',
        ) as (HTMLElement & { __lapisApp?: App }) | null;
        expect(host?.__lapisApp).toBeDefined();
        return host!.__lapisApp!;
      },
      { timeout: 30_000 },
    );
    const root = canvasElement.querySelector<HTMLElement>(
      ".canvas-view-root:not([data-canvas-embed])",
    )!;
    const board = within(root);
    await userEvent.click(board.getByText("Select cards", { exact: true }));
    await userEvent.click(
      board.getByRole("checkbox", { name: "Alpha (a)", exact: true }),
    );
    await userEvent.click(
      board.getByRole("checkbox", { name: "Beta (b)", exact: true }),
    );
    expect(root.querySelectorAll(".svelte-flow__node.selected")).toHaveLength(
      2,
    );
    await app.fileEditingSessions.flush("Touch.canvas");
    expect(await app.vault.read(app.vault.getFileByPath("Touch.canvas")!)).toBe(
      input,
    );
    let release!: () => void, started!: () => void;
    const began = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const guard = app.fileEditingSessions.guard("Touch.canvas", async () => {
      started();
      await gate;
    });
    try {
      await began;
      expect(
        board.getByRole("checkbox", { name: "Alpha (a)", exact: true }),
      ).toBeDisabled();
    } finally {
      release();
      await guard;
    }
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      board.getByRole("button", { name: "Create group", exact: true }),
    );
    await waitFor(() =>
      expect(root.querySelectorAll(".svelte-flow__node")).toHaveLength(3),
    );
    await userEvent.click(
      board.getByRole("button", { name: "Undo", exact: true }),
    );
    await waitFor(() =>
      expect(root.querySelectorAll(".svelte-flow__node")).toHaveLength(2),
    );
  },
};
