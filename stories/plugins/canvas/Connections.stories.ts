import { expandCanvasTools } from "./canvas-story-helpers";
import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";
const input = { metadata: "retain", nodes: [
  { id: "a", type: "text", text: "Source", x: 0, y: 0, width: 220, height: 140 },
  { id: "b", type: "text", text: "Target", x: 420, y: 0, width: 220, height: 140 },
  { id: "c", type: "text", text: "Alternate", x: 420, y: 260, width: 220, height: 140 },
], edges: [{ id: "ab", fromNode: "a", fromSide: "right", toNode: "b", toSide: "left", label: "Retained", extension: { keep: true } }] };
const meta = {
  title: "Plugins/Canvas/Connections", component: ViewingPanelDemo, tags: ["visual-pending"],
  parameters: { layout: "fullscreen", docs: {
    description: { component: "Connector endpoints can be reattached and followed through the owning board." },
    source: { language: "svelte", type: "code", code: '<script lang="ts">\n  import type { App } from "@lapis-notes/api";\n  import { WorkspaceShell } from "@lapis-notes/workspace";\n  let { app }: { app: App } = $props();\n</script>\n<WorkspaceShell {app} />' },
  } },
} satisfies Meta<typeof ViewingPanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PointerConnections: Story = {
  name: "Connector drag gesture fixture",
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", canvasPath: "Connections.canvas", files: { "Connections.canvas": JSON.stringify(input) } } }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.svelte-flow__node[data-id="a"]')).toBeVisible(), { timeout: 30_000 });
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__edge")).toHaveLength(1));
  },
};
export const EndpointEditing: Story = {
  name: "Connector endpoints reconnect and follow cards",
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", canvasPath: "Connections.canvas", files: { "Connections.canvas": JSON.stringify(input) } } }),
  play: async ({ canvasElement }) => {
    const app = await waitFor(() => { const host = canvasElement.querySelector<HTMLElement>('[data-panel-kind="canvas"][data-status="ready"]') as (HTMLElement & { __lapisApp?: App }) | null; expect(host?.__lapisApp).toBeDefined(); return host!.__lapisApp!; }, { timeout: 30_000 });
    const root = canvasElement.querySelector<HTMLElement>(".canvas-view-root:not([data-canvas-embed])")!;
    await expandCanvasTools(root);
    const board = within(root);
    const select = async () => {
      const edge = await waitFor(() => { const value = root.querySelector<SVGElement>('.svelte-flow__edge[data-id="ab"]'); expect(value).not.toBeNull(); return value!; });
      edge.focus(); await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(root.querySelector('.svelte-flow__edge[data-id="ab"]')).toHaveClass("selected"));
    };
    await select();
    expect(root.querySelectorAll(".canvas-connector-reconnect")).toHaveLength(2);
    await userEvent.click(board.getByText("Reconnect", { exact: true }));
    board.getByLabelText("Source card").focus();
    await userEvent.keyboard("{Escape}");
    expect(root.querySelector<HTMLDetailsElement>(".canvas-connection-menu")!.open).toBe(false);
    expect(board.getByText("Reconnect", { exact: true })).toHaveFocus();
    await userEvent.click(board.getByText("Reconnect", { exact: true }));
    let release!: () => void, began!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { began = resolve; });
    const guarded = app.fileEditingSessions.guard("Connections.canvas", async () => { began(); await gate; });
    try {
      await started;
      expect(board.getByLabelText("Target card")).toBeDisabled();
      expect(board.getByRole("button", { name: "Apply endpoints", hidden: true })).toBeDisabled();
    } finally { release(); await guarded; }
    await userEvent.selectOptions(board.getByLabelText("Target card"), "c");
    await userEvent.selectOptions(board.getByLabelText("Target side"), "top");
    await userEvent.click(board.getByRole("button", { name: "Apply endpoints", exact: true }));
    const read = async () => { await app.fileEditingSessions.flush("Connections.canvas"); return JSON.parse(await app.vault.read(app.vault.getFileByPath("Connections.canvas")!)); };
    await waitFor(async () => expect((await read()).edges[0]).toEqual({ ...input.edges[0], toNode: "c", toSide: "top" }));
    await userEvent.click(await board.findByRole("button", { name: "Follow target card", exact: true }));
    await waitFor(() => expect(root.querySelector('.svelte-flow__node[data-id="c"]')).toHaveClass("selected"));
    await userEvent.click(board.getByRole("button", { name: "Undo", exact: true }));
    await waitFor(async () => expect((await read()).edges).toEqual(input.edges));
    await select();
    await userEvent.click(board.getByText("Reconnect", { exact: true }));
    await userEvent.selectOptions(board.getByLabelText("Source card"), "c");
    await userEvent.selectOptions(board.getByLabelText("Source side"), "bottom");
    await userEvent.click(board.getByRole("button", { name: "Apply endpoints", exact: true }));
    await waitFor(async () => expect((await read()).edges[0]).toEqual({ ...input.edges[0], fromNode: "c", fromSide: "bottom" }));
    expect((await read()).metadata).toBe("retain");
    expect((await read()).nodes).toEqual(input.nodes);
  },
};

export const ConstrainedToolbar: Story = {
  name: "Connector controls stay reachable beside fixed panels",
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", canvasPath: "Connections.canvas", files: { "Connections.canvas": JSON.stringify({ ...input, edges: [{ id: "ab", fromNode: "a", toNode: "b", label: "Retained" }] }) } } }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.svelte-flow__node[data-id="a"]')).toBeVisible(), { timeout: 30_000 });
  },
};
