import {
  defineConfig,
  singleIdVerification,
  tableRequirements,
} from "@lapismd/spec-validator";

const packages = [
  "ai",
  "bases",
  "bookmarks",
  "canvas",
  "community",
  "csv",
  "docx",
  "graph",
  "history",
  "markdown",
  "markdown-lint",
  "pdf",
  "search",
  "slides",
  "source-editor",
  "spellcheck",
  "sync",
  "transcripts",
  "wordcount",
];

export default defineConfig(tableRequirements(), {
  name: "lapis-plugins",
  idPattern: /^(?:LN-[A-Z-]+|LP-SPEC)-\d{3}$/,
  ruleIds: {
    summary: "LP-SPEC-001",
    governance: "LP-SPEC-003",
    verification: "LP-SPEC-003",
    book: "LP-SPEC-001",
    bookIgnore: "LP-SPEC-001",
    specFirst: "LP-SPEC-002",
    internal: "LP-SPEC-003",
    qmd: "LP-SPEC-001",
    storybookCatalog: "LP-SPEC-045",
  },
  diagnostics: {
    "STORYBOOK-PARITY": "LP-SPEC-054",
    "STORYBOOK-DOCS-CONTRACT": "LP-SPEC-044",
    "STORYBOOK-DOCS-COMPONENT": "LP-SPEC-046",
    "STORYBOOK-DOCS-DESCRIPTION": "LP-SPEC-046",
    "STORYBOOK-DOCS-PROPERTIES": "LP-SPEC-046",
    "SPEC-STORY-SOURCE-BOUNDARY": "LP-SPEC-045",
    "SPEC-STORY-SOURCE-FIELDS": "LP-SPEC-045",
    "SPEC-STORY-SOURCE-MISSING": "LP-SPEC-045",
  },
  validators: {
    summary: true,
    governance: {
      acceptance: false,
      normative: true,
      proseLimits: false,
      references: false,
      changeMap: false,
    },
    verification: singleIdVerification({
      files: ["^(?:verification|native-verification)\\.md$"],
      headers: {
        ids: ["ID"],
        status: ["Status"],
        evidence: ["Evidence"],
        required: [],
      },
      statuses: ["Implemented", "In progress", "Planned", "Visual pending"],
    }),
    book: true,
    qmd: {
      collection: "lapis-plugins-spec",
      configPath: ".qmd/index.yml",
    },
    storybookCatalog: {
      roots: ["stories"],
      packageRoots: ["packages"],
      storyOnlyName: "(?:Demo|Harness|Fixture)$",
      forbiddenSource:
        "\\b(?:PanelDemo|[A-Z][A-Za-z0-9]*(?:Demo|Harness|Fixture))\\b|\\bargs\\s*\\.",
      plainTextLanguages: [],
    },
    specFirst: {
      mode: "mapped",
      canonicalPattern:
        "^spec/src/(?!SUMMARY\\.md$|(?:native-)?verification\\.md$).+\\.md$",
      ignore: [
        "(^|/)node_modules/",
        "(^|/)(?:dist|build|storybook-static|\\.svelte-kit|\\.turbo|\\.release)/",
        "^spec/book/",
        "^spec/src/(?:SUMMARY|(?:native-)?verification)\\.md$",
        "\\.(?:spec|test)\\.[cm]?[jt]sx?$",
        "\\.stories\\.(?:svelte|[cm]?[jt]sx?)$",
      ],
      rules: [
        {
          pattern: "^crates/lapis-plugin-services/",
          chapters: ["spec/src/native-services.md"],
        },
        ...packages.map((name) => ({
          pattern: `^packages/${name}/`,
          chapters: [`spec/src/plugins/${name}/index.md`],
        })),
        ...packages.map((name) => ({
          pattern: `^stories/plugins/${name}/`,
          chapters: [`spec/src/plugins/${name}/index.md`],
        })),
        {
          pattern: "^stories/(?:catalog/|plugins/_shared/|workspace/)",
          chapters: [
            "spec/src/distribution.md",
            "spec/src/spec-governance.md",
            "spec/src/native-services.md",
          ],
        },
        {
          pattern:
            "^(?:package\\.json$|pnpm-|turbo\\.json$|svelte\\.config\\.js$|vitest\\.config\\.ts$|\\.storybook/|\\.changeset/|\\.github/|scripts/|patches/|README\\.md$|RELEASING\\.md$|AGENTS\\.md$|spec-validator\\.config\\.mjs$)",
          chapters: [
            "spec/src/distribution.md",
            "spec/src/spec-governance.md",
            "spec/src/native-services.md",
          ],
        },
      ],
      protected: [
        "^crates/lapis-plugin-services/",
        "^(?:packages/|stories/|package\\.json$|pnpm-|turbo\\.json$|svelte\\.config\\.js$|vitest\\.config\\.ts$|\\.storybook/|\\.changeset/|\\.github/|scripts/|patches/|README\\.md$|RELEASING\\.md$|AGENTS\\.md$|spec-validator\\.config\\.mjs$)",
      ],
    },
  },
  plugins: [
    "scripts/spec-validation/storybook-parity.mjs",
    "scripts/spec-validation/storybook-docs-audit.mjs",
  ],
});
