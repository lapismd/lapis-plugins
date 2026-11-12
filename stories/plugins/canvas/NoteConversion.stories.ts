import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";
const text = "# Draft\n\n**Exact** Markdown body.";
const input = {
  metadata: "retain",
  nodes: [
    {
      id: "a",
      type: "text",
      text,
      x: 0,
      y: 0,
      width: 320,
      height: 220,
      extension: { keep: true },
    },
    {
      id: "b",
      type: "text",
      text: "Related card",
      x: 500,
      y: 0,
      width: 220,
      height: 160,
    },
  ],
  edges: [{ id: "ab", fromNode: "a", toNode: "b", extension: true }],
};
const meta = {
  title: "Plugins/Canvas/Note Conversion",
  component: ViewingPanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Convert owned text cards to Markdown notes without losing geometry, connections, extension fields or undo history.",
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
export const NativeConversionFixture: Story = {
  name: "Native conversion fixture",
  render: () => render(),
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
const render = () => ({
  Component: ViewingPanelDemo,
  props: {
    layout: "middle-top-tabs",
    canvasPath: "Conversion.canvas",
    files: {
      "Conversion.canvas": JSON.stringify(input),
      "Draft.md": "Existing note is retained.",
    },
  },
});
async function setup(canvasElement: HTMLElement) {
  const app = await waitFor(
    () => {
      const host = canvasElement.querySelector(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as (HTMLElement & { __lapisApp?: App }) | null;
      expect(host?.__lapisApp).toBeDefined();
      return host!.__lapisApp!;
    },
    { timeout: 30_000 },
  );
  const root = canvasElement.querySelector<HTMLElement>(
      ".canvas-view-root:not([data-canvas-embed])",
    )!,
    board = within(root);
  const card = root.querySelector<HTMLElement>(
    '.svelte-flow__node[data-id="a"]',
  )!;
  await waitFor(() => expect(card).toBeVisible());
  card.focus();
  await userEvent.keyboard("{Enter}");
  await userEvent.click(
    await board.findByRole("button", { name: "Convert to note", exact: true }),
  );
  const dialog = board.getByRole("dialog", {
    name: "Convert text card to note",
    exact: true,
  });
  await userEvent.clear(within(dialog).getByLabelText("Note name"));
  await userEvent.type(within(dialog).getByLabelText("Note name"), "Draft");
  const read = async () => {
    await app.fileEditingSessions.flush("Conversion.canvas");
    return JSON.parse(
      await app.vault.read(app.vault.getFileByPath("Conversion.canvas")!),
    );
  };
  return { app, root, board, dialog, read };
}
export const ConvertAndUndo: Story = {
  name: "Conversion preserves cards, connections and retained-note undo",
  render,
  play: async ({ canvasElement }) => {
    const { app, board, dialog, read } = await setup(canvasElement);
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Create note", exact: true }),
    );
    await waitFor(async () =>
      expect((await read()).nodes[0].type).toBe("file"),
    );
    const current = await read(),
      path = current.nodes[0].file;
    expect(path).not.toBe("Draft.md");
    expect(await app.vault.read(app.vault.getFileByPath("Draft.md")!)).toBe(
      "Existing note is retained.",
    );
    expect(await app.vault.read(app.vault.getFileByPath(path)!)).toBe(text);
    const { text: _text, type: _type, ...fields } = input.nodes[0];
    expect(current).toEqual({
      ...input,
      nodes: [{ ...fields, type: "file", file: path }, input.nodes[1]],
    });
    await userEvent.click(
      board.getByRole("button", { name: "Undo", exact: true }),
    );
    await waitFor(async () => expect(await read()).toEqual(input));
    expect(await app.vault.read(app.vault.getFileByPath(path)!)).toBe(text);
    await userEvent.click(
      board.getByRole("button", { name: "Redo", exact: true }),
    );
    await waitFor(async () => expect(await read()).toEqual(current));
  },
};
export const CreationFailure: Story = {
  name: "Failed note creation retains the text and supports retry",
  render,
  play: async ({ canvasElement }) => {
    const { app, board, dialog, read } = await setup(canvasElement),
      original = app.vault.create;
    app.vault.create = async () => {
      throw new Error("Vault is full");
    };
    try {
      await userEvent.click(
        within(dialog).getByRole("button", {
          name: "Create note",
          exact: true,
        }),
      );
      await waitFor(() =>
        expect(within(dialog).getByRole("alert")).toHaveTextContent(
          "Vault is full",
        ),
      );
      expect(await read()).toEqual(input);
    } finally {
      app.vault.create = original;
    }
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Create note", exact: true }),
    );
    await waitFor(async () =>
      expect((await read()).nodes[0].type).toBe("file"),
    );
    await userEvent.click(
      board.getByRole("button", { name: "Undo", exact: true }),
    );
    await waitFor(async () => expect(await read()).toEqual(input));
  },
};
