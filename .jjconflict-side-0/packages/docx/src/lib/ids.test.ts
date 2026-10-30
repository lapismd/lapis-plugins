import { describe, expect, it } from "vitest";
import {
  DOCX_FILENAME_PATTERN,
  DOCX_PLUGIN_ID,
  DOCX_VIEW_TYPE,
} from "./ids";

describe("DOCX identity", () => {
  it("keeps the runtime id and exclusive association", () => {
    expect(DOCX_PLUGIN_ID).toBe("lapis-docx");
    expect(DOCX_VIEW_TYPE).toBe("lapis-docx");
    expect(DOCX_FILENAME_PATTERN).toBe("*.docx");
  });
});
