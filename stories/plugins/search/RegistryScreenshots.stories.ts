import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Search/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: WORKSPACE_SHELL_DOCS_PARAMETERS,
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function renderSearch(): NonNullable<Story["render"]> {
  return (() => ({
    Component: PanelDemo,
    props: {
      kind: "search",
      layout: "left-sidebar",
      diagnostics: "none",
    },
  })) as NonNullable<Story["render"]>;
}

async function populateSearch(canvasElement: HTMLElement) {
  await registryPanelApp(canvasElement);
  await waitForRegistrySurface(canvasElement, '[data-testid="search-panel"]');
  const panelElement = canvasElement.querySelector<HTMLElement>(
    '[data-testid="search-panel"]'
  );
  if (!panelElement) throw new Error("Registry Search panel is missing");
  const panel = within(panelElement);
  const searchbox = panel.getByRole("searchbox", { name: "Search vault" });
  await userEvent.click(searchbox);
  await userEvent.type(searchbox, "project");
  await waitFor(
    () => {
      const resultFiles = panel
        .getAllByRole("treeitem")
        .filter((item) => item.getAttribute("aria-level") === "1");
      expect(resultFiles.length).toBeGreaterThanOrEqual(3);
      expect(panel.getByText(/results/)).toBeVisible();
    },
    { timeout: 20_000 }
  );
  return panel;
}

export const SearchSidebar: Story = {
  name: "Populated Search sidebar",
  render: renderSearch(),
  play: async ({ canvasElement }) => {
    const panel = await populateSearch(canvasElement);
    const firstResult = panel
      .getAllByRole("treeitem")
      .find((item) => item.getAttribute("aria-level") === "1");
    expect(firstResult).toBeDefined();
    if (firstResult?.getAttribute("aria-expanded") === "false") {
      await userEvent.click(firstResult);
    }
    await waitFor(() => {
      expect(
        panel
          .getAllByRole("treeitem")
          .some((item) => item.getAttribute("aria-level") === "2")
      ).toBe(true);
    });
  },
};

export const SearchFilters: Story = {
  name: "Search filters",
  render: renderSearch(),
  play: async ({ canvasElement }) => {
    const panel = await populateSearch(canvasElement);
    await userEvent.click(
      panel.getByRole("button", { name: "Expand filter options" })
    );
    expect(
      panel.getByRole("region", { name: "Search view settings" })
    ).toBeVisible();
    expect(
      panel.getByRole("button", { name: "Filter by file type" })
    ).toBeVisible();
  },
};

export const Overview: Story = {
  name: "Overview",
  render: SearchSidebar.render,
  play: SearchSidebar.play,
};
