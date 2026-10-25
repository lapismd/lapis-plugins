// @vitest-environment jsdom

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { App } from "@lapis-notes/api";
import { describe, expect, it } from "vitest";
import { csvSourceExtensions } from "./csv-source-extensions";

const app = {
  configuration: {
    getConfiguration: () => ({
      get: () => undefined,
    }),
  },
} as unknown as App;

describe("CSV markup editor", () => {
  it("layers the CSV language on the Lapis editor shell", () => {
    const view = new EditorView({
      state: EditorState.create({
        doc: "North,1.84",
        extensions: csvSourceExtensions(app),
      }),
    });

    expect(view.dom.className).toContain("csv-source-view");
    expect(view.dom.className).toContain("cm-editor-source");
    expect(view.dom.className).toContain("markdown-editor-surface");
    expect(view.dom.getAttribute("data-language")).toBe("csv");
    expect(view.dom.querySelector(".cm-csv-cell1")?.textContent).toBe("North");
    expect(view.dom.querySelector(".cm-csv-cell2")?.textContent).toBe("1.84");
    view.destroy();
  });
});
