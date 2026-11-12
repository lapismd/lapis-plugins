import { expect, test } from "vitest";
import { resolveCanvasEmbedFileContent } from "./json-canvas";

test("an explicitly empty preview wins over a whole-file fallback", () => {
  expect(resolveCanvasEmbedFileContent({ "Note.md#Part": "", "Note.md": "Whole file" }, "Note.md", "#Part"))
    .toEqual({ value: "", sourcePath: "Note.md" });
});
