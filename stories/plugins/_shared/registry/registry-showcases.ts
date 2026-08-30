export type RegistryShowcaseKind =
  | "chat"
  | "table"
  | "list"
  | "graph"
  | "history"
  | "editor"
  | "diagnostics"
  | "search"
  | "writing";

export interface RegistryShowcaseModel {
  pluginId: string;
  name: string;
  mark: string;
  description: string;
  accent: string;
  kind: RegistryShowcaseKind;
  previewTitle: string;
  features: [string, string, string];
}

export const registryShowcases = {
  ai: {
    pluginId: "ai",
    name: "AI",
    mark: "AI",
    description: "Work with provider-neutral agents while Lapis keeps the conversation.",
    accent: "#A855F7",
    kind: "chat",
    previewTitle: "Project assistant",
    features: ["Portable transcripts", "Tool review", "ACP agents"],
  },
  bases: {
    pluginId: "bases",
    name: "Bases",
    mark: "BA",
    description: "Turn ordinary notes into editable, structured views of your vault.",
    accent: "#14B8A6",
    kind: "table",
    previewTitle: "Active projects",
    features: ["Live filters", "Editable fields", "Markdown backed"],
  },
  bookmarks: {
    pluginId: "bookmarks",
    name: "Bookmarks",
    mark: "BK",
    description: "Keep files, folders, searches, and groups close at hand.",
    accent: "#E11D48",
    kind: "list",
    previewTitle: "Bookmarks",
    features: ["Saved searches", "Nested groups", "Fast navigation"],
  },
  graph: {
    pluginId: "lapis-graph",
    name: "Graph",
    mark: "GR",
    description: "Explore the relationships between notes, tags, and attachments.",
    accent: "#8B5CF6",
    kind: "graph",
    previewTitle: "Vault graph",
    features: ["Global and local", "Interactive forces", "Time-lapse"],
  },
  history: {
    pluginId: "history",
    name: "History",
    mark: "HI",
    description: "Review, compare, and restore bounded local revisions.",
    accent: "#6366F1",
    kind: "history",
    previewTitle: "Welcome.md history",
    features: ["Local revisions", "Visual compare", "Safe restore"],
  },
  markdown: {
    pluginId: "markdown",
    name: "Markdown",
    mark: "MD",
    description: "Write in source, live preview, or reading mode with Mira.",
    accent: "#2563EB",
    kind: "editor",
    previewTitle: "Welcome to Lapis",
    features: ["Three edit modes", "Rich embeds", "Portable files"],
  },
  markdownLint: {
    pluginId: "lapis-markdown-lint",
    name: "Markdown Lint",
    mark: "ML",
    description: "Catch Markdown issues early and apply focused code actions.",
    accent: "#F97316",
    kind: "diagnostics",
    previewTitle: "Markdown diagnostics",
    features: ["Inline issues", "Quick fixes", "Vault rules"],
  },
  search: {
    pluginId: "search",
    name: "Search",
    mark: "SR",
    description: "Find file names, metadata, tags, and note content together.",
    accent: "#F59E0B",
    kind: "search",
    previewTitle: "Search your vault",
    features: ["Rich facets", "Indexed results", "Agent tools"],
  },
  sourceEditor: {
    pluginId: "lapis-source-editor",
    name: "Source Editor",
    mark: "SE",
    description: "Edit text, JSON, and YAML with syntax-aware source views.",
    accent: "#0EA5E9",
    kind: "editor",
    previewTitle: "settings.json",
    features: ["Syntax aware", "Workspace routing", "Vault synced"],
  },
  spellcheck: {
    pluginId: "spellcheck",
    name: "Spellcheck",
    mark: "SP",
    description: "Review spelling and grammar suggestions powered by Harper.",
    accent: "#22C55E",
    kind: "diagnostics",
    previewTitle: "Writing suggestions",
    features: ["Private by default", "Custom dictionary", "Dialect aware"],
  },
  wordcount: {
    pluginId: "wordcount",
    name: "Word Count",
    mark: "WC",
    description: "See live word, character, and reading-time estimates.",
    accent: "#06B6D4",
    kind: "writing",
    previewTitle: "Draft overview",
    features: ["Live counts", "Reading time", "Selection aware"],
  },
} satisfies Record<string, RegistryShowcaseModel>;
