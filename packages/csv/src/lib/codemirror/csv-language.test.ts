import { highlightTree } from "@lezer/highlight";
import { describe, expect, it } from "vitest";
import { csvHighlightStyle } from "./csv-rainbow-theme";
import { csvLanguage } from "./csv-language";
import { csvLanguageExtensions } from "./csv-language-extensions";

describe("CSV language", () => {
  it("marks successive cells and the separator", () => {
    const names: string[] = [];
    csvLanguage.parser.parse('North,1.84,"Clear, weed"').iterate({
      enter(node) {
        if (node.name === "Program" || node.name === "Row") return;
        names.push(node.name);
      },
    });

    expect(names.filter((name) => name.startsWith("Cell") || name === "Separator")).toEqual([
      "Cell1",
      "Separator",
      "Cell2",
      "Separator",
      "Cell3",
    ]);
  });

  it("contributes the rainbow highlighter with the language", () => {
    expect(csvLanguageExtensions()).toHaveLength(3);
  });

  it("keeps a column colour on quoted and plain cell text", () => {
    const text = 'North,1.84,"Clear, weed"';
    const spans: Array<{ text: string; classes: string }> = [];
    highlightTree(
      csvLanguage.parser.parse(text),
      csvHighlightStyle,
      (from, to, classes) => {
        spans.push({ text: text.slice(from, to), classes });
      },
    );

    expect(spans).toEqual([
      { text: "North", classes: "cm-csv-cell1" },
      { text: ",", classes: "cm-csv-separator" },
      { text: "1.84", classes: "cm-csv-cell2" },
      { text: ",", classes: "cm-csv-separator" },
      { text: '"Clear, weed"', classes: "cm-csv-cell3" },
    ]);
  });
});
