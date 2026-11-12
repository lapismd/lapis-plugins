import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";
const input = JSON.stringify({
  metadata: "keep",
  nodes: [
    {
      id: "a",
      type: "text",
      text: "# Export text\n\nReadable card content.",
      x: -50,
      y: 0,
      width: 320,
      height: 220,
      color: "4",
    },
    {
      id: "f",
      type: "file",
      file: "Private plan.md",
      x: 400,
      y: 0,
      width: 320,
      height: 220,
    },
    {
      id: "w",
      type: "link",
      url: "https://private.example.test/secret-address",
      x: 900,
      y: 0,
      width: 320,
      height: 220,
    },
  ],
  edges: [{ id: "af", fromNode: "a", toNode: "f" }],
});
const meta = {
  title: "Plugins/Canvas/Export",
  component: ViewingPanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "PNG export supports full-board and viewport crops, explicit quality and privacy options without changing stored data or the camera.",
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
    canvasPath: "Export.canvas",
    files: {
      "Export.canvas": input,
      "Private plan.md": "# PRIVATE FILE CONTENT\nDo not include by default.",
    },
  },
});
export const NativeExportFixture: Story = {
  name: "Native PNG export fixture",
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
export const Options: Story = {
  name: "Export privacy, quality and focus remain accessible",
  render,
  play: async ({ canvasElement }) => {
    const host = await waitFor(
      () => {
        const el = canvasElement.querySelector(
          '[data-panel-kind="canvas"][data-status="ready"]',
        ) as HTMLElement & { __lapisApp?: App };
        expect(el?.__lapisApp).toBeDefined();
        return el;
      },
      { timeout: 30_000 },
    );
    const app = host.__lapisApp!,
      root = canvasElement.querySelector<HTMLElement>(
        ".canvas-view-root:not([data-canvas-embed])",
      )!,
      board = within(root);
    const zoom = () =>
      new DOMMatrix(
        getComputedStyle(root.querySelector(".svelte-flow__viewport")!)
          .transform,
      ).a;
    await waitFor(() => expect(zoom()).toBeLessThan(0.99));
    await userEvent.click(
      board.getByRole("button", { name: "Reset zoom", exact: true }),
    );
    await waitFor(() => expect(zoom()).toBe(1));
    const before = await app.vault.read(
        app.vault.getFileByPath("Export.canvas")!,
      ),
      camera = root
        .querySelector(".svelte-flow__viewport")!
        .getAttribute("style");
    await userEvent.click(
      board.getByRole("button", { name: "Export PNG", exact: true }),
    );
    const dialog = board.getByRole("dialog", {
        name: "Export Canvas as PNG",
        exact: true,
      }),
      form = within(dialog);
    expect(form.getByLabelText("Include text cards")).toBeChecked();
    for (const label of [
      "Include file contents and paths",
      "Include web addresses",
      "Include decoded local images",
    ])
      expect(form.getByLabelText(label)).not.toBeChecked();
    await userEvent.selectOptions(form.getByLabelText("Area"), "viewport");
    await userEvent.selectOptions(form.getByLabelText("Quality"), "2");
    await userEvent.click(
      form.getByRole("button", { name: "Cancel", exact: true }),
    );
    expect(
      board.getByRole("button", { name: "Export PNG", exact: true }),
    ).toHaveFocus();
    expect(
      root.querySelector(".svelte-flow__viewport")!.getAttribute("style"),
    ).toBe(camera);
    expect(
      await app.vault.read(app.vault.getFileByPath("Export.canvas")!),
    ).toBe(before);
  },
};
export const OpenOptions: Story = {
  name: "Open export options remain accessible",
  render,
  play: async ({ canvasElement }) => {
    const root = await waitFor(
      () => {
        const el = canvasElement.querySelector<HTMLElement>(
          ".canvas-view-root:not([data-canvas-embed])",
        );
        expect(el).toBeVisible();
        return el!;
      },
      { timeout: 30_000 },
    );
    await userEvent.click(
      await within(root).findByRole("button", {
        name: "Export PNG",
        exact: true,
      }),
    );
    expect(
      within(root).getByRole("dialog", {
        name: "Export Canvas as PNG",
        exact: true,
      }),
    ).toBeVisible();
  },
};
export const EmptyBoard: Story = {
  name: "Empty boards explain why export is unavailable",
  render: () => ({
    Component: ViewingPanelDemo,
    props: {
      layout: "middle-top-tabs",
      canvasPath: "Empty.canvas",
      files: { "Empty.canvas": '{"nodes":[],"edges":[]}' },
    },
  }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", {
      name: "Export PNG",
      exact: true,
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Add a card before exporting.");
  },
};
