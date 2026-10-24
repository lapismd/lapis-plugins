import type { TranscriptItem } from "@lapismd/design-core/chat";

export function timestampToSeconds(value: string): number {
  const parts = value.split(":").map((part) => Number(part));
  if (parts.length < 2 || parts.some((part) => !Number.isFinite(part))) {
    return 0;
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parts[0] * 60 + parts[1];
}

export function formatPlayhead(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

export function activeTurnForTime(
  items: readonly TranscriptItem[],
  seconds: number,
  secondsByTurn?: Readonly<Record<string, number>>,
): TranscriptItem | null {
  let active: TranscriptItem | null = null;
  for (const item of items) {
    const mark =
      secondsByTurn?.[item.id] ??
      (item.timestamp ? timestampToSeconds(item.timestamp) : Number.NaN);
    if (!Number.isFinite(mark)) continue;
    if (mark <= seconds + 0.001) active = item;
  }
  return active;
}

/** Short cue tones at each turn. The preview does not ship a copied recording. */
export function createSampleCueWav(items: readonly TranscriptItem[]): Blob {
  const marks = items
    .map((item) => (item.timestamp ? timestampToSeconds(item.timestamp) : 0))
    .filter((mark) => mark >= 0);
  const last = marks.reduce((max, mark) => Math.max(max, mark), 0);
  const rate = 8000;
  const duration = last + 4;
  const length = Math.max(1, Math.ceil(duration * rate));
  const data = new Uint8Array(length);
  data.fill(128);
  for (const mark of marks) {
    const start = Math.min(length - 1, Math.floor(mark * rate));
    const blip = Math.floor(rate * 0.07);
    for (let index = 0; index < blip && start + index < length; index += 1) {
      const envelope = 1 - index / blip;
      const sample = Math.sin((2 * Math.PI * 660 * index) / rate);
      data[start + index] = 128 + Math.round(56 * envelope * sample);
    }
  }

  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + data.length, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, "data");
  view.setUint32(40, data.length, true);
  return new Blob([header, data], { type: "audio/wav" });
}
