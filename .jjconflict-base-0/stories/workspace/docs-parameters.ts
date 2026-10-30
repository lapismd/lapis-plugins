export const WORKSPACE_SHELL_DOCS_CANVAS_CLASS = "workspace-shell-docs-canvas";

export const WORKSPACE_SHELL_DOCS_STORY = {
  height: "700px",
  inline: false,
} as const;

export const WORKSPACE_SHELL_DOCS_PARAMETERS = {
  canvas: { className: WORKSPACE_SHELL_DOCS_CANVAS_CLASS },
  story: WORKSPACE_SHELL_DOCS_STORY,
} as const;
