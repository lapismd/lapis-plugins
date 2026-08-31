import type { App } from "@lapis-notes/api";
import { SlidesViewType } from "@lapis-notes/slides";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import SlidesDemo from "./SlidesDemo.svelte";
import { SLIDES_DEMO_PATH } from "./create-slides-demo";

const meta = {
  title: "Plugins/Slides/Registry Screenshots",
  component: SlidesDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen", visualDelta: { delay: 150 } },
} satisfies Meta<typeof SlidesDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function slidesApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="slides-demo"]',
  );
  if (!root?.__lapisApp) throw new Error("Slides story has no explicit App");
  return root.__lapisApp;
}

export const Presentation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("slides-demo-status")).toHaveTextContent(
          "ready",
        );
        expect(
          canvasElement.querySelector('[data-app-shell-ready="true"]'),
        ).not.toBeNull();
      },
      { timeout: 20_000 },
    );

    const app = slidesApp(canvasElement);
    expect(app.plugins.isPluginEnabled("markdown")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-slides")).toBe(true);
    expect(app.workspace.getActiveFile()?.path).toBe(SLIDES_DEMO_PATH);

    await app.commands.executeCommand("lapis-slides:start-presentation");

    const deck = await waitFor(
      () => {
        const candidate = canvasElement.querySelector<HTMLElement>(
          '[data-testid="slides-deck"]',
        );
        expect(candidate).not.toBeNull();
        expect(candidate?.dataset.revealReady).toBe("true");
        expect(candidate).toBeVisible();
        expect(app.workspace.getLeavesOfType(SlidesViewType)).toHaveLength(1);
        return candidate!;
      },
      { timeout: 20_000 },
    );

    const deckCanvas = within(deck);
    const next = deckCanvas.getByRole("button", { name: /next slide/iu });
    expect(next).toHaveClass("enabled");
    next.click();

    await waitFor(() => {
      expect(
        deckCanvas.getByRole("heading", { level: 2, name: "Goals" }),
      ).toBeVisible();
      expect(
        deckCanvas.getByText("Confirm markdown slide splitting."),
      ).toBeVisible();
      expect(
        deckCanvas.getByText("Confirm lists, code, and notes render."),
      ).toBeVisible();
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(
      deckCanvas.getByRole("heading", { level: 2, name: "Goals" }),
    ).toBeVisible();

    expect(deck.querySelector(".controls")).toBeVisible();
    expect(
      canvas.getByRole("button", { name: "Close presentation" }),
    ).toBeVisible();
  },
};
