import { expect, test } from "vitest";
import { describeCanvasWebsite } from "./canvas-web-card";

test("website cards derive a readable title without fetching a remote page", () => {
  expect(describeCanvasWebsite("https://en.wikipedia.org/wiki/Salt_marsh")).toMatchObject({ title: "Salt marsh", host: "en.wikipedia.org" });
  expect(describeCanvasWebsite("https://example.com")).toMatchObject({ title: "example.com" });
  expect(describeCanvasWebsite("https://example.com/a%20field-guide.html?q=1#part")).toMatchObject({ title: "A field guide", href: "https://example.com/a%20field-guide.html?q=1#part" });
});
test.each(["javascript:alert(1)", "data:text/html,hi", "file:///private/file", "not a URL", "https://name:secret@example.com"])("website previews refuse unsafe or credentialed input: %s", (url) => {
  expect(describeCanvasWebsite(url)).toBeNull();
});
test("malformed escape sequences never crash a loaded board", () => {
  expect(describeCanvasWebsite("https://example.com/%E0%A4%A")).toMatchObject({ host: "example.com" });
});
