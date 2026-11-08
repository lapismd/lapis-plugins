import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import BasesEditorShellDemo from "./shell/ShellDemo.svelte";
import type { BasesViewScenario } from "./bases-views-fixture";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";

const registrySource = pluginWorkspaceSource(
  "@lapis-notes/bases",
  "BasesPlugin",
);

const meta = {
  title: "Plugins/Bases/Registry Screenshots",
  component: BasesEditorShellDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "App-backed Bases views showing filters, cards, and grouped lists in the Lapis workspace.",
      },
    },
  },
} satisfies Meta<typeof BasesEditorShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function waitForScenario(
  canvasElement: HTMLElement,
  scenario: BasesViewScenario,
  selector: string,
) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("bases-editor-shell-status")).toHaveTextContent(
        "ready",
      );
      expect(canvas.getByTestId("bases-editor-shell-demo")).toHaveAttribute(
        "data-focus-mode",
        "true",
      );
      expect(canvasElement.querySelector(selector)).toBeVisible();
      const leftSidebar = canvasElement.querySelector<HTMLElement>(
        '[data-workspace-surface="left-sidebar"]',
      );
      expect(leftSidebar?.getBoundingClientRect().width ?? 0).toBe(0);
      expect(
        canvas.getByRole("button", { name: "Open left sidebar" }),
      ).toBeVisible();
    },
    { timeout: 20_000 },
  );
  expect(canvas.getByTestId("bases-editor-shell-demo")).toHaveAttribute(
    "data-scenario",
    scenario,
  );
  return canvas;
}

function focusedArgs(scenario: BasesViewScenario) {
  return { scenario, focusMode: true, fixtureProfile: "registry" } as const;
}

export const FilterOptions: Story = {
  name: "Filter options",
  parameters: registryStoryParameters(
    registrySource,
    "A table view opens the filter builder with a Status condition.",
  ),
  args: focusedArgs("filter-options"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForScenario(
      canvasElement,
      "filter-options",
      '[data-ui-component="bases-table-view"]',
    );
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="bases-table-view"] [data-ui-part="scroll-area-viewport"]',
    )!;
    await waitFor(() => {
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
      expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    });
    viewport.scrollTop = 300;
    viewport.scrollLeft = 160;
    await waitFor(() => {
      expect(viewport.scrollTop).toBeGreaterThan(0);
      expect(viewport.scrollLeft).toBeGreaterThan(0);
    });
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
    await userEvent.click(canvas.getByRole("button", { name: "Filter" }));
    const filterPopover = await waitFor(() => {
      const current =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          '[data-bases-popover="filter"][data-state="open"]',
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
  parameters: registryStoryParameters(
    registrySource,
    "A card view renders note covers and property-driven content.",
  ),
  args: focusedArgs("cards"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForScenario(
      canvasElement,
      "cards",
      '[data-ui-component="bases-card-view"]',
    );
    await waitFor(() => {
      const cards = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="bases-card-view"]',
      )!;
      expect(within(cards).getByText("Northstar Roadmap.md")).toBeVisible();
      const images = [
        ...canvasElement.querySelectorAll<HTMLElement>(".bases-card__image"),
      ];
      expect(images.length).toBeGreaterThan(0);
      expect(
        images.every(
          (image) => Math.abs(image.getBoundingClientRect().height - 103.5) < 1,
        ),
      ).toBe(true);
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="bases-card-view"] [data-ui-part="scroll-area-viewport"]',
      )!;
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
      expect(viewport.scrollTop).toBe(0);
      expect(
        images.every((image) => image.style.backgroundImage.includes("blob:")),
      ).toBe(true);
    });
    const cards = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="bases-card-view"]',
    )!;
    const viewport = cards.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    )!;
    viewport.scrollTop = viewport.scrollHeight;
    await waitFor(() =>
      expect(within(cards).getByText("Elm Volunteer Portal.md")).toBeVisible(),
    );
    viewport.scrollTop = 0;
    await waitFor(() =>
      expect(within(cards).getByText("Northstar Roadmap.md")).toBeVisible(),
    );
  },
};

export const Overview: Story = {
  name: "Overview",
  parameters: registryStoryParameters(
    registrySource,
    "The focused Bases workspace presents the card view as an end-to-end plugin overview.",
  ),
  args: focusedArgs("cards"),
  play: CoverCards.play,
};

export const GroupedList: Story = {
  name: "Grouped list",
  parameters: registryStoryParameters(
    registrySource,
    "A list view groups notes by Status and exposes its sort configuration.",
  ),
  args: focusedArgs("grouped-list"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForScenario(
      canvasElement,
      "grouped-list",
      '[data-ui-component="bases-list-view"]',
    );
    expect(
      canvasElement.querySelectorAll('[data-ui-part="group-toggle"]').length,
    ).toBeGreaterThanOrEqual(2);
    await userEvent.click(
      canvas.getByRole("button", { name: "Sort", exact: true }),
    );
    const sortPopover = await waitFor(() => {
      const current =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          '[data-bases-popover="sort"][data-state="open"]',
        );
      expect(current).toBeVisible();
      return current!;
    });
    const sort = within(sortPopover);
    expect(sort.getByText("Group by")).toBeVisible();
    expect(sort.getByText("Status")).toBeVisible();
    expect(
      sort.getByRole("combobox", { name: "Group sort direction" }),
    ).toBeVisible();
    expect(
      sort.getByRole("combobox", { name: "Project sort direction" }),
    ).toBeVisible();
  },
};

export const Kanban: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "A configurable Markdown board shows role summaries, metadata and follow-up stamps.",
  ),
  args: focusedArgs("kanban-roles"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForScenario(
      canvasElement,
      "kanban-roles",
      '[data-ui-component="kanban-board"]',
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("button", {
          name: /Open card: Engineering Manager, Infrastructure/,
        }),
      ).toBeVisible(),
    );
  },
};

export const Activity: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "A dated activity timeline renders the same Markdown records with sticky day headings.",
  ),
  args: focusedArgs("activity"),
  play: async ({ canvasElement }) => {
    await waitForScenario(
      canvasElement,
      "activity",
      '[data-ui-component="kanban-activity"]',
    );
    expect(
      canvasElement.querySelectorAll('[data-ui-part="scroll-area-viewport"]')
        .length,
    ).toBeGreaterThan(0);
  },
};
