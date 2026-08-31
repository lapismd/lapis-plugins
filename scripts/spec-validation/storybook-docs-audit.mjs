const SHARED_PARAMETERS_FILE = "stories/workspace/docs-parameters.ts";
const SHARED_STYLES_FILE = "stories/workspace/docs.css";
const PREVIEW_FILE = ".storybook/preview.ts";
const PANEL_HELPER_FILE =
  "stories/plugins/_shared/panels/panel-story-helpers.ts";
const REGISTRY_DOCS_FILE = "stories/plugins/_shared/registry/registry-docs.ts";
const HISTORY_COMPARE_FILE = "stories/plugins/history/Compare.stories.ts";
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

function semanticFinding(code, file, source, token, message) {
  return {
    code,
    file,
    line: lineFor(source, token),
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
    const appliesDirectSharedParameters =
      source.includes("docs: WORKSPACE_SHELL_DOCS_PARAMETERS") ||
      source.includes("...WORKSPACE_SHELL_DOCS_PARAMETERS");
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
    if (requiresDirectSharedParameters && !appliesDirectSharedParameters) {
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

    const isRegistry = /\/RegistryScreenshots\.stories\.ts$/.test(file);
    const isPanel = /\/panels\/.+\.stories\.ts$/.test(file);
    const isComponentDocs = isPanel || file === HISTORY_COMPARE_FILE;

    if (
      (isRegistry || isComponentDocs || file === SLIDES_DECKS_FILE) &&
      !/description:\s*\{\s*component:\s*["'`]/s.test(source)
    ) {
      findings.push(
        semanticFinding(
          "STORYBOOK-DOCS-DESCRIPTION",
          file,
          source,
          "parameters:",
          "Autodocs must provide a non-empty component description"
        )
      );
    }

    if (
      isComponentDocs &&
      !/component:\s*(?![A-Za-z0-9_$]*(?:Demo|Harness|Fixture)\b)[A-Za-z_$][A-Za-z0-9_$]*/.test(
        source
      )
    ) {
      findings.push(
        semanticFinding(
          "STORYBOOK-DOCS-COMPONENT",
          file,
          source,
          "component:",
          "component Autodocs must identify the public component, not a story-only render boundary"
        )
      );
    }

    const storyDescriptionContract =
      isRegistry || file === SLIDES_DECKS_FILE
        ? "registryStoryParameters("
        : isPanel
        ? "placementParameters("
        : file === HISTORY_COMPARE_FILE
        ? "compareParameters("
        : null;
    if (
      storyDescriptionContract &&
      !source.includes(storyDescriptionContract)
    ) {
      findings.push(
        semanticFinding(
          "STORYBOOK-DOCS-DESCRIPTION",
          file,
          source,
          "export const",
          "Autodocs stories must provide non-empty story descriptions"
        )
      );
    }

    if (file === HISTORY_COMPARE_FILE) {
      const requiredHistoryTokens = [
        "component: HistoryComparePanel",
        "compareState:",
        "Initialized Lapis App supplied by the History compare view.",
        "File, revision, and comparison mode supplied by the History compare view.",
      ];
      if (requiredHistoryTokens.some((token) => !source.includes(token))) {
        findings.push(
          semanticFinding(
            "STORYBOOK-DOCS-PROPERTIES",
            file,
            source,
            "argTypes:",
            "History Compare Autodocs must document the public app and compareState properties"
          )
        );
      }
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

  const panelHelper = readOptional(PANEL_HELPER_FILE);
  if (
    panelHelper === null ||
    !panelHelper.includes("description: { story: description }") ||
    !panelHelper.includes(
      'source: { code: source, language: "ts", type: "code" }'
    )
  ) {
    findings.push(
      semanticFinding(
        "STORYBOOK-DOCS-DESCRIPTION",
        PANEL_HELPER_FILE,
        panelHelper ?? "",
        "placementParameters",
        "panel story parameters must provide public source and a non-empty story description"
      )
    );
  }

  const registryDocs = readOptional(REGISTRY_DOCS_FILE);
  if (
    registryDocs === null ||
    !registryDocs.includes("description: { story: description }") ||
    !registryDocs.includes(
      'source: { code: source, language: "tsx", type: "code" }'
    )
  ) {
    findings.push(
      semanticFinding(
        "STORYBOOK-DOCS-DESCRIPTION",
        REGISTRY_DOCS_FILE,
        registryDocs ?? "",
        "registryStoryParameters",
        "registry story parameters must provide public source and a non-empty story description"
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
