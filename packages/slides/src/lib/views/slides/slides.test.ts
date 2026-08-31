// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  DEFAULT_ELEMENT_ATTRIBUTES_SEPARATOR,
  DEFAULT_SLIDE_ATTRIBUTES_SEPARATOR,
  addAttributes,
  buildTree,
  countSections,
  extractFrontMatter,
  extractSections,
} from "./slides";

describe("Slides Markdown parsing", () => {
  it("splits only blank-line horizontal and vertical separators", () => {
    const content = [
      "# One",
      "---",
      "still one",
      "",
      "---",
      "",
      "# Two",
      "",
      "----",
      "",
      "## Two A",
    ].join("\n");

    const sections = extractSections(content);
    expect(sections.map((section) => section.level)).toEqual([1, 1, 2]);
    expect(
      sections.map((section) =>
        content.substring(section.start, section.end).trim(),
      ),
    ).toEqual(["# One\n---\nstill one", "# Two", "## Two A"]);
  });

  it("builds recursive horizontal and vertical slide trees", () => {
    const tree = buildTree(
      "# One\n\n---\n\n# Two\n\n----\n\n## Two A\n\n----\n\n## Two B\n\n---\n\n# Three",
    );

    expect(tree.map((slide) => slide.content.trim())).toEqual([
      "# One",
      "# Two",
      "# Three",
    ]);
    expect(tree[1].children.map((slide) => slide.content.trim())).toEqual([
      "## Two A",
      "## Two B",
    ]);
    expect(countSections(tree)).toBe(5);
  });

  it("extracts fail-safe YAML Reveal configuration", () => {
    expect(
      extractFrontMatter(
        "---\ncontrols: false\ntransition: fade\n---\n\n# Deck",
      ),
    ).toEqual([
      "# Deck",
      { controls: "false", transition: "fade" },
    ]);
  });

  it("keeps the original Markdown when YAML is malformed", () => {
    const content = "---\ncontrols: [\n---\n\n# Deck";
    expect(extractFrontMatter(content)).toEqual([content, {}]);
  });

  it("extracts notes labels and callout-style speaker notes", () => {
    const labelTree = buildTree("# Goal\n\nNotes: say this out loud");
    expect(labelTree[0].content.trim()).toBe("# Goal");
    expect(labelTree[0].notes).toBe("say this out loud");

    const calloutTree = buildTree("# Goal\n\n>[!note]: say this too");
    expect(calloutTree[0].content.trim()).toBe("# Goal");
    expect(calloutTree[0].notes).toBe(">say this too");
  });

  it("returns one empty slide for empty content", () => {
    const tree = buildTree("");
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({ content: "", notes: "", children: [] });
  });

  it("applies element and slide comment attributes", () => {
    const section = document.createElement("section");
    section.innerHTML = [
      "<h2>Goal</h2>",
      '<!-- .element class="fragment" data-fragment-index="1" -->',
      '<!-- .slide: data-background-color="#123456" -->',
    ].join("");

    addAttributes(
      section,
      section,
      null,
      DEFAULT_ELEMENT_ATTRIBUTES_SEPARATOR,
      DEFAULT_SLIDE_ATTRIBUTES_SEPARATOR,
    );

    expect(section.querySelector("h2")?.classList.contains("fragment")).toBe(
      true,
    );
    expect(
      section.querySelector("h2")?.getAttribute("data-fragment-index"),
    ).toBe("1");
    expect(section.getAttribute("data-background-color")).toBe("#123456");
  });
});
