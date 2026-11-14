import { describe, expect, it } from "vitest";
import skills from "@lapis-notes/markdown/skills.json";
import { extractMetadata } from "./metadata/extract-metadata";

describe("packaged Markdown workflow", () => {
  it("indexes its authored properties, headings, links and image reference", () => {
    const example = skills[0].files["SKILL.md"].match(
      /```markdown\n([\s\S]*?)```/,
    )![1];
    const metadata = extractMetadata(example);
    expect(metadata.frontmatter).toEqual({
      title: "Project Alpha",
      tags: ["project/active"],
      aliases: ["Alpha"],
      status: "active",
    });
    expect(metadata.headings).toEqual([
      expect.objectContaining({ heading: "Project Alpha", level: 1 }),
    ]);
    expect(metadata.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          link: "Project Brief|the brief",
          displayText: "the brief",
        }),
        expect.objectContaining({ link: "Meeting#Decisions" }),
        expect.objectContaining({ link: "Architecture.png|600" }),
      ]),
    );
  });
});
