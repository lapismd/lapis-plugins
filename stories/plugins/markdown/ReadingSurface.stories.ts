import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  openRegistryFile,
  registryPanelApp,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Markdown/Reading surface",
  component: PanelDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
  render: () => ({
    Component: PanelDemo,
    props: {
      kind: "explorer",
      layout: "left-sidebar",
      hideSidebars: true,
      diagnostics: "none",
    },
  }),
} satisfies Meta<typeof PanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

function readingStory(long: boolean): Story {
  return {
    play: async ({ canvasElement }) => {
      const app = await registryPanelApp(canvasElement);
      const path = "Notes/Reading-surface.md";
      const content = long
        ? Array.from(
            { length: 80 },
            (_, index) => `## Section ${index + 1}\n\nA complete document.\n`
          ).join("\n")
        : "# Short note\n\nThe reading surface fills its pane.\n";
      await app.vault.create(path, content);
      await openRegistryFile(canvasElement, path, { mode: "preview" });
      const root = '[data-ui-component="markdown-mira-preview"]';
      await waitFor(() => {
        const preview = canvasElement.querySelector<HTMLElement>(
          `${root} .mira-markdown-preview`
        );
        const viewport = canvasElement.querySelector<HTMLElement>(
          `${root} [data-ui-part="scroll-area-viewport"]`
        );
        expect(preview).not.toBeNull();
        expect(viewport).not.toBeNull();
        const bounds = preview!.getBoundingClientRect();
        const available = viewport!.getBoundingClientRect();
        expect(bounds.top).toBeLessThanOrEqual(available.top + 1);
        expect(bounds.bottom).toBeGreaterThanOrEqual(available.bottom - 1);
        expect(getComputedStyle(preview!).overflowY).toBe("visible");
        if (long)
          expect(viewport!.scrollHeight).toBeGreaterThan(
            viewport!.clientHeight
          );
        else
          expect(viewport!.scrollHeight).toBeLessThanOrEqual(
            viewport!.clientHeight + 1
          );
      });
      if (!long) return;
      const viewport = canvasElement.querySelector<HTMLElement>(
        `${root} [data-ui-part="scroll-area-viewport"]`
      )!;
      try {
        viewport.scrollTop = viewport.scrollHeight;
        await waitFor(() => {
          const heading = Array.from(
            canvasElement.querySelectorAll(`${root} h2`)
          ).find((node) => node.textContent?.includes("Section 80"));
          expect(heading).not.toBeUndefined();
          const bounds = heading!.getBoundingClientRect();
          const available = viewport.getBoundingClientRect();
          expect(bounds.top).toBeGreaterThanOrEqual(available.top);
          expect(bounds.bottom).toBeLessThanOrEqual(available.bottom);
        });
      } finally {
        viewport.scrollTop = 0;
      }
    },
  };
}

export const ShortNote = readingStory(false);
export const LongNote = readingStory(true);
export const ShortNoteDark: Story = {
  ...ShortNote,
  globals: { colorMode: "dark" },
};
export const LongNoteDark: Story = {
  ...LongNote,
  globals: { colorMode: "dark" },
};
