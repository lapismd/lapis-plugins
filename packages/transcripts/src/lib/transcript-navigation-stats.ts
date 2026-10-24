import type { TranscriptNavigationStats } from "@lapismd/design-core/chat";

/** Plain preview of a spoken turn, without emphasis markers or link targets. */
export function transcriptTurnPreview(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function transcriptNavigationStats(input: {
  speakers: number;
  durationSeconds: number;
  cueSeconds: readonly number[];
  audioPath: string | null;
  source: string;
}): TranscriptNavigationStats {
  const cue = input.cueSeconds.length ? Math.max(...input.cueSeconds) : 0;
  return {
    speakers: input.speakers,
    durationSeconds: input.durationSeconds > 0 ? input.durationSeconds : cue,
    ...(input.audioPath ? { audioPath: input.audioPath } : {}),
    byteSize: new TextEncoder().encode(input.source).length,
  };
}
