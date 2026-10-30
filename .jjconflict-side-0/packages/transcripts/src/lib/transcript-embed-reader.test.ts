import { describe, expect, it } from "vitest";
import { transcriptEmbedRanges } from "./transcript-embed-reader";

describe("transcript file embeds", () => {
  it("replaces wiki embed lines and keeps the file label", () => {
    const text =
      "The second turn is enough.\n\n![[Contract transcript.md]]\n\n![[Agenda.md|Agenda]]\n";
    const ranges = transcriptEmbedRanges(text);
    expect(ranges.map((range) => text.slice(range.from, range.to))).toEqual([
      "![[Contract transcript.md]]",
      "![[Agenda.md|Agenda]]",
    ]);
    expect(ranges.map((range) => range.label)).toEqual([
      "Contract transcript.md",
      "Agenda",
    ]);
    expect(ranges.map((range) => range.target)).toEqual([
      "Contract transcript.md",
      "Agenda.md",
    ]);
  });
});
