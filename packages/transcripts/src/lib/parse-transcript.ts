export type TranscriptTimestampFormat = "hh:mm:ss" | "mm:ss:cs";

export interface TranscriptSourceRange {
  start: number;
  end: number;
}

export interface ParsedTranscriptTurn {
  speaker: string;
  timestamp: string;
  seconds: number;
  body: string;
  header: TranscriptSourceRange;
  bodyRange: TranscriptSourceRange;
}

export interface ParsedTranscript {
  source: string;
  qualified: boolean;
  timestampFormat: TranscriptTimestampFormat;
  declaredType: string | null;
  audioReference: string | null;
  turns: ParsedTranscriptTurn[];
}

const TIMESTAMP = String.raw`\d{1,2}:\d{2}(?::\d{2})?`;
const SPEAKER_THEN_TIME = new RegExp(
  String.raw`^(.+?)\s+\((${TIMESTAMP})\)\s*$`,
);
const TIME_THEN_SPEAKER = new RegExp(
  String.raw`^(${TIMESTAMP})\s+(.+?)\s*$`,
);

export function timestampSeconds(
  value: string,
  format: TranscriptTimestampFormat,
): number {
  const parts = value.split(":").map((part) => Number(part));
  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isInteger(part) || part < 0)
  ) {
    return Number.NaN;
  }
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (format === "mm:ss:cs") return parts[0]! * 60 + parts[1]! + parts[2]! / 100;
  return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
}

export function parseTranscript(source: string): ParsedTranscript {
  const frontMatter = readFrontMatter(source);
  const timestampFormat = timestampFormatOf(frontMatter.data.timestamp_format);
  const body = source.slice(frontMatter.contentStart);
  const turns = parseTurns(body, frontMatter.contentStart, timestampFormat);
  const declaredType = scalarText(frontMatter.data.type);
  const qualified =
    turns.length >= 2 ||
    (turns.length === 1 && declaredType?.toLowerCase() === "transcript");
  return {
    source,
    qualified,
    timestampFormat,
    declaredType,
    audioReference: scalarText(frontMatter.data.audio),
    turns,
  };
}

function parseTurns(
  body: string,
  offset: number,
  format: TranscriptTimestampFormat,
): ParsedTranscriptTurn[] {
  const lines = lineIndex(body);
  const turns: ParsedTranscriptTurn[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.fenced || line.text.trim() !== line.text) continue;
    const header = matchHeader(line.text);
    if (!header) continue;
    const seconds = timestampSeconds(header.timestamp, format);
    if (!Number.isFinite(seconds)) continue;
    const next = lines.slice(index + 1).find((candidate) => {
      if (candidate.fenced || candidate.text.trim() !== candidate.text) {
        return false;
      }
      const nextHeader = matchHeader(candidate.text);
      return nextHeader
        ? Number.isFinite(timestampSeconds(nextHeader.timestamp, format))
        : false;
    });
    const rawStart = line.end;
    const rawEnd = next ? next.start : body.length;
    const raw = body.slice(rawStart, rawEnd);
    const leading = raw.match(/^\s*/)?.[0].length ?? 0;
    const trailing = raw.match(/\s*$/)?.[0].length ?? 0;
    const start = rawStart + leading;
    const end = Math.max(start, rawEnd - trailing);
    turns.push({
      speaker: header.speaker,
      timestamp: header.timestamp,
      seconds,
      body: body.slice(start, end),
      header: {
        start: offset + line.start,
        end: offset + line.end,
      },
      bodyRange: {
        start: offset + start,
        end: offset + end,
      },
    });
  }
  return turns;
}

function matchHeader(line: string): { speaker: string; timestamp: string } | null {
  const speakerFirst = SPEAKER_THEN_TIME.exec(line);
  if (speakerFirst) {
    const speaker = speakerFirst[1]?.trim() ?? "";
    const timestamp = speakerFirst[2] ?? "";
    if (speaker && !matchHeader(speaker)) return { speaker, timestamp };
  }
  const timeFirst = TIME_THEN_SPEAKER.exec(line);
  if (!timeFirst) return null;
  const speaker = timeFirst[2]?.trim() ?? "";
  const timestamp = timeFirst[1] ?? "";
  if (!speaker || speaker.length > 80) return null;
  return { speaker, timestamp };
}

function lineIndex(body: string): {
  text: string;
  start: number;
  end: number;
  fenced: boolean;
}[] {
  const lines: {
    text: string;
    start: number;
    end: number;
    fenced: boolean;
  }[] = [];
  let fence: string | null = null;
  let start = 0;
  while (start <= body.length) {
    const breakAt = body.indexOf("\n", start);
    const end = breakAt === -1 ? body.length : breakAt + 1;
    const text = body.slice(start, breakAt === -1 ? body.length : breakAt);
    const marker = text.match(/^\s*(`{3,}|~{3,})/);
    const opensFence = marker?.[1] ?? null;
    const fenced = fence !== null;
    if (opensFence && fence === null) fence = opensFence[0] === "`" ? "`" : "~";
    else if (fence && opensFence?.[0] === fence) fence = null;
    lines.push({ text, start, end, fenced });
    if (breakAt === -1) break;
    start = end;
  }
  return lines;
}

function readFrontMatter(source: string): {
  data: Record<string, unknown>;
  contentStart: number;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, contentStart: 0 };
  return {
    data: parseFrontMatterScalars(match[1] ?? ""),
    contentStart: match[0].length,
  };
}

function parseFrontMatterScalars(block: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(" ") || line.startsWith("\t") || line.startsWith("-")) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!value) continue;
    data[key] = unquote(value);
  }
  return data;
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function scalarText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function timestampFormatOf(value: unknown): TranscriptTimestampFormat {
  const text = scalarText(value)?.toLowerCase();
  if (text === "mm:ss:cs" || text === "minutes/seconds/centiseconds") {
    return "mm:ss:cs";
  }
  return "hh:mm:ss";
}
