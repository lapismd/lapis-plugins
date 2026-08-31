import {
  defineConfig,
  singleIdVerification,
  tableRequirements,
} from "@lapismd/spec-validator";

const packages = [
  "ai",
  "bases",
  "bookmarks",
  "graph",
  "history",
  "markdown",
  "markdown-lint",
  "search",
  "slides",
  "source-editor",
  "spellcheck",
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
      headers: {
        ids: ["ID"],
        status: ["Status"],
        evidence: ["Evidence"],
        required: [],
      },
      statuses: ["Implemented", "In progress", "Planned", "Visual pending"],
    }),
    book: true,
    specFirst: {
      mode: "mapped",
      canonicalPattern: "^spec/src/(?!SUMMARY\\.md$|verification\\.md$).+\\.md$",
      ignore: [
        "(^|/)node_modules/",
        "(^|/)(?:dist|build|storybook-static|\\.svelte-kit|\\.turbo|\\.release)/",
        "^spec/book/",
        "^spec/src/(?:SUMMARY|verification)\\.md$",
        "\\.(?:spec|test)\\.[cm]?[jt]sx?$",
        "\\.stories\\.(?:svelte|[cm]?[jt]sx?)$",
      ],
      rules: [
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
          chapters: ["spec/src/distribution.md", "spec/src/spec-governance.md"],
        },
        {
          pattern: "^(?:package\\.json$|pnpm-|turbo\\.json$|svelte\\.config\\.js$|vitest\\.config\\.ts$|\\.storybook/|\\.changeset/|\\.github/|scripts/|README\\.md$|RELEASING\\.md$|AGENTS\\.md$|spec-validator\\.config\\.mjs$)",
          chapters: ["spec/src/distribution.md", "spec/src/spec-governance.md"],
        },
      ],
      protected: [
        "^(?:packages/|stories/|package\\.json$|pnpm-|turbo\\.json$|svelte\\.config\\.js$|vitest\\.config\\.ts$|\\.storybook/|\\.changeset/|\\.github/|scripts/|README\\.md$|RELEASING\\.md$|AGENTS\\.md$|spec-validator\\.config\\.mjs$)",
      ],
    },
  },
});
