import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import SlidesDemo from "./SlidesDemo.svelte";
import {
  advanceToHeading,
  expectSlidesTheme,
  openSlidesPresentation,
} from "./slides-story";

const meta = {
  title: "Plugins/Slides/Decks",
  component: SlidesDemo,
  tags: ["visual-pending", "test"],
  parameters: { layout: "fullscreen", visualDelta: { delay: 150 } },
} satisfies Meta<typeof SlidesDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VerticalDeck: Story = {
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
