import type { App } from "@lapis-notes/api";
import { SlidesViewType } from "@lapis-notes/slides";
import { expect, waitFor, within } from "storybook/test";
import { SLIDES_DEMO_PATH } from "./create-slides-demo";

export function slidesApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="slides-demo"]'
  );
  if (!root?.__lapisApp) throw new Error("Slides story has no explicit App");
  return root.__lapisApp;
}

export async function openSlidesPresentation(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("slides-demo-status")).toHaveTextContent(
        "ready"
      );
      expect(
        canvasElement.querySelector('[data-app-shell-ready="true"]')
      ).not.toBeNull();
    },
    { timeout: 20_000 }
  );

  const app = slidesApp(canvasElement);
  expect(app.plugins.isPluginEnabled("markdown")).toBe(true);
  expect(app.plugins.isPluginEnabled("lapis-slides")).toBe(true);
  expect(app.workspace.getActiveFile()?.path).toBe(SLIDES_DEMO_PATH);

  await app.commands.executeCommand("lapis-slides:start-presentation");

  const deck = await waitFor(
    () => {
      const candidate = canvasElement.querySelector<HTMLElement>(
        '[data-testid="slides-deck"]'
      );
      expect(candidate).not.toBeNull();
      expect(candidate?.dataset.revealReady).toBe("true");
      expect(candidate).toBeVisible();
      expect(app.workspace.getLeavesOfType(SlidesViewType)).toHaveLength(1);
      return candidate!;
    },
    { timeout: 20_000 }
  );

  await new Promise((resolve) => setTimeout(resolve, 350));
  expect(deck.dataset.revealReady).toBe("true");

  return { app, canvas, deck, deckCanvas: within(deck) };
}

export async function advanceToHeading(
  deckCanvas: ReturnType<typeof within>,
  level: number,
  name: string
) {
  const next = deckCanvas.getByRole("button", { name: /next slide/iu });
  expect(next).toHaveClass("enabled");
  next.click();
  await waitFor(() => {
    expect(deckCanvas.getByRole("heading", { level, name })).toBeVisible();
  });
}

export async function expectSlidesTheme(
  deck: HTMLElement,
  colorMode: "light" | "dark"
) {
  const overlay = deck.closest<HTMLElement>('[data-testid="slides-overlay"]');
  expect(overlay).not.toBeNull();

  await waitFor(() => {
    const styles = getComputedStyle(overlay!);
    expect(document.documentElement.classList.contains("dark")).toBe(
      colorMode === "dark"
    );
    expect(styles.getPropertyValue("--slides-background").trim()).toBe(
      styles.getPropertyValue("--background-primary").trim()
    );
    expect(styles.getPropertyValue("--slides-foreground").trim()).toBe(
      styles.getPropertyValue("--text-normal").trim()
    );
  });
}
