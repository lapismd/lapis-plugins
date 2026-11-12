import { expandCanvasTools } from "./canvas-story-helpers";
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
    await expandCanvasTools(root);
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

const backgroundDocument = JSON.stringify({ metadata: { keep: true }, nodes: [
  { id: "group", type: "group", x: 0, y: 0, width: 500, height: 300, label: "Travel plan", background: "Art.svg", extension: "retain" },
], edges: [] });
export const GroupBackgrounds: Story = {
  name: "Groups render and edit owned image backgrounds",
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", canvasPath: "Background.canvas", files: {
    "Background.canvas": backgroundDocument,
    "Art.svg": '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="#268b86"/></svg>',
    "Other.svg": '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="#a66f2c"/></svg>',
  } } }),
  play: async ({ canvasElement }) => {
    const app = await waitFor(() => { const host = canvasElement.querySelector<HTMLElement>('[data-panel-kind="canvas"][data-status="ready"]') as (HTMLElement & { __lapisApp?: App }) | null; expect(host?.__lapisApp).toBeDefined(); return host!.__lapisApp!; }, { timeout: 30_000 });
    const root = canvasElement.querySelector<HTMLElement>(".canvas-view-root:not([data-canvas-embed])")!;
    const read = async () => { await app.fileEditingSessions.flush("Background.canvas"); return JSON.parse(await app.vault.read(app.vault.getFileByPath("Background.canvas")!)); };
    const image = () => root.querySelector<HTMLImageElement>("[data-canvas-background-probe]");
    await waitFor(() => expect(image()?.naturalWidth).toBe(20));
    const background = () => root.querySelector<HTMLElement>("[data-canvas-group-background]")!;
    expect(getComputedStyle(background()).backgroundSize).toBe("cover");
    await waitFor(() => expect(root.closest("[inert]")).toBeNull());
    await waitFor(() => expect(root.querySelector('.svelte-flow__node[data-id="group"]')).toBeVisible());
    root.querySelector<HTMLElement>('.svelte-flow__node[data-id="group"]')!.focus();
    expect(root.querySelector('.svelte-flow__node[data-id="group"]')).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(root.querySelector('.svelte-flow__node[data-id="group"]')).toHaveClass("selected"));
    const open = async () => { await userEvent.click(await within(root).findByRole("button", { name: "Set group background", exact: true })); return within(canvasElement.ownerDocument.body).getByRole("dialog", { name: "Group background", exact: true }); };
    let dialog = await open();
    let release!: () => void, began!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { began = resolve; });
    const guarded = app.fileEditingSessions.guard("Background.canvas", async () => { began(); await gate; });
    await started;
    try { expect((dialog as HTMLDialogElement).inert).toBe(true); }
    finally { release(); await guarded; }
    expect((dialog as HTMLDialogElement).inert).toBe(false);
    await userEvent.selectOptions(within(dialog).getByLabelText("Background sizing"), "ratio");
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply background" }));
    await waitFor(() => expect(getComputedStyle(background()).backgroundSize).toBe("contain"));
    await waitFor(async () => expect((await read()).nodes[0].backgroundStyle).toBe("ratio"));
    dialog = await open();
    await userEvent.selectOptions(within(dialog).getByLabelText("Background sizing"), "repeat");
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply background" }));
    await waitFor(() => expect(getComputedStyle(background()).backgroundRepeat).toBe("repeat"));
    dialog = await open();
    await userEvent.clear(within(dialog).getByLabelText("Image file"));
    await userEvent.type(within(dialog).getByLabelText("Image file"), "Absent.png");
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply background" }));
    await expect(within(dialog).getByRole("alert")).toHaveTextContent("existing vault image");
    expect((await read()).nodes[0].background).toBe("Art.svg");
    await userEvent.clear(within(dialog).getByLabelText("Image file"));
    await userEvent.type(within(dialog).getByLabelText("Image file"), "Other.svg");
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply background" }));
    await waitFor(() => expect(image()?.naturalWidth).toBe(40));
    await userEvent.click(await within(root).findByRole("button", { name: "Remove group background", exact: true }));
    await waitFor(() => expect(root.querySelector("[data-canvas-group-background]")).toBeNull());
    await waitFor(async () => expect((await read()).nodes[0].background).toBeUndefined());
    await userEvent.click(within(root).getByRole("button", { name: "Undo", exact: true }));
    await waitFor(() => expect(image()?.naturalWidth).toBe(40));
    const saved = await read();
    expect(saved.nodes[0]).toMatchObject({ width: 500, height: 300, background: "Other.svg", backgroundStyle: "repeat", extension: "retain" });
    expect(saved.metadata).toEqual({ keep: true });
    const note = await app.vault.create("Background embed.md", "![[Background.canvas]]");
    const leaf = app.workspace.getLeaf(true);
    await leaf.setViewState({ type: "markdown", state: { file: note.path, mode: "preview" } });
    app.workspace.revealLeaf(leaf);
    const embed = await waitFor(() => { const value = canvasElement.querySelector<HTMLElement>("[data-canvas-embed]"); expect(value).not.toBeNull(); return value!; });
    await waitFor(() => expect(embed.querySelector<HTMLImageElement>("[data-canvas-background-probe]")?.naturalWidth).toBe(40));
    expect(within(embed).queryByRole("button", { name: "Set group background" })).toBeNull();
  },
};
