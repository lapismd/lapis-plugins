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

/** jsdom Ranges omit layout rects, so CodeMirror selection measurement throws. */
function installJsdomRangeRects(): void {
  const proto = document.defaultView?.Range?.prototype;
  if (!proto) return;
  if (typeof proto.getClientRects !== "function") {
    proto.getClientRects = () => {
      const rect = {
        x: 0,
        y: 0,
        width: 8,
        height: 16,
        top: 0,
        right: 8,
        bottom: 16,
        left: 0,
        toJSON() {
          return rect;
        },
      };
      const list = [rect] as unknown as DOMRectList;
      return list;
    };
  }
  if (typeof proto.getBoundingClientRect !== "function") {
    proto.getBoundingClientRect = () => proto.getClientRects()[0]!;
  }
}

describe("CSV markup editor", () => {
  it("layers the CSV language on the Lapis editor shell", async () => {
    installJsdomRangeRects();
    const view = new EditorView({
      parent: document.body,
      state: EditorState.create({
        doc: "North,1.84",
        extensions: csvSourceExtensions(app),
      }),
    });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    expect(view.dom.className).toContain("csv-source-view");
    expect(view.dom.className).toContain("cm-editor-source");
    expect(view.dom.className).toContain("markdown-editor-surface");
    expect(view.dom.getAttribute("data-language")).toBe("csv");
    expect(
      view.dom.querySelector(".cm-csv-cell1")?.textContent,
      view.contentDOM.innerHTML,
    ).toBe("North");
    expect(view.dom.querySelector(".cm-csv-cell2")?.textContent).toBe("1.84");
    view.destroy();
  });
});
