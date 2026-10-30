import { describe, expect, it } from "vitest";
import { csvViewMode } from "./csv-view-mode";

describe("csvViewMode", () => {
  it("opens the canvas when a leaf has no mode", () => {
    expect(csvViewMode({})).toBe("canvas");
  });
});
