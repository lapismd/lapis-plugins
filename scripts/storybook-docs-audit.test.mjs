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

function validSources() {
  return new Map([
    [
      registryStory,
      'import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";\nparameters: { docs: WORKSPACE_SHELL_DOCS_PARAMETERS }',
    ],
    [
      slidesDecks,
      'import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";\nparameters: { docs: WORKSPACE_SHELL_DOCS_PARAMETERS }',
    ],
    [panelStory, "parameters: { docs: { ...PANEL_DOCS_PARAMETERS } }"],
    [
      "stories/workspace/docs-parameters.ts",
      'const WORKSPACE_SHELL_DOCS_CANVAS_CLASS = "workspace-shell-docs-canvas";\nconst WORKSPACE_SHELL_DOCS_STORY = { height: "700px", inline: false };\nconst WORKSPACE_SHELL_DOCS_PARAMETERS = { canvas: { className: WORKSPACE_SHELL_DOCS_CANVAS_CLASS }, story: WORKSPACE_SHELL_DOCS_STORY };',
    ],
    [
      "stories/workspace/docs.css",
      ".workspace-shell-docs-canvas .docs-story .sb-story { padding: 0; }",
    ],
    [".storybook/preview.ts", 'import "../stories/workspace/docs.css";'],
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
  sources.set(registryStory, 'parameters: { layout: "fullscreen" }');

  const findings = audit(sources).filter(
    (entry) => entry.file === registryStory
  );
  assert.equal(findings.length, 2);
  assert.match(findings[0].message, /import the shared Docs parameters/);
  assert.match(findings[1].message, /apply the shared Docs parameters/);
});

test("rejects an inventoried panel without a governed 700px contract", () => {
  const sources = validSources();
  sources.set(panelStory, 'parameters: { layout: "fullscreen" }');

  const findings = audit(sources).filter((entry) => entry.file === panelStory);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /governed isolated 700px Docs contract/);
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
