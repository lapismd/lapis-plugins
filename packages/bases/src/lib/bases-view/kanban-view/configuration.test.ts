import { describe, expect, test } from "vitest";
import {
  activityDateProperty,
  boardRequiredProperties,
  markdownExcerpt,
} from "./configuration";

const columns = [
  { id: "note.reviewed", displayName: "Reviewed", type: "date", icon: "" },
  { id: "note.logged", displayName: "Logged", type: "datetime", icon: "" },
] as never;
const view = {
  name: "Notes",
  type: "activity",
  order: ["note.logged"],
  sort: [],
  filter: { and: [] },
  limit: 0,
} as import("../models").BasesViewBase;

describe("Markdown card configuration", () => {
  test("prefers an explicit date and otherwise the first visible typed date", () => {
    expect(activityDateProperty(view, columns)).toBe("note.logged");
    expect(
      activityDateProperty({ ...view, dateProperty: "note.reviewed" }, columns),
    ).toBe("note.reviewed");
    expect(activityDateProperty({ ...view, order: [] }, columns)).toBe(
      "note.reviewed",
    );
    expect(activityDateProperty(view, [])).toBeNull();
  });
  test("projects hidden mapped fields and the selected activity date", () => {
    expect(
      boardRequiredProperties(
        {
          ...view,
          titleProperty: "note.heading",
          chipProperty: "note.company",
          descriptionProperty: "note.abstract",
          tagsProperty: "note.labels",
          badgeProperty: "note.followUp",
        },
        columns,
      ),
    ).toEqual([
      "note.heading",
      "note.company",
      "note.abstract",
      "note.labels",
      "note.followUp",
      "note.logged",
    ]);
  });
  test("derives readable excerpts from the body without frontmatter or headings", () => {
    expect(
      markdownExcerpt(
        "---\nprivate: hidden\n---\n# Field visit\nCapture **riverside** observations and [sources](https://example.com).\n\n## Findings\nMore text.",
      ),
    ).toBe("Capture riverside observations and sources.");
    expect(markdownExcerpt("# Empty heading")).toBe("");
    expect(markdownExcerpt("Read [[Research/Notes|the notes]] today.")).toBe(
      "Read the notes today.",
    );
    expect(
      markdownExcerpt("Useful content ".repeat(100)).length,
    ).toBeLessThanOrEqual(280);
  });
});
