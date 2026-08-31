import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import BasesEditorShellDemo from "./shell/ShellDemo.svelte";
import type { BasesViewScenario } from "./bases-views-fixture";

const meta = {
  title: "Plugins/Bases/Registry Screenshots",
  component: BasesEditorShellDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BasesEditorShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function waitForScenario(
  canvasElement: HTMLElement,
  scenario: BasesViewScenario,
  selector: string
) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("bases-editor-shell-status")).toHaveTextContent(
        "ready"
      );
      expect(canvas.getByTestId("bases-editor-shell-demo")).toHaveAttribute(
        "data-focus-mode",
        "true"
      );
      expect(canvasElement.querySelector(selector)).toBeVisible();
      const leftSidebar = canvasElement.querySelector<HTMLElement>(
        '[data-workspace-surface="left-sidebar"]'
      );
      expect(leftSidebar?.getBoundingClientRect().width ?? 0).toBeLessThan(2);
    },
    { timeout: 20_000 }
  );
  expect(canvas.getByTestId("bases-editor-shell-demo")).toHaveAttribute(
    "data-scenario",
    scenario
  );
  return canvas;
}

function focusedArgs(scenario: BasesViewScenario) {
  return { scenario, focusMode: true } as const;
}

export const FilterOptions: Story = {
  name: "Filter options",
  args: focusedArgs("filter-options"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForScenario(
      canvasElement,
      "filter-options",
      '[data-ui-component="bases-table-view"]'
    );
    await userEvent.click(canvas.getByRole("button", { name: "Filter" }));
    const filterPopover = await waitFor(() => {
      const current =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          '[data-bases-popover="filter"][data-state="open"]'
        );
      expect(current).toBeVisible();
      return current!;
    });
    const filter = within(filterPopover);
    expect(filter.getByText("This view")).toBeVisible();
    expect(filter.getByText("Status")).toBeVisible();
    expect(filter.getByDisplayValue("Active")).toBeVisible();
  },
};

export const CoverCards: Story = {
  name: "Cover cards",
  args: focusedArgs("cards"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForScenario(
      canvasElement,
      "cards",
      '[data-ui-component="bases-card-view"]'
    );
    await waitFor(() => {
      expect(canvas.getByText("Aurora.md")).toBeVisible();
      const images = [
        ...canvasElement.querySelectorAll<HTMLElement>(".bases-card__image"),
      ];
      expect(images).toHaveLength(3);
      expect(
        images.every((image) => image.style.backgroundImage.includes("blob:"))
      ).toBe(true);
    });
  },
};

export const Overview: Story = {
  name: "Overview",
  args: focusedArgs("cards"),
  play: CoverCards.play,
};

export const GroupedList: Story = {
  name: "Grouped list",
  args: focusedArgs("grouped-list"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForScenario(
      canvasElement,
      "grouped-list",
      '[data-ui-component="bases-list-view"]'
    );
    expect(
      canvasElement.querySelectorAll('[data-ui-part="group-toggle"]').length
    ).toBeGreaterThanOrEqual(2);
    await userEvent.click(
      canvas.getByRole("button", { name: "Sort", exact: true })
    );
    const sortPopover = await waitFor(() => {
      const current =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          '[data-bases-popover="sort"][data-state="open"]'
        );
      expect(current).toBeVisible();
      return current!;
    });
    const sort = within(sortPopover);
    expect(sort.getByText("Group by")).toBeVisible();
    expect(sort.getByText("Status")).toBeVisible();
  },
};
