export const pluginPackages = [
  { directory: "ai", packageName: "@lapis-notes/ai", pluginId: "ai" },
  { directory: "bases", packageName: "@lapis-notes/bases", pluginId: "bases" },
  {
    directory: "bookmarks",
    packageName: "@lapis-notes/bookmarks",
    pluginId: "bookmarks",
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
];

export const packageNames = new Set(
  pluginPackages.map((plugin) => plugin.packageName),
);

export const frameworkPackageVersions = new Map([
  ["@lapis-notes/api", "^0.1.0"],
  ["@lapis-notes/file-explorer", "^0.1.0"],
  ["@lapis-notes/language-service", "^0.1.0"],
  ["@lapis-notes/ui", "^0.1.0"],
  ["@lapis-notes/workspace", "^0.1.0"],
]);

export const approvedWorkspaceHostModules = [
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
