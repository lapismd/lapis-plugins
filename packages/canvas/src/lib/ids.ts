export const CANVAS_PLUGIN_ID = "lapis-canvas";
export const CANVAS_VIEW_TYPE = "lapis-canvas";
export const CANVAS_EMBED_EXTENSION = "canvas";
export const CANVAS_FILENAME_PATTERN = "*.canvas";
export const SAMPLE_CANVAS_PATH = "Sample.canvas";
export const SAMPLE_WELCOME_PATH = "Notes/Welcome.md";
export const SAMPLE_READING_NOTE_PATH = "Notes/Reading.md";

export function sampleCanvasDocument(): string {
  return `${JSON.stringify(
    {
      nodes: [
        {
          id: "group",
          type: "group",
          label: "Readings",
          x: -40,
          y: -48,
          width: 760,
          height: 460,
          color: "5",
        },
        {
          id: "note",
          type: "text",
          text: "# South basin\n\nThe late tide kept the channel open.",
          x: 0,
          y: 0,
          width: 280,
          height: 180,
          color: "4",
        },
        {
          id: "file",
          type: "file",
          file: SAMPLE_WELCOME_PATH,
          x: 360,
          y: 0,
          width: 300,
          height: 200,
        },
        {
          id: "link",
          type: "link",
          url: "https://lapis.md",
          x: 0,
          y: 240,
          width: 280,
          height: 120,
          color: "6",
        },
      ],
      edges: [
        {
          id: "opens",
          fromNode: "note",
          fromSide: "right",
          toNode: "file",
          toSide: "left",
          toEnd: "arrow",
          label: "opens",
        },
      ],
    },
    null,
    2,
  )}\n`;
}

export function sampleWelcomeMarkdown(): string {
  return ["# Welcome", "", "The harbor survey starts at the south basin.", ""].join(
    "\n",
  );
}

export function sampleReadingMarkdown(): string {
  return [
    "# Reading",
    "",
    "![[Sample.canvas]]",
    "",
    "A plain paragraph stays a Markdown preview.",
    "",
  ].join("\n");
}
