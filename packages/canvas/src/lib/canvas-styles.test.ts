// @vitest-environment jsdom
import { expect, test } from "vitest";
import { acquireCanvasStyles } from "./canvas-styles";

const sheet = (owner = document) => owner.querySelector("style[data-lapis-canvas-foundation]");
test("one surface cannot remove another surface's foundation CSS", () => {
  const first = acquireCanvasStyles(document, ".canvas-test { color: red; }");
  const second = acquireCanvasStyles(document);
  expect(document.querySelectorAll("style[data-lapis-canvas-foundation]")).toHaveLength(1);
  first(); expect(sheet()).not.toBeNull();
  second(); expect(sheet()).toBeNull();
});

test("repeated cleanup cannot remove a later stylesheet lease", () => {
  const first = acquireCanvasStyles(document, ".canvas-test {}"); first();
  const second = acquireCanvasStyles(document, ".canvas-next {}");
  first(); expect(sheet()).not.toBeNull();
  second(); expect(sheet()).toBeNull();
});

test("independent document owners retain their own stylesheet", () => {
  const other = document.implementation.createHTMLDocument("Other canvas");
  const first = acquireCanvasStyles(document, ".canvas-one {}");
  const second = acquireCanvasStyles(other, ".canvas-two {}");
  first(); expect(sheet()).toBeNull(); expect(sheet(other)).not.toBeNull();
  second(); expect(sheet(other)).toBeNull();
});
