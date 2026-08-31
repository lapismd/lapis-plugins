const SHARED_PARAMETERS_FILE = "stories/workspace/docs-parameters.ts";
const SHARED_STYLES_FILE = "stories/workspace/docs.css";
const PREVIEW_FILE = ".storybook/preview.ts";
const SLIDES_DECKS_FILE = "stories/plugins/slides/Decks.stories.ts";
const FULL_WORKSPACE_STORY_INVENTORY = [
  "stories/plugins/ai/shell/Shell.stories.ts",
  "stories/plugins/bases/BasesViews.stories.ts",
  "stories/plugins/bases/BasesWorkflows.stories.ts",
  "stories/plugins/bases/Embeds.stories.ts",
  "stories/plugins/bases/shell/Lifecycle.stories.ts",
  "stories/plugins/bases/shell/Shell.stories.ts",
  "stories/plugins/history/Compare.stories.ts",
  "stories/plugins/history/shell/Shell.stories.ts",
  SLIDES_DECKS_FILE,
];

function lineFor(source, token) {
  const index = source.indexOf(token);
  return index < 0 ? 1 : source.slice(0, index).split("\n").length;
}

function finding(file, line, message) {
  return {
    code: "STORYBOOK-DOCS-CONTRACT",
    file,
    line,
    message,
  };
}

export function fullWorkspaceStoryFiles(
  trackedFiles,
  inventory = FULL_WORKSPACE_STORY_INVENTORY
) {
  return [
    ...new Set([
      ...inventory,
      ...trackedFiles.filter(
        (file) =>
          /^stories\/plugins\/[^/]+\/RegistryScreenshots\.stories\.ts$/.test(
            file
          ) || /^stories\/plugins\/[^/]+\/panels\/.+\.stories\.ts$/.test(file)
      ),
    ]),
  ].sort();
}

export function auditStorybookDocs({
  trackedFiles,
  readOptional,
  inventory = FULL_WORKSPACE_STORY_INVENTORY,
}) {
  const findings = [];

  for (const file of fullWorkspaceStoryFiles(trackedFiles, inventory)) {
    const source = readOptional(file);
    if (source === null) {
      findings.push(
        finding(file, 1, "governed full-workspace story source is missing")
      );
      continue;
    }
    if (source.includes('"!autodocs"')) continue;

    const requiresDirectSharedParameters =
      file === SLIDES_DECKS_FILE ||
      /\/RegistryScreenshots\.stories\.ts$/.test(file);
    const recognizedContract = [
      "docs: WORKSPACE_SHELL_DOCS_PARAMETERS",
      "WORKSPACE_SHELL_DOCS_STORY",
      "PANEL_DOCS_PARAMETERS",
    ].some((token) => source.includes(token));

    if (
      requiresDirectSharedParameters &&
      !source.includes("WORKSPACE_SHELL_DOCS_PARAMETERS")
    ) {
      findings.push(
        finding(
          file,
          lineFor(source, "parameters:"),
          "full-workspace Autodocs must import the shared Docs parameters"
        )
      );
    }
    if (
      requiresDirectSharedParameters &&
      !source.includes("docs: WORKSPACE_SHELL_DOCS_PARAMETERS")
    ) {
      findings.push(
        finding(
          file,
          lineFor(source, "parameters:"),
          "full-workspace Autodocs must apply the shared Docs parameters"
        )
      );
    }
    if (!requiresDirectSharedParameters && !recognizedContract) {
      findings.push(
        finding(
          file,
          lineFor(source, "parameters:"),
          "full-workspace Autodocs must apply a governed isolated 700px Docs contract"
        )
      );
    }
  }

  const parameters = readOptional(SHARED_PARAMETERS_FILE);
  const requiredParameterTokens = [
    '"workspace-shell-docs-canvas"',
    'height: "700px"',
    "inline: false",
    "WORKSPACE_SHELL_DOCS_PARAMETERS",
    "canvas: { className: WORKSPACE_SHELL_DOCS_CANVAS_CLASS }",
    "story: WORKSPACE_SHELL_DOCS_STORY",
  ];
  if (
    parameters === null ||
    requiredParameterTokens.some((token) => !parameters.includes(token))
  ) {
    findings.push(
      finding(
        SHARED_PARAMETERS_FILE,
        1,
        "shared Docs parameters must provide the padding scope and isolated 700px story"
      )
    );
  }

  const styles = readOptional(SHARED_STYLES_FILE);
  if (
    styles === null ||
    !styles.includes(".workspace-shell-docs-canvas .docs-story .sb-story") ||
    !styles.includes("padding: 0")
  ) {
    findings.push(
      finding(
        SHARED_STYLES_FILE,
        1,
        "shared full-workspace Docs styles must remove the story wrapper padding"
      )
    );
  }

  const preview = readOptional(PREVIEW_FILE);
  if (
    preview === null ||
    !preview.includes('import "../stories/workspace/docs.css"')
  ) {
    findings.push(
      finding(
        PREVIEW_FILE,
        1,
        "Storybook preview must install the shared full-workspace Docs styles"
      )
    );
  }

  return findings;
}

function rule(context, code) {
  const mapped = context.config.diagnostics[code];
  if (!mapped) throw new Error(`missing diagnostic mapping for ${code}`);
  return mapped;
}

export const name = "storybookDocsAudit";

export function validate(context) {
  return auditStorybookDocs({
    trackedFiles: context.trackedFiles,
    readOptional(file) {
      return context.readOptional(`${context.model.repoRoot}/${file}`);
    },
  }).map((entry) => ({ ...entry, rule: rule(context, entry.code) }));
}
