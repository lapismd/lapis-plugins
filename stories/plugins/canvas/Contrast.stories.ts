import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { contrastRatio } from "./contrast-assertions";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";

const colors = [
  undefined,
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "#000000",
  "#ffffff",
  "#777777",
  "#ff00ff",
  "#00ff00",
];
const document = JSON.stringify({
  nodes: colors.flatMap((color, index) => {
    const x = (index % 3) * 310,
      y = Math.floor(index / 3) * 240;
    return [
      {
        id: `group-${index}`,
        type: "group",
        label: `Colour ${color ?? "default"}`,
        color,
        x,
        y,
        width: 290,
        height: 215,
      },
      {
        id: `card-${index}`,
        type: "file",
        file: "Palette note.md",
        color,
        x: x + 15,
        y: y + 35,
        width: 260,
        height: 160,
      },
    ];
  }),
  edges: [
    {
      id: "connection",
      fromNode: "card-0",
      toNode: "card-1",
      label: "relates to",
    },
  ],
});
const meta = {
  title: "Plugins/Canvas/Contrast",
  component: ViewingPanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "WCAG normal-text contrast across every preset, default, custom black/white/midtone colours, and live theme overrides, in both the file view and read-only embed.",
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
function palette(theme: string, colorMode: string): Story {
  return {
    globals: { theme, colorMode },
    render: () => ({
      Component: ViewingPanelDemo,
      props: {
        layout: "middle-top-tabs",
        files: {
          "Sample.canvas": document,
          "Palette note.md":
            "# A readable note\n\nNotes stay legible on every colour.\n",
        },
      },
    }),
    play: async ({ canvasElement }) => {
      await waitFor(
        () =>
          expect(
            canvasElement.querySelector('[data-status="ready"]')
          ).toBeVisible(),
        { timeout: 30_000 }
      );
      const view = canvasElement.querySelector<HTMLElement>(
        ".canvas-view-root:not([data-canvas-embed])"
      )!;
      const embed = canvasElement.querySelector<HTMLElement>(
        "[data-canvas-embed].canvas-view-root"
      )!;
      await waitFor(
        () =>
          expect(embed?.querySelector('[data-id="card-11"] p')).not.toBeNull(),
        { timeout: 30_000 }
      );
      await userEvent.click(
        within(view).getByRole("button", { name: "Reset zoom", exact: true })
      );
      await waitFor(
        () =>
          expect(view.querySelector('[data-id="card-11"] p')).not.toBeNull(),
        { timeout: 30_000 }
      );
      const owner = canvasElement.ownerDocument;
      await waitFor(() => {
      for (const surface of [view, embed]) {
        for (let index = 0; index < colors.length; index++) {
          const card = surface.querySelector<HTMLElement>(
            `[data-id="card-${index}"] .canvas-node-label`
          )!;
          const paragraph = card.querySelector("p")!;
          expect(paragraph).not.toBeNull();
          expect(
            contrastRatio(
              owner,
              getComputedStyle(paragraph).color,
              getComputedStyle(card).backgroundColor
            ),
            `body ${theme}/${colorMode}/${colors[index]}: text=${getComputedStyle(paragraph).color}; fill=${getComputedStyle(card).backgroundColor}; embed=${surface.hasAttribute("data-canvas-embed")}`
          ).toBeGreaterThanOrEqual(4.5);
          const file = surface.querySelector<HTMLElement>(
            `[data-id="card-${index}"] .canvas-node-file-label`
          )!;
          expect(
            contrastRatio(
              owner,
              getComputedStyle(file).color,
              getComputedStyle(file).backgroundColor
            ),
            `filename ${index}`
          ).toBeGreaterThanOrEqual(4.5);
          const group = surface.querySelector<HTMLElement>(
            `[data-id="group-${index}"] .canvas-group-label-input`
          )!;
          expect(
            contrastRatio(
              owner,
              getComputedStyle(group).color,
              getComputedStyle(group.parentElement!).backgroundColor
            ),
            `group ${index}`
          ).toBeGreaterThanOrEqual(4.5);

        }
      }
      });
      // Theme-provided preset RGB values must resolve in CSS, including after mount.
      for (const surface of [view, embed])
        surface.style.setProperty("--canvas-color-1", "0, 255, 255");
      for (const surface of [view, embed]) {
        const card = surface.querySelector<HTMLElement>(
          '[data-id="card-1"] .canvas-node-label'
        )!;
        await waitFor(() => expect(
          contrastRatio(
            owner,
            getComputedStyle(card.querySelector("p")!).color,
            getComputedStyle(card).backgroundColor
          )
        ).toBeGreaterThanOrEqual(4.5));
      }
    },
  };
}
export const LapisLight = palette("lapis", "light");
export const LapisDark = palette("lapis", "dark");
export const DefaultLight = palette("default", "light");
export const DefaultDark = palette("default", "dark");
