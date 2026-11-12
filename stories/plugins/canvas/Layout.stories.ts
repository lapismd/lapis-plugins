import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";

const document = JSON.stringify({ metadata: { retain: "layout" }, nodes: [
  { id: "a", type: "text", x: 0, y: 0, width: 120, height: 80, text: "A", extension: "keep" },
  { id: "b", type: "text", x: 260, y: 100, width: 200, height: 140, text: "B" },
  { id: "c", type: "text", x: 620, y: 240, width: 80, height: 60, text: "C" },
], edges: [{ id: "ab", fromNode: "a", toNode: "b", extension: true }] });
const meta = {
  title: "Plugins/Canvas/Layout", component: ViewingPanelDemo, tags: ["visual-pending"],
  parameters: { layout: "fullscreen", docs: {
    description: { component: "Selection arrangement changes card geometry through the owning board history and preserves imported fields, identities and connectors." },
    source: { language: "svelte", type: "code", code: '<script lang="ts">\n  import type { App } from "@lapis-notes/api";\n  import { WorkspaceShell } from "@lapis-notes/workspace";\n  let { app }: { app: App } = $props();\n</script>\n<WorkspaceShell {app} />' },
  } },
} satisfies Meta<typeof ViewingPanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SelectionArrangement: Story = {
  name: "Selected cards align and arrange with undo",
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", canvasPath: "Layout.canvas", files: { "Layout.canvas": document } } }),
  play: async ({ canvasElement }) => {
    const app = await waitFor(() => { const host = canvasElement.querySelector<HTMLElement>('[data-panel-kind="canvas"][data-status="ready"]') as (HTMLElement & { __lapisApp?: App }) | null; expect(host?.__lapisApp).toBeDefined(); return host!.__lapisApp!; }, { timeout: 30_000 });
    const root = canvasElement.querySelector<HTMLElement>(".canvas-view-root:not([data-canvas-embed])")!;
    const board = within(root);
    await userEvent.click(root.querySelector<HTMLElement>('[data-id="a"] .canvas-node-label')!);
    await userEvent.keyboard("{Control>}");
    await userEvent.click(root.querySelector<HTMLElement>('[data-id="b"] .canvas-node-label')!);
    await userEvent.click(root.querySelector<HTMLElement>('[data-id="c"] .canvas-node-label')!);
    await userEvent.keyboard("{/Control}");
    await waitFor(() => expect(root.querySelectorAll(".svelte-flow__node.selected")).toHaveLength(3));
    await userEvent.click(board.getByText("Arrange", { exact: true }));
    const alignLeft = board.getByRole("button", { name: "Align left", exact: true });
    alignLeft.focus();
    await userEvent.keyboard("{Escape}");
    expect(root.querySelector<HTMLDetailsElement>(".canvas-selection-layout")!.open).toBe(false);
    expect(alignLeft).not.toBeVisible();
    expect(board.getByText("Arrange", { exact: true })).toHaveFocus();
    await userEvent.click(board.getByText("Arrange", { exact: true }));
    await userEvent.click(board.getByRole("button", { name: "Align left", exact: true }));
    const read = async () => { await app.fileEditingSessions.flush("Layout.canvas"); return JSON.parse(await app.vault.read(app.vault.getFileByPath("Layout.canvas")!)); };
    await waitFor(async () => expect((await read()).nodes.map((node: { x: number }) => node.x)).toEqual([0, 0, 0]));
    await userEvent.click(board.getByRole("button", { name: "Undo", exact: true }));
    await waitFor(async () => expect((await read()).nodes.map((node: { x: number }) => node.x)).toEqual([0, 260, 620]));
    await userEvent.click(board.getByRole("button", { name: "Redo", exact: true }));
    await waitFor(async () => expect((await read()).nodes.map((node: { x: number }) => node.x)).toEqual([0, 0, 0]));
    // History restores geometry; selection is explicit for the next command.
    await userEvent.click(root.querySelector<HTMLElement>('[data-id="a"] .canvas-node-label')!);
    await userEvent.keyboard("{Control>}");
    await userEvent.click(root.querySelector<HTMLElement>('[data-id="b"] .canvas-node-label')!);
    await userEvent.click(root.querySelector<HTMLElement>('[data-id="c"] .canvas-node-label')!);
    await userEvent.keyboard("{/Control}");
    await userEvent.click(board.getByText("Arrange", { exact: true }));
    await userEvent.click(board.getByRole("button", { name: "Arrange in a row", exact: true }));
    const saved = await waitFor(async () => { const value = await read(); expect(value.nodes.map((node: { x: number; y: number }) => [node.x, node.y])).toEqual([[0, 0], [144, 0], [368, 0]]); return value; });
    expect(saved.nodes.map((node: { width: number; height: number }) => [node.width, node.height])).toEqual([[120, 80], [200, 140], [80, 60]]);
    expect(saved.nodes[0].extension).toBe("keep");
    expect(saved.metadata).toEqual({ retain: "layout" });
    expect(saved.edges).toEqual(JSON.parse(document).edges);
  },
};
