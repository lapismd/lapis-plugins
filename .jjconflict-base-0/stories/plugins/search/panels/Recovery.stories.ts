import type { App } from "@lapis-notes/api";
import { SearchPanel } from "@lapis-notes/search";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SearchPanelDemo from "./SearchPanelDemo.svelte";
import { panelDemoApp } from "../../_shared/panels/panel-story-helpers";

const meta = {
  title: "Plugins/Search/Panels/Recovery",
  component: SearchPanel,
  tags: ["visual-pending", "test", "!autodocs"],
} satisfies Meta<typeof SearchPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RecoveredSettings: Story = {
  render: () => ({
    Component: SearchPanelDemo,
    props: { layout: "left-sidebar", diagnostics: "none" },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-search-placement-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30000 },
    );
    const app: App = panelDemoApp(canvasElement);
    const canvas = within(canvasElement);
    const query = canvas.getByRole("searchbox", { name: "Search vault" });
    await userEvent.type(query, "Welcome");
    await userEvent.click(
      canvas.getByRole("button", { name: "Expand filter options" }),
    );
    await waitFor(() =>
      expect(
        app.configuration.getPluginData("search")?.view?.recentSearches,
      ).toContain("Welcome"),
    );
    const recovered = app.configuration.getPluginData("search");
    recovered.view.showMoreContext = true;
    recovered.view.matchCase = false;
    await app.configuration.updatePluginData("search", recovered, {
      origin: "external-reload",
    });
    await waitFor(() =>
      expect(
        canvas.getByRole("switch", {
          name: "Show more context",
        }),
      ).toHaveAttribute("aria-checked", "true"),
    );
    await expect(query).toHaveTextContent("Welcome");
    await userEvent.click(
      canvas.getByRole("switch", { name: "Collapse results" }),
    );
    expect(app.configuration.getPluginData("search").view).toMatchObject({
      showMoreContext: true,
      matchCase: false,
      collapseResults: false,
    });
  },
};
