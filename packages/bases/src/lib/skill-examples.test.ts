import { describe, expect, it } from "vitest";
import yaml from "js-yaml";
import skills from "@lapis-notes/bases/skills.json";
import { normalizeBasesDocument } from "./bases-view/document-core";
describe("packaged Bases workflow", () => {
  it("keeps both document and view filters in its authored example", () => {
    const example = skills[0].files["SKILL.md"].match(
      /```yaml\n([\s\S]*?)```/,
    )![1];
    const document = normalizeBasesDocument(yaml.load(example));
    expect(document.filters).toEqual({ and: ['file.ext == "md"'] });
    expect(document.views[0].filter).toEqual({ and: ['status == "active"'] });
    expect(document.formulas).toHaveProperty("total", "price * quantity");
  });
});
