// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { canvasOwnerKey, inspectCanvasEmbedding, MAX_CANVAS_EMBED_DEPTH, whenCanvasContainerConnected } from "./canvas-embed-boundary";

const app = {} as any;
function board(parent: HTMLElement, path: string, owner = app): HTMLElement {
  const root = document.createElement("section");
  root.dataset.canvasBoundary = "";
  root.dataset.canvasOwner = canvasOwnerKey(owner);
  root.dataset.canvasSourcePath = path;
  parent.append(root);
  return root;
}
afterEach(() => { document.body.replaceChildren(); });

test("sibling instances of the same canvas do not count as recursive", () => {
  board(document.body, "A.canvas");
  const sibling = document.createElement("div"); document.body.append(sibling);
  expect(inspectCanvasEmbedding(sibling, app, "A.canvas")).toEqual({ depth: 0, blocked: null });
});

test("direct and Markdown-interleaved cycles are blocked through owned board roots", () => {
  const outer = board(document.body, "A.canvas");
  const markdown = document.createElement("article"); outer.append(markdown);
  const inner = board(markdown, "B.canvas");
  const target = document.createElement("span"); inner.append(target);
  expect(inspectCanvasEmbedding(target, app, "A.canvas")).toEqual({ depth: 2, blocked: "cycle" });
  expect(inspectCanvasEmbedding(target, app, "B.canvas")).toEqual({ depth: 1, blocked: "cycle" });
});

test("an explicit different App is not confused by an equal vault path", () => {
  const outer = board(document.body, "A.canvas");
  const target = document.createElement("span"); outer.append(target);
  expect(inspectCanvasEmbedding(target, {} as any, "A.canvas")).toEqual({ depth: 1, blocked: null });
});

test("deep acyclic graphs have a fixed rendering bound", () => {
  let parent = document.body as HTMLElement;
  for (let index = 0; index < MAX_CANVAS_EMBED_DEPTH; index++) parent = board(parent, `${index}.canvas`);
  const target = document.createElement("span"); parent.append(target);
  expect(inspectCanvasEmbedding(target, app, "Next.canvas")).toEqual({ depth: MAX_CANVAS_EMBED_DEPTH, blocked: "depth" });
});

test("detached Markdown containers publish only after attachment and only once", async () => {
  const fragment = document.createElement("article"); const target = document.createElement("span"); fragment.append(target);
  const connected = vi.fn(); const stop = whenCanvasContainerConnected(target, connected);
  expect(connected).not.toHaveBeenCalled();
  const outer = board(document.body, "A.canvas"); outer.append(fragment);
  await Promise.resolve();
  expect(connected).toHaveBeenCalledTimes(1);
  expect(inspectCanvasEmbedding(target, app, "A.canvas").blocked).toBe("cycle");
  outer.append(document.createElement("div")); await Promise.resolve();
  expect(connected).toHaveBeenCalledTimes(1); stop();
});

test("disposal prevents a late attachment callback", async () => {
  const target = document.createElement("span"); const connected = vi.fn();
  const stop = whenCanvasContainerConnected(target, connected); stop(); document.body.append(target);
  await Promise.resolve(); expect(connected).not.toHaveBeenCalled();
});
