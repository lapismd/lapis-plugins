import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import SlidesDemo from "./SlidesDemo.svelte";
import {
  advanceToHeading,
  expectSlidesTheme,
  openSlidesPresentation,
} from "./slides-story";

const meta = {
  title: "Plugins/Slides/Registry Screenshots",
  component: SlidesDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen", visualDelta: { delay: 150 } },
} satisfies Meta<typeof SlidesDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Presentation: Story = {
  play: async ({ canvasElement, globals }) => {
    const { canvas, deck, deckCanvas } = await openSlidesPresentation(
      canvasElement
    );
    await expectSlidesTheme(
      deck,
      globals.colorMode === "dark" ? "dark" : "light"
    );
    await advanceToHeading(deckCanvas, 2, "Goals");

    await waitFor(() => {
      const heading = deckCanvas.getByRole("heading", {
        level: 2,
        name: "Goals",
      });
      const firstGoal = deckCanvas.getByText(
        "Confirm markdown slide splitting."
      );
      expect(heading).toBeVisible();
      expect(firstGoal).toBeVisible();
      expect(
        deckCanvas.getByText("Confirm lists, code, and notes render.")
      ).toBeVisible();
      expect(
        Number.parseFloat(getComputedStyle(heading).fontSize)
      ).toBeGreaterThan(56);
      expect(
        Number.parseFloat(getComputedStyle(firstGoal).fontSize)
      ).toBeGreaterThan(36);
      const embed = heading.closest<HTMLElement>(".markdown-preview-surface");
      expect(embed).not.toBeNull();
      expect(getComputedStyle(embed!).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(
      deckCanvas.getByRole("heading", { level: 2, name: "Goals" })
    ).toBeVisible();

    expect(deck.querySelector(".controls")).toBeVisible();
    expect(
      canvas.getByRole("button", { name: "Close presentation" })
    ).toBeVisible();
  },
};
