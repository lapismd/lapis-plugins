import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  verifyEditingAlignment,
  verifySearchUnderSettings,
} from "./reading-surface-editing";
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

export const ReadingMath: Story = {
  tags: ["visual-pending"],
  play: async ({ canvasElement }) => {
    const app = await registryPanelApp(canvasElement);
    const path = "Notes/Reading-math.md";
    const source = [
      "# Reading math",
      "",
      "An **ordinary paragraph** with inline $x^2 + y^2 = z^2$.",
      "",
      "- A normal list item",
      "",
      "$$",
      "\\frac{1}{2} + \\sqrt{4} = \\frac{5}{2}",
      "$$",
      "",
    ].join("\n");
    const file = await app.vault.create(path, source);

    const verifyMath = async () => {
      await waitFor(() => {
        const preview = canvasElement.querySelector<HTMLElement>(
          '[data-ui-component="markdown-mira-preview"] .mira-markdown-preview'
        );
        expect(preview).not.toBeNull();
        expect(
          within(preview!).getByRole("heading", { name: "Reading math" })
        ).toBeVisible();
        expect(preview!.querySelector("strong")).toHaveTextContent(
          "ordinary paragraph"
        );
        expect(preview!.querySelector("li")).toHaveTextContent(
          "A normal list item"
        );
        const formulas = preview!.querySelectorAll<HTMLElement>(".katex");
        expect(formulas).toHaveLength(2);
        for (const formula of formulas) expect(formula).toBeVisible();
        expect(preview!.querySelectorAll(".katex-display")).toHaveLength(1);
        expect(preview!.querySelectorAll(".katex-error")).toHaveLength(0);
        expect(
          Array.from(
            preview!.querySelectorAll(
              'annotation[encoding="application/x-tex"]'
            ),
            (annotation) => annotation.textContent?.trim()
          )
        ).toEqual([
          "x^2 + y^2 = z^2",
          "\\frac{1}{2} + \\sqrt{4} = \\frac{5}{2}",
        ]);
      });
    };

    await openRegistryFile(canvasElement, path, { mode: "preview" });
    await verifyMath();
    const { editor } = await openRegistryFile(canvasElement, path, {
      mode: "source",
    });
    if (!editor) throw new Error("Reading math has no source editor");
    expect(editor.getValue()).toBe(source);
    expect(
      canvasElement.querySelector('[data-ui-component="markdown-mira-preview"]')
    ).toBeNull();
    await openRegistryFile(canvasElement, path, { mode: "preview" });
    await verifyMath();
    expect(await app.vault.read(file)).toBe(source);
  },
};

export const EditingTitleAlignment: Story = {
  play: ({ canvasElement }) =>
    verifyEditingAlignment(canvasElement, "live-preview"),
};
export const SourceTitleAlignment: Story = {
  play: ({ canvasElement }) => verifyEditingAlignment(canvasElement, "source"),
};
export const EditingTitleAlignmentDark: Story = {
  ...EditingTitleAlignment,
  globals: { colorMode: "dark" },
};
export const EditingSearchSettings: Story = {
  play: ({ canvasElement }) => verifySearchUnderSettings(canvasElement),
};
export const EditingSearchSettingsDark: Story = {
  ...EditingSearchSettings,
  globals: { colorMode: "dark" },
};
