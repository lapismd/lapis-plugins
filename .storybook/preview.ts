import type { Preview } from "@storybook/svelte-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { syncCatalogStoryLayout } from "@lapismd/design-core/storybook/catalog-layout";
import "@lapismd/design-core/storybook.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";

const preview: Preview = {
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i } },
    docs: { toc: true },
    options: {
      storySort: {
        order: [
          "Plugins",
          [
            "Source Editor",
            "Markdown",
            "Search",
            "Bookmarks",
            "Graph",
            "History",
            "Markdown Lint",
            "Spell Check",
            "Word Count",
            "Bases",
            "AI",
            "*",
          ],
          "*",
        ],
      },
    },
    a11y: {
      test: "error",
      context: { exclude: [".cm-gutters"] },
    },
    backgrounds: { disable: true },
    themes: { disable: true },
  },
  initialGlobals: {
    colorMode: "light",
    theme: "lapis",
  },
  decorators: [
    withThemeByDataAttribute({
      themes: { lapis: "lapis", default: "default" },
      defaultTheme: "lapis",
      attributeName: "data-ui-theme",
    }),
    (story, context) => {
      if (typeof document !== "undefined") {
        syncCatalogStoryLayout(document, context);
        document.documentElement.classList.toggle(
          "dark",
          context.globals.colorMode === "dark",
        );
      }
      return story();
    },
  ],
};

export default preview;
