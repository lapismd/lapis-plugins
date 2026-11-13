import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";

const colors = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "#ffffff",
  "#000000",
  "#ffff00",
  "#102030",
];
const document = JSON.stringify({
  nodes: colors.map((color, index) => ({
    id: `tone-${index}`,
    type: index === 8 ? "group" : "text",
    color,
    x: (index % 3) * 340,
    y: Math.floor(index / 3) * 200,
    width: 300,
    height: 160,
    ...(index === 8
      ? { label: "Custom group" }
      : { text: `Readable card ${index}` }),
  })),
  edges: colors.slice(0, 6).map((color, index) => ({
    id: `line-${index}`,
    color,
    fromNode: `tone-${index}`,
    toNode: `tone-${index + 1}`,
    label: `Connector ${index}`,
  })),
});
const meta = {
  title: "Plugins/Canvas/Accessibility",
  component: ViewingPanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Canvas text, card boundaries, connectors and descriptions remain usable in both Lapis colour modes, including stored custom colours and theme overrides.",
      },
      source: {
        code: '<script lang="ts">\n  import type { App } from "@lapis-notes/api";\n  import { WorkspaceShell } from "@lapis-notes/workspace";\n  let { app }: { app: App } = $props();\n</script>\n<WorkspaceShell {app} />',
        language: "svelte",
        type: "code",
      },
    },
  },
} satisfies Meta<typeof ViewingPanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

// Independently measure the browser's rendered sRGB output, including CSS Color 4.
function pixel(element: Element, value: string): number[] {
  const canvas = element.ownerDocument.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d")!;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
}
function background(element: Element): number[] {
  const ancestors: Element[] = [];
  for (
    let parent: Element | null = element;
    parent;
    parent = parent.parentElement
  )
    ancestors.unshift(parent);
  const canvas = element.ownerDocument.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "white";
  context.fillRect(0, 0, 1, 1);
  for (const parent of ancestors) {
    context.fillStyle = getComputedStyle(parent).backgroundColor;
    context.fillRect(0, 0, 1, 1);
  }
  return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
}
function ratio(a: number[], b: number[]): number {
  const luminance = (rgb: number[]) =>
    rgb
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((v, n, i) => v + n * [0.2126, 0.7152, 0.0722][i]!, 0);
  const first = luminance(a),
    second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
function contrastStories(mode: "light" | "dark", embed: boolean): Story {
  return {
    name: `${mode === "light" ? "Light" : "Dark"} ${embed ? "embed" : "board"} contrast`,
    globals: { colorMode: mode },
    render: () => ({
      Component: ViewingPanelDemo,
      props: {
        layout: "middle-top-tabs",
        canvasPath: "Contrast.canvas",
        focus: embed ? "note" : "canvas",
        files: {
          "Contrast.canvas": document,
          "Notes/Reading.md": "# Contrast reference\n![[Contrast.canvas]]",
        },
      },
    }),
    play: async ({ canvasElement }) => {
      const host = await waitFor(
        () => {
          const value = canvasElement.querySelector<HTMLElement>(
            '[data-panel-kind="canvas"][data-status="ready"]',
          ) as (HTMLElement & { __lapisApp?: App }) | null;
          expect(value?.__lapisApp).toBeDefined();
          return value!;
        },
        { timeout: 30_000 },
      );
      const app = host.__lapisApp!;
      canvasElement.ownerDocument.documentElement.classList.toggle(
        "dark",
        mode === "dark",
      );
      const board = await waitFor(() => {
        const value = canvasElement.querySelector<HTMLElement>(
          embed
            ? "[data-canvas-embed]"
            : ".canvas-view-root:not([data-canvas-embed])",
        );
        expect(value).not.toBeNull();
        return value!;
      });
      const verify = () => {
        for (let index = 0; index < colors.length; index++) {
          const card = board.querySelector<HTMLElement>(
            `[data-id="tone-${index}"] .canvas-node-label`,
          )!;
          expect(card).not.toBeNull();
          const cardBackground = background(card);
          const label = board.querySelector<HTMLElement>(
            `[data-id="tone-${index}"] ${index === 8 ? ".canvas-group-label-input" : embed ? ".canvas-node-kind" : ".mira-markdown-preview"}`,
          )!;
          const labelBackground =
            index === 8 ? background(label) : cardBackground;
          expect(
            ratio(pixel(label, getComputedStyle(label).color), labelBackground),
            `card ${index} label contrast`,
          ).toBeGreaterThanOrEqual(4.5);
          const text = card.querySelector<HTMLElement>(
            ".mira-markdown-preview, .canvas-node-text",
          );
          if (text && index !== 8)
            expect(
              ratio(pixel(text, getComputedStyle(text).color), cardBackground),
              `card ${index} body contrast`,
            ).toBeGreaterThanOrEqual(4.5);
        }
        const surface = board.querySelector<HTMLElement>(".svelte-flow")!;
        const backdrop = background(surface);
        const attribution = board.querySelector<HTMLElement>(
          ".svelte-flow__attribution a",
        )!;
        expect(
          ratio(
            pixel(attribution, getComputedStyle(attribution).color),
            background(attribution),
          ),
          `attribution text contrast: text=${getComputedStyle(attribution).color}; background=${background(attribution)}; parent=${getComputedStyle(attribution.parentElement!).backgroundColor}; palette=${board.style.cssText}`,
        ).toBeGreaterThanOrEqual(4.5);
        const minimap = board.querySelector<HTMLElement>(
          ".svelte-flow__minimap",
        )!;
        expect(
          background(minimap),
          "minimap follows its owning board theme",
        ).toEqual(backdrop);
        for (const node of minimap.querySelectorAll(
          ".svelte-flow__minimap-node",
        )) {
          const stroke = getComputedStyle(node).stroke;
          expect(stroke).not.toBe("rgba(0, 0, 0, 0)");
          expect(
            ratio(pixel(node, stroke), background(minimap)),
            "minimap card outline contrast",
          ).toBeGreaterThanOrEqual(3);
        }
        const edges = board.querySelectorAll(".canvas-flow-edge-path");
        expect(edges).toHaveLength(6);
        for (const edge of edges)
          expect(
            ratio(pixel(edge, getComputedStyle(edge).stroke), backdrop),
            `connector contrast: stroke=${getComputedStyle(edge).stroke}; backdrop=${backdrop}; root=${getComputedStyle(board).backgroundColor}; flow=${getComputedStyle(surface).backgroundColor}; palette=${board.style.cssText}`,
          ).toBeGreaterThanOrEqual(3);
      };
      await waitFor(verify);
      const firstCard = board.querySelector<HTMLElement>(
        '[data-id="tone-0"] .canvas-node-label',
      )!;
      const previousFill = getComputedStyle(firstCard).backgroundColor;
      board.style.setProperty("--canvas-color-1", "255, 255, 255");
      board.style.setProperty("--canvas-color-2", "0, 0, 0");
      await waitFor(() =>
        expect(getComputedStyle(firstCard).backgroundColor).not.toBe(
          previousFill,
        ),
      );
      await waitFor(verify);
      const control = board.querySelector<HTMLButtonElement>(
        ".svelte-flow__controls button:not(:disabled)",
      )!;
      control.focus();
      expect(control).toHaveFocus();
      expect(getComputedStyle(control).outlineStyle).not.toBe("none");
      expect(
        Number.parseFloat(getComputedStyle(control).outlineWidth),
      ).toBeGreaterThanOrEqual(2);
      expect(
        ratio(
          pixel(control, getComputedStyle(control).color),
          background(control),
        ),
      ).toBeGreaterThanOrEqual(3);
      expect(
        ratio(
          pixel(control, getComputedStyle(control).outlineColor),
          background(control),
        ),
      ).toBeGreaterThanOrEqual(3);
      expect(
        await app.vault.read(app.vault.getFileByPath("Contrast.canvas")!),
      ).toBe(document);
    },
  };
}
export const LightBoard = contrastStories("light", false);
export const DarkBoard = contrastStories("dark", false);
export const LightEmbed = contrastStories("light", true);
export const DarkEmbed = contrastStories("dark", true);

const controlsDocument = JSON.stringify({
  metadata: "retain",
  nodes: [
    {
      id: "text",
      type: "text",
      text: "# Project plan",
      color: "6",
      x: 0,
      y: 0,
      width: 280,
      height: 180,
    },
    {
      id: "web",
      type: "link",
      url: "https://example.com/guide",
      color: "2",
      x: 380,
      y: 0,
      width: 300,
      height: 180,
    },
    {
      id: "group",
      type: "group",
      label: "Reference group",
      color: "3",
      x: 0,
      y: 300,
      width: 400,
      height: 240,
    },
  ],
  edges: [],
});
function controlContrast(mode: "light" | "dark"): Story {
  return {
    name: `${mode === "light" ? "Light" : "Dark"} workflow controls and dialogs contrast`,
    globals: { colorMode: mode },
    render: () => ({
      Component: ViewingPanelDemo,
      props: {
        layout: "middle-top-tabs",
        canvasPath: "Controls.canvas",
        files: {
          "Controls.canvas": controlsDocument,
          "Art.svg":
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="teal"/></svg>',
        },
      },
    }),
    play: async ({ canvasElement }) => {
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
      canvasElement.ownerDocument.documentElement.classList.toggle(
        "dark",
        mode === "dark",
      );
      const root = canvasElement.querySelector<HTMLElement>(
          ".canvas-view-root:not([data-canvas-embed])",
        )!,
        board = within(root);
      const verify = (scope: HTMLElement) => {
        for (const element of scope.querySelectorAll<HTMLElement>(
          'h2,p,label,legend,button,input:not([type="checkbox"]),select',
        )) {
          if (!element.getClientRects().length || element.matches(":disabled"))
            continue;
          const minimum =
            element.querySelector("svg") && !element.textContent?.trim()
              ? 3
              : 4.5;
          expect(
            ratio(
              pixel(element, getComputedStyle(element).color),
              background(element),
            ),
            `${mode} ${element.tagName} ${element.getAttribute("aria-label") ?? element.textContent?.trim()} contrast`,
          ).toBeGreaterThanOrEqual(minimum);
        }
      };
      await waitFor(() =>
        verify(
          board.getByRole("toolbar", { name: "Canvas authoring", exact: true }),
        ),
      );
      const web = root.querySelector<HTMLElement>('[data-id="web"]')!;
      await waitFor(() => verify(web));
      await userEvent.click(
        board.getByRole("button", { name: "Export PNG", exact: true }),
      );
      const png = board.getByRole("dialog", {
        name: "Export Canvas as PNG",
        exact: true,
      });
      await waitFor(() => verify(png));
      await userEvent.click(
        within(png).getByRole("button", { name: "Cancel", exact: true }),
      );
      await waitFor(() =>
        expect(
          board.getByRole("button", { name: "Export PNG", exact: true }),
        ).toHaveFocus(),
      );
      await userEvent.click(board.getByText("Select cards", { exact: true }));
      await userEvent.click(board.getByRole("checkbox", { name: /\(text\)$/ }));
      await expect(
        board.getByRole("checkbox", { name: /\(text\)$/ }),
      ).toBeChecked();
      verify(board.getByRole("group", { name: "Card selection", exact: true }));
      await userEvent.click(board.getByText("Select cards", { exact: true }));
      const convert = await board.findByRole("button", {
        name: "Convert to note",
        exact: true,
      });
      expect(
        ratio(
          pixel(convert, getComputedStyle(convert).color),
          background(convert),
        ),
      ).toBeGreaterThanOrEqual(3);
      await userEvent.click(convert);
      const note = board.getByRole("dialog", {
        name: "Convert text card to note",
        exact: true,
      });
      await waitFor(() => verify(note));
      await userEvent.click(
        within(note).getByRole("button", { name: "Cancel", exact: true }),
      );
      await waitFor(() => expect(convert).toHaveFocus());
      await userEvent.click(board.getByText("Select cards", { exact: true }));
      await userEvent.click(board.getByRole("checkbox", { name: /\(text\)$/ }));
      await userEvent.click(
        board.getByRole("checkbox", { name: /\(group\)$/ }),
      );
      await expect(
        board.getByRole("checkbox", { name: /\(group\)$/ }),
      ).toBeChecked();
      await userEvent.click(board.getByText("Select cards", { exact: true }));
      await userEvent.click(
        await board.findByRole("button", {
          name: "Set group background",
          exact: true,
        }),
      );
      const group = board.getByRole("dialog", {
        name: "Group background",
        exact: true,
      });
      await waitFor(() => verify(group));
      await userEvent.click(
        within(group).getByRole("button", { name: "Cancel", exact: true }),
      );
      expect(
        await app.vault.read(app.vault.getFileByPath("Controls.canvas")!),
      ).toBe(controlsDocument);
    },
  };
}
export const LightControls = controlContrast("light");
export const DarkControls = controlContrast("dark");

export const KeyboardDescriptions: Story = {
  name: "Canvas descriptions and announcements stay accessible",
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs" },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector(
            '[data-panel-kind="canvas"][data-status="ready"]',
          ),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    const board = canvasElement.querySelector<HTMLElement>(
      ".canvas-view-root:not([data-canvas-embed])",
    )!;
    const description = board.querySelector<HTMLElement>(
      '[id^="svelte-flow__node-desc-"]',
    )!;
    expect(description).not.toBeNull();
    expect(getComputedStyle(description).display).not.toBe("none");
    const announcements = board.querySelector<HTMLElement>(
      '[aria-live="assertive"]',
    )!;
    expect(announcements).not.toBeNull();
    expect(getComputedStyle(announcements).display).not.toBe("none");
  },
};
