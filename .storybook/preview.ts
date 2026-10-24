import type { Preview } from "@storybook/svelte-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { syncCatalogStoryLayout } from "@lapismd/design-core/storybook/catalog-layout";
import { createControllerConnectionBridge } from "./controller-connection-bridge";
import { waitForCatalogFonts } from "./catalog-fonts.mjs";
import "@lapismd/design-core/storybook.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import "../stories/workspace/docs.css";

// Live controller attach is opt-in. Storybook never starts the host. Register
// through the desktop-bridge global so preview does not import the API barrel.
const controllerUrl = (import.meta.env as { LAPIS_AGENT_RUNTIME_URL?: string })
  .LAPIS_AGENT_RUNTIME_URL;
const controllerToken = (
  import.meta.env as { LAPIS_AGENT_RUNTIME_TOKEN?: string }
).LAPIS_AGENT_RUNTIME_TOKEN;
const native = globalThis as { __LAPIS_NATIVE_DESKTOP__?: unknown };
if (!native.__LAPIS_NATIVE_DESKTOP__ && controllerUrl && controllerToken) {
  native.__LAPIS_NATIVE_DESKTOP__ = createControllerConnectionBridge({
    url: controllerUrl,
    token: controllerToken,
  });
}

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
            "Transcripts",
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

    await waitForCatalogFonts(document.fonts);

    const rootStyles = getComputedStyle(document.documentElement);
    const sansFamily = rootStyles.getPropertyValue("--font-sans");
    const monoFamily = rootStyles.getPropertyValue("--studio-font-mono");
    if (
      !sansFamily.includes("DM Sans Variable") ||
      !monoFamily.includes("Source Code Pro Variable")
    ) {
      throw new Error(
        `Storybook catalog font tokens are unresolved (sans=${JSON.stringify(sansFamily)}, mono=${JSON.stringify(monoFamily)}).`,
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
