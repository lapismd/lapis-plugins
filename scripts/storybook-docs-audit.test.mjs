import assert from "node:assert/strict";
import { test } from "node:test";
import {
  auditStorybookDocs,
  fullWorkspaceStoryFiles,
} from "./spec-validation/storybook-docs-audit.mjs";

const registryStory =
  "stories/plugins/bookmarks/RegistryScreenshots.stories.ts";
const slidesDecks = "stories/plugins/slides/Decks.stories.ts";
const panelStory = "stories/plugins/graph/panels/Graph.stories.ts";
const compareStory = "stories/plugins/history/Compare.stories.ts";

function validSources() {
  return new Map([
    [
      registryStory,
      'import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";\ncomponent: PanelDemo;\nparameters: { docs: { ...WORKSPACE_SHELL_DOCS_PARAMETERS, description: { component: "Bookmarks registry workflow." } } };\nparameters: registryStoryParameters(source, "Bookmarks story.")',
    ],
    [
      slidesDecks,
      'import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";\ncomponent: SlidesDemo;\nparameters: { docs: { ...WORKSPACE_SHELL_DOCS_PARAMETERS, description: { component: "Slides decks." } } };\nparameters: registryStoryParameters(source, "Vertical deck.")',
    ],
    [
      panelStory,
      'component: GraphControlsOverlay;\nparameters: { docs: { ...PANEL_DOCS_PARAMETERS, description: { component: "Graph controls." } } };\nparameters: placementParameters(kind, layout, source, description)',
    ],
    [
      "stories/workspace/docs-parameters.ts",
      'const WORKSPACE_SHELL_DOCS_CANVAS_CLASS = "workspace-shell-docs-canvas";\nconst WORKSPACE_SHELL_DOCS_STORY = { height: "700px", inline: false };\nconst WORKSPACE_SHELL_DOCS_PARAMETERS = { canvas: { className: WORKSPACE_SHELL_DOCS_CANVAS_CLASS }, story: WORKSPACE_SHELL_DOCS_STORY };',
    ],
    [
      "stories/workspace/docs.css",
      ".workspace-shell-docs-canvas .docs-story .sb-story { padding: 0; }",
    ],
    [".storybook/preview.ts", 'import "../stories/workspace/docs.css";'],
    [
      "stories/plugins/_shared/panels/panel-story-helpers.ts",
      'function placementParameters() { return { docs: { description: { story: description }, source: { code: source, language: "ts", type: "code" } } }; }',
    ],
    [
      "stories/plugins/_shared/registry/registry-docs.ts",
      'function registryStoryParameters() { return { docs: { description: { story: description }, source: { code: source, language: "tsx", type: "code" } } }; }',
    ],
  ]);
}

function audit(sources) {
  return auditStorybookDocs({
    trackedFiles: [registryStory, slidesDecks, panelStory],
    inventory: [slidesDecks],
    readOptional(file) {
      return sources.get(file) ?? null;
    },
  });
}

test("inventories registry, panel, shell, and Slides deck families", () => {
  assert.deepEqual(
    fullWorkspaceStoryFiles([panelStory, registryStory], [slidesDecks]),
    [registryStory, panelStory, slidesDecks]
  );
});

test("accepts the shared isolated 700px padding-free Docs contract", () => {
  assert.deepEqual(audit(validSources()), []);
});

test("rejects a full-workspace story without shared Docs parameters", () => {
  const sources = validSources();
  sources.set(
    registryStory,
    'component: PanelDemo;\nparameters: { layout: "fullscreen", docs: { description: { component: "Bookmarks registry workflow." } } };\nparameters: registryStoryParameters(source, "Bookmarks story.")'
  );

  const findings = audit(sources).filter(
    (entry) => entry.file === registryStory
  );
  assert.equal(findings.length, 2);
  assert.match(findings[0].message, /import the shared Docs parameters/);
  assert.match(findings[1].message, /apply the shared Docs parameters/);
});

test("rejects an inventoried panel without a governed 700px contract", () => {
  const sources = validSources();
  sources.set(
    panelStory,
    'component: GraphControlsOverlay;\nparameters: { layout: "fullscreen", docs: { description: { component: "Graph controls." } } };\nparameters: placementParameters(kind, layout, source, description)'
  );

  const findings = audit(sources).filter((entry) => entry.file === panelStory);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /governed isolated 700px Docs contract/);
});

test("rejects story-only components and missing Autodocs descriptions", () => {
  const sources = validSources();
  sources.set(
    panelStory,
    "component: PanelDemo;\nparameters: { docs: { ...PANEL_DOCS_PARAMETERS } }"
  );

  const findings = audit(sources).filter((entry) => entry.file === panelStory);
  assert.deepEqual(
    findings.map((entry) => entry.code),
    [
      "STORYBOOK-DOCS-DESCRIPTION",
      "STORYBOOK-DOCS-COMPONENT",
      "STORYBOOK-DOCS-DESCRIPTION",
    ]
  );
});

test("requires History Compare to document its public component and properties", () => {
  const sources = validSources();
  sources.set(
    compareStory,
    'component: HistoryPanel;\nparameters: { docs: { ...PANEL_DOCS_PARAMETERS, description: { component: "History compare." } } };\nparameters: compareParameters(source, description)'
  );

  const findings = auditStorybookDocs({
    trackedFiles: [compareStory],
    inventory: [compareStory],
    readOptional(file) {
      return sources.get(file) ?? null;
    },
  }).filter((entry) => entry.file === compareStory);

  assert.deepEqual(
    findings.map((entry) => entry.code),
    ["STORYBOOK-DOCS-PROPERTIES"]
  );
});

test("rejects drift in dimensions, padding, and preview installation", () => {
  const sources = validSources();
  sources.set(
    "stories/workspace/docs-parameters.ts",
    'const WORKSPACE_SHELL_DOCS_STORY = { height: "auto", inline: true };'
  );
  sources.set("stories/workspace/docs.css", ".docs-story { padding: 40px; }");
  sources.delete(".storybook/preview.ts");

  const findings = audit(sources);
  assert.deepEqual(
    findings.map((entry) => entry.file),
    [
      "stories/workspace/docs-parameters.ts",
      "stories/workspace/docs.css",
      ".storybook/preview.ts",
    ]
  );
});
