import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import SlidesDemo from "./SlidesDemo.svelte";
import {
  advanceToHeading,
  expectSlidesTheme,
  openSlidesPresentation,
} from "./slides-story";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";

const deckSource = pluginWorkspaceSource(
  "@lapis-notes/slides",
  "SlidesPlugin",
  "lapis-slides:start-presentation"
);

const meta = {
  title: "Plugins/Slides/Decks",
  component: SlidesDemo,
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "App-backed Slides decks demonstrating Markdown parsing and Reveal.js navigation.",
      },
    },
    visualDelta: { delay: 150 },
  },
} satisfies Meta<typeof SlidesDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VerticalDeck: Story = {
  parameters: {
    ...registryStoryParameters(
      deckSource,
      "A vertical slide stack moves from Parser Fidelity down to Live Updates."
    ),
    visualDelta: { delay: 150 },
  },
  play: async ({ canvasElement, globals }) => {
    const { deck, deckCanvas } = await openSlidesPresentation(canvasElement);
    await expectSlidesTheme(
      deck,
      globals.colorMode === "dark" ? "dark" : "light"
    );

    await advanceToHeading(deckCanvas, 2, "Goals");
    await advanceToHeading(deckCanvas, 2, "Vertical Track");
    await advanceToHeading(deckCanvas, 3, "Parser Fidelity");

    expect(deck).toHaveClass("has-vertical-slides");
    const down = deckCanvas.getByRole("button", { name: "below slide" });
    expect(down).toHaveClass("enabled");
    down.click();

    await waitFor(() => {
      const heading = deckCanvas.getByRole("heading", {
        level: 3,
        name: "Live Updates",
      });
      expect(heading).toBeVisible();
      expect(heading.closest("section")).toHaveClass("present");
      expect(heading.closest("section")?.parentElement).toHaveClass(
        "stack",
        "present"
      );
    });
  },
};
