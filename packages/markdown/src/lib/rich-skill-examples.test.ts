// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
const { createMiraCodeMirrorExtensions } = await import("@lapismd/mira/core");
function runtimeContext(view: EditorView) {
  return {
    view,
    mode: "source" as const,
    getValue: () => view.state.doc.toString(),
    setValue: (value: string) =>
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      }),
    focus: () => view.focus(),
    insertMarkdown: () => undefined,
  };
}
import skills from "@lapis-notes/markdown/skills.json";

function markdownExamples(path: string): string[] {
  return [
    ...skills[0].files[path].matchAll(/^(`{3,})markdown\n([\s\S]*?)^\1\s*$/gm),
  ].map((match) => match[2]);
}
function parsed(source: string): string {
  const state = EditorState.create({
    doc: source,
    extensions: createMiraCodeMirrorExtensions({
      mode: "source",
      runtimeContext,
    }),
  });
  return syntaxTree(state).toString();
}

describe("packaged Lapis rich Markdown references", () => {
  it("keeps doodle metadata attached to an actual horizontal rule", () => {
    const [example] = markdownExamples("references/EDITOR_CAPABILITIES.md");
    expect(example).toMatch(/^<!-- mira-divider:v1:[0-9a-f]{8} -->\n---/);
    expect(parsed(example)).toContain("HorizontalRule");
  });
  it("parses its grid table and directive examples through the public Mira stack", () => {
    const examples = markdownExamples("references/RICH_SYNTAX.md");
    expect(examples.length).toBeGreaterThanOrEqual(4);
    expect(parsed(examples[0])).toContain("GridTable");
    expect(parsed(examples[1])).toContain("ContainerDirective");
    expect(parsed(examples[2])).toContain("FencedCode");
  });

  it("retains the shipped task-state and list-callout data in authored examples", () => {
    const examples = markdownExamples("references/CALLOUTS_AND_TASKS.md");
    expect(examples).toHaveLength(3);
    const state = EditorState.create({
      doc: examples[2],
      extensions: createMiraCodeMirrorExtensions({
        mode: "source",
        runtimeContext,
      }),
    });
    expect(syntaxTree(state).toString()).toContain("BulletList");
    expect(state.doc.toString()).toContain("- [/] Work in progress");
    expect(state.doc.toString()).toContain("- [?] Decide the approach");
    expect(parsed(examples[1])).toContain("BulletList");
  });
});
