import type { Preview } from "@storybook/svelte-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { syncCatalogStoryLayout } from "@lapismd/design-core/storybook/catalog-layout";
import "@lapismd/design-core/storybook.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import "../stories/workspace/docs.css";

const preview: Preview = {
  tags: ["autodocs", "test"],
  globalTypes: {
    theme: {
      description: "Brand theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "lapis", title: "Lapis" },
          { value: "default", title: "Default" },
        ],
        dynamicTitle: true,
      },
    },
  },
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
            "Slides",
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
  beforeEach: async () => {
    if (typeof document === "undefined" || document.fonts == null) return;

    const requiredFonts = [
      '16px "DM Sans Variable"',
      '16px "Source Code Pro Variable"',
    ];
    await Promise.all(requiredFonts.map((font) => document.fonts.load(font)));
    await document.fonts.ready;

    const rootStyles = getComputedStyle(document.documentElement);
    const sansFamily = rootStyles.getPropertyValue("--font-sans");
    const monoFamily = rootStyles.getPropertyValue("--studio-font-mono");
    const missingFonts = requiredFonts.filter(
      (font) => !document.fonts.check(font),
    );
    if (
      !sansFamily.includes("DM Sans Variable") ||
      !monoFamily.includes("Source Code Pro Variable") ||
      missingFonts.length > 0
    ) {
      throw new Error(
        `Storybook catalog fonts are unresolved (sans=${JSON.stringify(sansFamily)}, mono=${JSON.stringify(monoFamily)}, missing=${missingFonts.join(", ") || "none"}).`,
      );
    }
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
