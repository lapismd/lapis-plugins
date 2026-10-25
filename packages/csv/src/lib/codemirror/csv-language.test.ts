import { describe, expect, it } from "vitest";
import { csvLanguage } from "./csv-language";
import { csvSourceExtensions } from "./csv-source-extensions";

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
    expect(csvSourceExtensions()).toHaveLength(4);
  });
});
