import { describe, expect, it } from "vitest";
import { canvasWebUrl } from "./canvas-web-url";

describe("Canvas web card admission", () => {
  it("accepts absolute HTTP and HTTPS URLs", () => {
    expect(canvasWebUrl("https://example.com/a?q=1#part")).toBe(
      "https://example.com/a?q=1#part",
    );
    expect(canvasWebUrl("http://example.com")).toBe("http://example.com/");
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///secret",
    "mailto:user@example.com",
    "about:blank",
    "/relative",
    "",
    "not a URL",
  ])("keeps unsupported or malformed %s inert", (url) =>
    expect(canvasWebUrl(url)).toBeNull(),
  );
  it("normalizes a presentation URL without modifying its stored source", () => {
    const source = { url: "HTTPS://EXAMPLE.COM:443/a" };
    expect(canvasWebUrl(source.url)).toBe("https://example.com/a");
    expect(source.url).toBe("HTTPS://EXAMPLE.COM:443/a");
  });
});
