import { rendererHostModulePattern } from "./lib/svelte-runtime-contract.mjs";
import { readFileSync } from "node:fs";

const allPluginPackages = [
  { directory: "ai", packageName: "@lapis-notes/ai", pluginId: "ai" },
  { directory: "bases", packageName: "@lapis-notes/bases", pluginId: "bases" },
  {
    directory: "bookmarks",
    packageName: "@lapis-notes/bookmarks",
    pluginId: "bookmarks",
  },
  {
    directory: "community",
    packageName: "@lapis-notes/community",
    pluginId: "community",
  },
  {
    directory: "graph",
    packageName: "@lapis-notes/graph",
    pluginId: "lapis-graph",
  },
  {
    directory: "history",
    packageName: "@lapis-notes/history",
    pluginId: "history",
  },
  {
    directory: "markdown",
    packageName: "@lapis-notes/markdown",
    pluginId: "markdown",
  },
  {
    directory: "markdown-lint",
    packageName: "@lapis-notes/markdown-lint",
    pluginId: "lapis-markdown-lint",
  },
  {
    directory: "search",
    packageName: "@lapis-notes/search",
    pluginId: "search",
  },
  {
    directory: "slides",
    packageName: "@lapis-notes/slides",
    pluginId: "lapis-slides",
  },
  {
    directory: "source-editor",
    packageName: "@lapis-notes/source-editor",
    pluginId: "lapis-source-editor",
  },
  {
    directory: "spellcheck",
    packageName: "@lapis-notes/spellcheck",
    pluginId: "spellcheck",
  },
  {
    directory: "wordcount",
    packageName: "@lapis-notes/wordcount",
    pluginId: "wordcount",
  },
  {
    directory: "sync",
    packageName: "@lapis-notes/lapis-plugin-sync",
    pluginId: "sync",
  },
];

// The standard npm private flag is the authoritative parked-package marker.
export const parkedPluginPackages = allPluginPackages.filter(
  (plugin) =>
    JSON.parse(
      readFileSync(
        new URL(
          `../packages/${plugin.directory}/package.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ).private === true,
);
export const pluginPackages = allPluginPackages.filter(
  (plugin) => !parkedPluginPackages.includes(plugin),
);

export function assertReleaseIsActive(release) {
  if (
    parkedPluginPackages.some((plugin) =>
      [
        release.packageName,
        release.pluginId,
        release.releaseTag?.split("@")[0],
      ].some((selector) =>
        [plugin.packageName, plugin.pluginId, plugin.directory].includes(
          selector,
        ),
      ),
    )
  )
    throw new Error(
      "Selected plugin is parked; reactivate it before releasing.",
    );
}

export const packageNames = new Set(
  pluginPackages.map((plugin) => plugin.packageName),
);

export const frameworkPackageVersions = new Map([
  ["@lapis-notes/api", "^0.1.2"],
  ["@lapis-notes/file-explorer", "^0.1.2"],
  ["@lapis-notes/language-service", "^0.1.1"],
  ["@lapis-notes/ui", "^0.1.2"],
  ["@lapis-notes/workspace", "^0.2.0"],
]);

// These editor runtimes exchange class instances, facets and parser node props
// with API editor helpers. Grammar packages remain plugin-local bundles.
export const sharedEditorHostModules = new Map([
  ["@codemirror/autocomplete", "^6.18.6"],
  ["@codemirror/commands", "^6.8.1"],
  ["@codemirror/language", "^6.11.3"],
  ["@codemirror/lint", "^6.8.5"],
  ["@codemirror/search", "^6.5.11"],
  ["@codemirror/state", "^6.6.0"],
  ["@codemirror/view", "^6.42.1"],
  ["@lezer/common", "^1.5.2"],
  ["@lezer/highlight", "^1.2.3"],
  ["@lezer/lr", "^1.4.2"],
]);

export const approvedWorkspaceHostModules = [
  rendererHostModulePattern,
  ...[...sharedEditorHostModules.keys()].map(
    (specifier) => new RegExp(`^${specifier.replaceAll("/", "\\/")}$`),
  ),
  /^@lapis-notes\/api(?:\/.*)?$/,
  /^@lapis-notes\/markdown(?:\/.*)?$/,
];

export function pluginPackageBySelector(selector) {
  return pluginPackages.find(
    (plugin) =>
      plugin.directory === selector ||
      plugin.packageName === selector ||
      plugin.pluginId === selector,
  );
}
