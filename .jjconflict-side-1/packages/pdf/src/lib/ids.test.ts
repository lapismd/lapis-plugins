import { describe, expect, it } from "vitest";
import {
  PDF_FILENAME_PATTERN,
  PDF_PLUGIN_ID,
  PDF_VIEW_TYPE,
  PDF_VIEWER_DEFAULTS,
} from "./ids";

describe("PDF identity", () => {
  it("keeps the runtime id and viewer defaults", () => {
    expect(PDF_PLUGIN_ID).toBe("lapis-pdf");
    expect(PDF_VIEW_TYPE).toBe("lapis-pdf");
    expect(PDF_FILENAME_PATTERN).toBe("*.pdf");
    expect(PDF_VIEWER_DEFAULTS).toEqual({
      defaultZoomLevel: "fit-width",
      scrollStrategy: "vertical",
      pageGap: 10,
      forceDarkPages: true,
    });
  });
});
