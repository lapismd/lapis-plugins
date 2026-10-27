export const CANVAS_PLUGIN_ID = "lapis-canvas";
export const CANVAS_VIEW_TYPE = "lapis-canvas";
export const CANVAS_EMBED_EXTENSION = "canvas";
export const CANVAS_FILENAME_PATTERN = "*.canvas";
export const SAMPLE_CANVAS_PATH = "Sample.canvas";
export const SAMPLE_TEXT_CANVAS_PATH = "Notes/Text.canvas";
export const SAMPLE_FILE_CANVAS_PATH = "Notes/File.canvas";
export const SAMPLE_SECTION_CANVAS_PATH = "Notes/Section.canvas";
export const SAMPLE_LINK_CANVAS_PATH = "Notes/Link.canvas";
export const SAMPLE_GROUP_CANVAS_PATH = "Notes/Group.canvas";
export const SAMPLE_CONNECTORS_CANVAS_PATH = "Notes/Connectors.canvas";
export const SAMPLE_WELCOME_PATH = "Notes/Welcome.md";
export const SAMPLE_MARKDOWN_TOUR_PATH = "Notes/Markdown Feature Tour.md";
export const SAMPLE_TASK_PATH = "Notes/Build Import Pipeline.md";
export const SAMPLE_READING_NOTE_PATH = "Notes/Reading.md";

function canvasDocument(document: unknown): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function sampleCanvasDocument(): string {
  return canvasDocument({
    nodes: [
      {
        id: "overview",
        type: "text",
        x: -280,
        y: -120,
        width: 260,
        height: 160,
        color: "1",
        text: "# Canvas overview\n\nText nodes should render markdown and retain their color.",
      },
      {
        id: "markdown-file",
        type: "file",
        x: 60,
        y: -150,
        width: 300,
        height: 210,
        color: "2",
        file: SAMPLE_MARKDOWN_TOUR_PATH,
      },
      {
        id: "task-file",
        type: "file",
        x: 60,
        y: 130,
        width: 300,
        height: 180,
        color: "3",
        file: SAMPLE_TASK_PATH,
      },
      {
        id: "external-link",
        type: "link",
        x: -280,
        y: 120,
        width: 240,
        height: 120,
        color: "4",
        url: "https://app.lapis.md",
      },
      {
        id: "group",
        type: "group",
        x: -320,
        y: -180,
        width: 720,
        height: 540,
        color: "5",
        label: "Canvas test group",
      },
    ],
    edges: [
      {
        id: "overview-to-markdown",
        fromNode: "overview",
        fromSide: "right",
        toNode: "markdown-file",
        toSide: "left",
        label: "embeds",
      },
      {
        id: "markdown-to-task",
        fromNode: "markdown-file",
        fromSide: "bottom",
        toNode: "task-file",
        toSide: "top",
        label: "references",
      },
      {
        id: "overview-to-link",
        fromNode: "overview",
        fromSide: "bottom",
        toNode: "external-link",
        toSide: "top",
        label: "external",
      },
    ],
  });
}

export function sampleTextCanvasDocument(): string {
  return canvasDocument({
    nodes: [
      {
        id: "overview",
        type: "text",
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        color: "1",
        text: "# Canvas overview\n\nText nodes should render markdown and retain their color.",
      },
    ],
    edges: [],
  });
}

export function sampleFileCanvasDocument(): string {
  return canvasDocument({
    nodes: [
      {
        id: "markdown-file",
        type: "file",
        x: 0,
        y: 0,
        width: 340,
        height: 220,
        color: "2",
        file: SAMPLE_MARKDOWN_TOUR_PATH,
      },
    ],
    edges: [],
  });
}

export function sampleSectionCanvasDocument(): string {
  return canvasDocument({
    nodes: [
      {
        id: "section-file",
        type: "file",
        x: 0,
        y: 0,
        width: 340,
        height: 200,
        color: "3",
        file: SAMPLE_MARKDOWN_TOUR_PATH,
        subpath: "#Lists",
      },
    ],
    edges: [],
  });
}

export function sampleLinkCanvasDocument(): string {
  return canvasDocument({
    nodes: [
      {
        id: "external-link",
        type: "link",
        x: 0,
        y: 0,
        width: 280,
        height: 140,
        color: "4",
        url: "https://app.lapis.md",
      },
    ],
    edges: [],
  });
}

export function sampleGroupCanvasDocument(): string {
  return canvasDocument({
    nodes: [
      {
        id: "group",
        type: "group",
        x: -24,
        y: -36,
        width: 420,
        height: 280,
        color: "5",
        label: "Canvas test group",
      },
      {
        id: "overview",
        type: "text",
        x: 16,
        y: 16,
        width: 280,
        height: 160,
        color: "1",
        text: "# Canvas overview\n\nText nodes should render markdown and retain their color.",
      },
    ],
    edges: [],
  });
}

export function sampleConnectorsCanvasDocument(): string {
  return canvasDocument({
    nodes: [
      {
        id: "overview",
        type: "text",
        x: 0,
        y: 0,
        width: 240,
        height: 140,
        color: "1",
        text: "# Canvas overview\n\nText nodes should render markdown and retain their color.",
      },
      {
        id: "markdown-file",
        type: "file",
        x: 320,
        y: 0,
        width: 280,
        height: 160,
        color: "2",
        file: SAMPLE_MARKDOWN_TOUR_PATH,
      },
      {
        id: "task-file",
        type: "file",
        x: 320,
        y: 220,
        width: 280,
        height: 150,
        color: "3",
        file: SAMPLE_TASK_PATH,
      },
    ],
    edges: [
      {
        id: "overview-to-markdown",
        fromNode: "overview",
        fromSide: "right",
        toNode: "markdown-file",
        toSide: "left",
        label: "embeds",
      },
      {
        id: "markdown-to-task",
        fromNode: "markdown-file",
        fromSide: "bottom",
        toNode: "task-file",
        toSide: "top",
        toEnd: "arrow",
        label: "references",
      },
    ],
  });
}

export function sampleWelcomeMarkdown(): string {
  return ["# Welcome", "", "The harbor survey starts at the south basin.", ""].join(
    "\n",
  );
}

export function sampleMarkdownTour(): string {
  return [
    "# Markdown feature tour",
    "",
    "A file node keeps this note's markdown inside the card.",
    "",
    "## Lists",
    "",
    "- Lists stay in the card",
    "- Colour stays on the node",
    "",
  ].join("\n");
}

export function sampleTaskMarkdown(): string {
  return [
    "# Build import pipeline",
    "",
    "- [ ] Collect the source notes",
    "- [x] Keep the canvas link",
    "",
  ].join("\n");
}

export function sampleReadingMarkdown(): string {
  return [
    "# Canvas notes",
    "",
    "Open the feature canvas for text, file, link, and group nodes with labeled edges.",
    "",
    "![[Sample.canvas]]",
    "",
    "A plain paragraph stays a Markdown preview.",
    "",
  ].join("\n");
}

export function sampleCanvasFiles(): Record<string, string> {
  return {
    [SAMPLE_CANVAS_PATH]: sampleCanvasDocument(),
    [SAMPLE_TEXT_CANVAS_PATH]: sampleTextCanvasDocument(),
    [SAMPLE_FILE_CANVAS_PATH]: sampleFileCanvasDocument(),
    [SAMPLE_SECTION_CANVAS_PATH]: sampleSectionCanvasDocument(),
    [SAMPLE_LINK_CANVAS_PATH]: sampleLinkCanvasDocument(),
    [SAMPLE_GROUP_CANVAS_PATH]: sampleGroupCanvasDocument(),
    [SAMPLE_CONNECTORS_CANVAS_PATH]: sampleConnectorsCanvasDocument(),
    [SAMPLE_WELCOME_PATH]: sampleWelcomeMarkdown(),
    [SAMPLE_MARKDOWN_TOUR_PATH]: sampleMarkdownTour(),
    [SAMPLE_TASK_PATH]: sampleTaskMarkdown(),
    [SAMPLE_READING_NOTE_PATH]: sampleReadingMarkdown(),
  };
}
