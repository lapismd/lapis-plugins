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
      text: "Research note",
      x: 700,
      y: 400,
      width: 220,
      height: 140,
    },
    {
      id: "g",
      type: "group",
      label: "Research",
      x: 600,
      y: 300,
      width: 480,
      height: 300,
    },
  ],
  edges: [{ id: "ab", fromNode: "a", toNode: "b" }],
});
const meta = {
  title: "Plugins/Canvas/Navigation",
  component: ViewingPanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Navigation, group jumps and keyboard help stay owned by the focused Canvas and preserve the document.",
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
export const ExplorerDragSource: Story = {
  name: "Native Explorer drop on an empty board",
  render: () => ({
    Component: ViewingPanelDemo,
    props: {
      layout: "middle-top-tabs",
      canvasPath: "Drop.canvas",
      files: {
        "Drop.canvas": '{"nodes":[],"edges":[]}',
        "Dragged note.md": "Original vault note",
      },
    },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector(
            '[data-panel-kind="canvas"][data-status="ready"]',
          ),
        ).toBeVisible(),
      { timeout: 30_000 },
    );
  },
};
export const NavigationFixture: Story = {
  name: "Native navigation fixture",
  render: () => ({
    Component: ViewingPanelDemo,
    props: {
      layout: "middle-top-tabs",
      canvasPath: "Navigation.canvas",
      files: { "Navigation.canvas": input },
    },
  }),
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
export const KeyboardNavigation: Story = {
  name: "Navigation and help preserve the board document",
  render: () => ({
    Component: ViewingPanelDemo,
    props: {
      layout: "middle-top-tabs",
      canvasPath: "Navigation.canvas",
      files: { "Navigation.canvas": input },
    },
  }),
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
    await waitFor(() =>
      expect(
        root.querySelector('.svelte-flow__node[data-id="a"]'),
      ).toBeVisible(),
    );
    const board = within(root);
    const help = board.getByRole("button", {
      name: "Canvas help",
      exact: true,
    });
    await userEvent.click(help);
    const dialog = within(canvasElement.ownerDocument.body).getByRole(
      "dialog",
      { name: "Canvas navigation", exact: true },
    );
    expect(within(dialog).getByText("Shift+F", { exact: true })).toBeVisible();
    let release!: () => void, began!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<void>((resolve) => {
      began = resolve;
    });
    const guarded = app.fileEditingSessions.guard(
      "Navigation.canvas",
      async () => {
        began();
        await gate;
      },
    );
    try {
      await started;
      expect((dialog as HTMLDialogElement).inert).toBe(true);
    } finally {
      release();
      await guarded;
    }
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close help", exact: true }),
    );
    expect(help).toHaveFocus();
    const selected = board.getByRole("button", {
      name: "Fit selected cards",
      exact: true,
    });
    expect(selected).toBeDisabled();
    await userEvent.click(
      root.querySelector<HTMLElement>('[data-id="a"] .canvas-node-label')!,
    );
    expect(selected).toBeEnabled();
    const viewport = root.querySelector<HTMLElement>(".svelte-flow__viewport")!;
    const zoom = () => new DOMMatrix(getComputedStyle(viewport).transform).a;
    await userEvent.keyboard("{Shift>}F{/Shift}");
    await waitFor(() => expect(zoom()).toBeGreaterThan(1));
    await userEvent.keyboard("0");
    await waitFor(() => expect(zoom()).toBeCloseTo(1, 3));
    const before = viewport.style.transform;
    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    await waitFor(() => expect(viewport.style.transform).not.toBe(before));
    const group = root.querySelector<HTMLElement>('[data-id="g"]')!;
    await userEvent.selectOptions(
      board.getByRole("combobox", { name: "Jump to group", exact: true }),
      "g",
    );
    await waitFor(() => {
      const frame = root.getBoundingClientRect(),
        bounds = group.getBoundingClientRect();
      expect(bounds.left).toBeGreaterThanOrEqual(frame.left);
      expect(bounds.right).toBeLessThanOrEqual(frame.right);
      expect(bounds.top).toBeGreaterThanOrEqual(frame.top);
      expect(bounds.bottom).toBeLessThanOrEqual(frame.bottom);
    });
    await waitFor(() =>
      expect(
        board.getByRole("combobox", { name: "Jump to group", exact: true }),
      ).toHaveValue(""),
    );
    await userEvent.click(
      board.getByRole("button", { name: "Add web page", exact: true }),
    );
    const create = board.getByRole("dialog", {
      name: "Add web page",
      exact: true,
    });
    const camera = viewport.style.transform;
    await userEvent.type(within(create).getByLabelText("Web address"), "F0?");
    expect(viewport.style.transform).toBe(camera);
    expect(within(create).getByLabelText("Web address")).toHaveValue("F0?");
    await userEvent.click(
      within(create).getByRole("button", { name: "Cancel", exact: true }),
    );
    await app.fileEditingSessions.flush("Navigation.canvas");
    expect(
      await app.vault.read(app.vault.getFileByPath("Navigation.canvas")!),
    ).toBe(input);
  },
};

export const ReadOnlyNavigation: Story = {
  name: "Read-only embed shortcuts stay with the focused board",
  render: () => ({
    Component: ViewingPanelDemo,
    props: {
      layout: "middle-top-tabs",
      canvasPath: "Navigation.canvas",
      files: { "Navigation.canvas": input },
    },
  }),
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
    const note = await app.vault.create(
      "Navigation embeds.md",
      "![[Navigation.canvas]]\n\n![[Navigation.canvas]]",
    );
    const leaf = app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: "markdown",
      state: { file: note.path, mode: "preview" },
    });
    app.workspace.revealLeaf(leaf);
    const embeds = await waitFor(() => {
      const values = [
        ...canvasElement.querySelectorAll<HTMLElement>("[data-canvas-embed]"),
      ];
      expect(values).toHaveLength(2);
      return values;
    });
    for (const embed of embeds) expect(embed).toHaveAttribute("role", "group");
    const cameras = embeds.map(
      (embed) => embed.querySelector<HTMLElement>(".svelte-flow__viewport")!,
    );
    await waitFor(() => {
      for (const camera of cameras)
        expect(
          new DOMMatrix(getComputedStyle(camera).transform).a,
        ).toBeLessThan(1);
    });
    const board = within(embeds[0]);
    expect(
      board.queryByRole("button", { name: "Fit selected cards", exact: true }),
    ).toBeNull();
    await userEvent.click(
      board.getByRole("button", { name: "Canvas help", exact: true }),
    );
    const dialog = within(canvasElement.ownerDocument.body).getByRole(
      "dialog",
      { name: "Canvas navigation", exact: true },
    );
    expect(within(dialog).queryByText("Shift+F", { exact: true })).toBeNull();
    expect(
      within(dialog).queryByText("Arrow keys", { exact: true }),
    ).toBeNull();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close help", exact: true }),
    );
    const second = cameras[1].style.transform;
    await userEvent.keyboard("0");
    await waitFor(() =>
      expect(
        new DOMMatrix(getComputedStyle(cameras[0]).transform).a,
      ).toBeCloseTo(1, 3),
    );
    expect(cameras[1].style.transform).toBe(second);
    expect(
      await app.vault.read(app.vault.getFileByPath("Navigation.canvas")!),
    ).toBe(input);
  },
};
