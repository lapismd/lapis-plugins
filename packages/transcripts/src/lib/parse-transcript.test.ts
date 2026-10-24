import { describe, expect, it } from "vitest";
import { parseTranscript, timestampSeconds } from "./parse-transcript";

const contract = `Speaker 1  (00:25)

So the *mass page* of the contract is the agreement.

00:25:00 Speaker 2

The schedule can stay in Markdown.

The timestamp stays on its own line.
`;

describe("parseTranscript", () => {
  it("reads both header styles and keeps the note unchanged", () => {
    const parsed = parseTranscript(contract);

    expect(parsed.source).toBe(contract);
    expect(parsed.qualified).toBe(true);
    expect(parsed.turns.map((turn) => [turn.speaker, turn.timestamp, turn.seconds])).toEqual([
      ["Speaker 1", "00:25", 25],
      ["Speaker 2", "00:25:00", 25 * 60],
    ]);
    expect(parsed.turns[0]?.body).toContain("*mass page*");
    expect(parsed.turns[1]?.body).toBe(
      "The schedule can stay in Markdown.\n\nThe timestamp stays on its own line.",
    );
    for (const turn of parsed.turns) {
      expect(contract.slice(turn.bodyRange.start, turn.bodyRange.end)).toBe(
        turn.body,
      );
      expect(contract.slice(turn.header.start, turn.header.end)).toContain(
        turn.timestamp,
      );
    }
  });

  it("qualifies one turn only when the note declares type transcript", () => {
    const single = "Speaker 1 (00:25)\n\nOnly one turn.\n";
    expect(parseTranscript(single).qualified).toBe(false);
    expect(
      parseTranscript(`---\ntype: transcript\n---\n${single}`).qualified,
    ).toBe(true);
  });

  it("skips headers inside fenced code", () => {
    const fenced = `Speaker 1 (00:01)

Before the fence.

\`\`\`
Speaker 2 (00:02)
\`\`\`

After the fence.
`;
    const parsed = parseTranscript(fenced);
    expect(parsed.qualified).toBe(false);
    expect(parsed.turns).toHaveLength(1);
    expect(parsed.turns[0]?.body).toContain("Speaker 2 (00:02)");
  });

  it("reads minutes, seconds, and centiseconds only from timestamp_format", () => {
    const note = `---
type: transcript
timestamp_format: mm:ss:cs
audio: recordings/meeting.m4a
---
Speaker 1 (00:25:00)

Centiseconds.
`;
    const parsed = parseTranscript(note);
    expect(parsed.timestampFormat).toBe("mm:ss:cs");
    expect(parsed.audioReference).toBe("recordings/meeting.m4a");
    expect(parsed.turns[0]?.seconds).toBe(25);
    expect(timestampSeconds("00:25:50", "mm:ss:cs")).toBe(25.5);
    expect(timestampSeconds("00:25", "hh:mm:ss")).toBe(25);
    expect(timestampSeconds("00:25:00", "hh:mm:ss")).toBe(1500);
  });
});
