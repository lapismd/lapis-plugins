import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";
import fixtureUrl from "./web-preview-fixture.html?url&no-inline";

const meta = {
  title: "Plugins/Canvas/Web Previews",
  component: ViewingPanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "URL cards keep external navigation available while previews connect only after an explicit action inside a restricted frame.",
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
const document = () =>
  JSON.stringify({
    metadata: "keep",
    nodes: [
      {
        id: "web",
        type: "link",
        url: new URL(fixtureUrl, window.location.href).href,
        x: 0,
        y: 0,
        width: 440,
        height: 380,
      },
      {
        id: "unsafe",
        type: "link",
        url: "javascript:alert('inert imported URL')",
        x: 500,
        y: 0,
        width: 320,
        height: 180,
      },
    ],
    edges: [],
  });
const render = () => ({
  Component: ViewingPanelDemo,
  props: {
    layout: "middle-top-tabs",
    canvasPath: "Web.canvas",
    files: { "Web.canvas": document() },
  },
});
async function owner(canvasElement: HTMLElement): Promise<App> {
  return waitFor(
    () => {
      const host = canvasElement.querySelector<HTMLElement>(
        '[data-panel-kind="canvas"][data-status="ready"]',
      ) as (HTMLElement & { __lapisApp?: App }) | null;
      expect(host?.__lapisApp).toBeDefined();
      return host!.__lapisApp!;
    },
    { timeout: 30_000 },
  );
}
export const NativePreviewFixture: Story = {
  name: "Native web preview fixture",
  render,
  play: async ({ canvasElement }) => {
    await owner(canvasElement);
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-id="web"]')).toBeVisible(),
    );
  },
};
export const ExplicitPreview: Story = {
  name: "Explicit previews isolate web content and preserve source",
  render,
  play: async ({ canvasElement }) => {
    const app = await owner(canvasElement),
      before = await app.vault.read(app.vault.getFileByPath("Web.canvas")!);
    const node = await waitFor(() => {
      const element =
        canvasElement.querySelector<HTMLElement>('[data-id="web"]');
      expect(element).toBeVisible();
      return element!;
    });
    const card = within(node);
    expect(node.querySelector("iframe")).toBeNull();
    const link = card.getByRole("link", { name: "Open link", exact: true });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
    const invalid =
      canvasElement.querySelector<HTMLElement>('[data-id="unsafe"]')!;
    expect(within(invalid).queryByRole("link")).toBeNull();
    expect(invalid).toHaveTextContent("HTTP or HTTPS");
    await userEvent.click(
      card.getByRole("button", { name: "Load web preview", exact: true }),
    );
    const frame = await waitFor(() => {
      const element = node.querySelector("iframe");
      expect(element).not.toBeNull();
      return element!;
    });
    expect(frame).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-forms allow-popups",
    );
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(frame.getAttribute("allow")).toContain("camera 'none'");
    expect(
      card.getByRole("link", { name: "Open link", exact: true }),
    ).toBeVisible();
    await userEvent.click(
      card.getByRole("button", { name: "Close preview", exact: true }),
    );
    expect(node.querySelector("iframe")).toBeNull();
    await app.fileEditingSessions.flush("Web.canvas");
    expect(await app.vault.read(app.vault.getFileByPath("Web.canvas")!)).toBe(
      before,
    );
  },
};
export const ReadOnlyPreview: Story = {
  name: "Read-only embeds share safe web cards",
  render,
  play: async ({ canvasElement }) => {
    const app = await owner(canvasElement),
      before = await app.vault.read(app.vault.getFileByPath("Web.canvas")!);
    const note = await app.vault.create("Web embed.md", "![[Web.canvas]]");
    const leaf = app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: "markdown",
      state: { file: note.path, mode: "preview" },
    });
    app.workspace.revealLeaf(leaf);
    const embed = await waitFor(() => {
      const element = canvasElement.querySelector<HTMLElement>(
        "[data-canvas-embed]",
      );
      expect(element).not.toBeNull();
      return element!;
    });
    const valid = embed.querySelector<HTMLElement>('[data-id="web"]')!;
    await userEvent.click(
      await within(valid).findByRole("button", {
        name: "Load web preview",
        exact: true,
      }),
    );
    await waitFor(() => expect(valid.querySelector("iframe")).not.toBeNull());
    expect(embed.querySelector('[data-id="unsafe"] a')).toBeNull();
    expect(await app.vault.read(app.vault.getFileByPath("Web.canvas")!)).toBe(
      before,
    );
  },
};
