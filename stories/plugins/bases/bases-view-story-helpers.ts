import type { App } from "@lapis-notes/api";
import { BasesViewSurface, type BasesDocument } from "@lapis-notes/bases";
import type { StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { basesViewsExampleSource } from "./BasesViews.example-sources";
import BasesViewsDemo from "./BasesViewsDemo.svelte";
import type { BasesViewScenario } from "./bases-views-fixture";
type StoryRender = NonNullable<StoryObj<typeof BasesViewSurface>["render"]>;
export function renderScenario(scenario: BasesViewScenario): StoryRender {
  return (() => ({
    Component: BasesViewsDemo,
    props: { scenario },
  })) as StoryRender;
}

export function storyParameters(
  scenario: BasesViewScenario,
  description: string,
) {
  const catalogId = `plugins-bases-views-${scenario}`;
  return {
    ...workspaceCatalogParameters(catalogId),
    docs: {
      description: { story: description },
      source: {
        code: basesViewsExampleSource(scenario),
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        `/visual-baselines/stories/plugins/bases/views-${scenario}-chromium.png`,
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  };
}

export function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="bases-views-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The Bases views story has no active Lapis app");
  }
  return root.__lapisApp;
}

export function demoDocument(canvasElement: HTMLElement): BasesDocument {
  const root = canvasElement.querySelector<
    HTMLElement & { __basesDocument?: BasesDocument }
  >('[data-testid="bases-views-demo"]');
  if (!root?.__basesDocument) {
    throw new Error("The Bases views story has no active document");
  }
  return root.__basesDocument;
}

export async function waitForView(
  canvasElement: HTMLElement,
  scenario: BasesViewScenario,
  type: string,
) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("bases-views-status")).toHaveTextContent(
        "ready",
      );
      expect(
        canvasElement.querySelector(
          `[data-ui-component="bases-view"][data-type="${type}"]`,
        ),
      ).toBeInTheDocument();
    },
    { timeout: 20_000 },
  );
  expect(canvas.getByTestId("bases-views-demo")).toHaveAttribute(
    "data-scenario",
    scenario,
  );
  expect(demoApp(canvasElement).plugins.isPluginEnabled("bases")).toBe(true);
  return canvas;
}
