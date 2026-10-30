import { describe, expect, it } from "vitest";
import { TRANSCRIPTS_PLUGIN_ID } from "./ids";

describe("Transcripts identity", () => {
  it("keeps the runtime id", () => {
    expect(TRANSCRIPTS_PLUGIN_ID).toBe("lapis-transcripts");
  });
});
