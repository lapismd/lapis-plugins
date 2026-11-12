// @vitest-environment jsdom
import { expect, test, vi } from "vitest";
import { canvasExportSnapshot } from "./canvas-export-snapshot";

test("export retains selected connector geometry and label without its editing controls", () => {
  // jsdom omits this browser constructor; this fixture contains no SVG images.
  vi.stubGlobal("SVGImageElement", class {});
  const viewport = document.createElement("div");
  viewport.innerHTML = `<svg><path class="canvas-flow-edge-path" d="M0 0L100 100"/><path class="canvas-flow-edge-arrow" d="M90 100L100 100L100 90"/><g class="canvas-connector-reconnect"><circle r="22"/></g><path class="canvas-flow-edge-hit-area" d="M0 0L100 100"/></svg><div class="canvas-edge-toolbar-anchor"><button>Set edge color</button><select><option>Source endpoint</option></select></div><button class="canvas-edge-label-hit-target"><span class="canvas-edge-label-hit-target-text">Links to plan</span><span class="canvas-edge-label-hit-target-measure">Links to plan</span></button><div class="canvas-edge-label-editor" contenteditable="true">Draft label</div>`;
  document.body.append(viewport);
  try {
    const snapshot = canvasExportSnapshot(viewport, {
      text: true,
      files: false,
      addresses: false,
      images: false,
    });
    expect(
      snapshot.querySelectorAll("button,select,input,[contenteditable]"),
    ).toHaveLength(0);
    expect(snapshot.querySelectorAll("path")).toHaveLength(2);
    expect(snapshot.querySelector("circle")).toBeNull();
    expect(snapshot.textContent).toBe("Links to plan");
    expect(snapshot.querySelector("path")?.getAttribute("d")).toBe(
      "M0 0L100 100",
    );
    expect(viewport.querySelectorAll("button")).toHaveLength(2);
  } finally {
    viewport.remove();
    vi.unstubAllGlobals();
  }
});
