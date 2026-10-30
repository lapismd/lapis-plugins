import type {
  TranscriptAuthor,
  TranscriptCommentThread,
  TranscriptItem,
} from "@lapismd/design-core/chat";
import { findRecordingReference } from "./transcript-audio";
import {
  commentsFromValue,
  threadsFromComments,
  type SavedTranscriptComment,
} from "./transcript-comments";
import { parseTranscript, type ParsedTranscriptTurn } from "./parse-transcript";
import { sampleReader } from "./sample-turns";
import { transcriptTurnPreview } from "./transcript-navigation-stats";

const SPEAKER_COLORS = [
  "#6e56cf",
  "#0e7490",
  "#b45309",
  "#047857",
  "#1d4ed8",
  "#be185d",
];

export interface ProjectedTranscript {
  qualified: boolean;
  items: TranscriptItem[];
  threads: TranscriptCommentThread[];
  audioReference: string | null;
  secondsByTurn: Record<string, number>;
  signature: string;
}

export function projectTranscript(
  markdown: string,
  frontMatterComments?: unknown,
): ProjectedTranscript {
  const parsed = parseTranscript(markdown);
  const items = parsed.turns.map((turn, index) =>
    projectTurn(turn, index, parsed.turns),
  );
  const saved = commentsFromValue(frontMatterComments);
  const threads = threadsFromComments(saved, commentAuthor);
  const secondsByTurn = Object.fromEntries(
    parsed.turns.map((turn, index) => [items[index]!.id, turn.seconds]),
  );
  return {
    qualified: parsed.qualified,
    items,
    threads,
    audioReference: findRecordingReference(markdown, parsed.audioReference),
    secondsByTurn,
    signature: commentSignature(saved),
  };
}

export function blockRevision(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `rev-${(hash >>> 0).toString(16)}`;
}

function projectTurn(
  turn: ParsedTranscriptTurn,
  index: number,
  turns: readonly ParsedTranscriptTurn[],
): TranscriptItem {
  const occurrence =
    turns
      .slice(0, index)
      .filter(
        (candidate) =>
          candidate.speaker === turn.speaker &&
          candidate.timestamp === turn.timestamp,
      ).length + 1;
  const author = speakerAuthor(turn.speaker);
  const id = `${author.id}-${turn.timestamp.replaceAll(":", "")}-${occurrence}`;
  return {
    id,
    kind: "message",
    label: author.name,
    author,
    timestamp: turn.timestamp,
    turn: {
      id,
      author: author.name,
      prompt: transcriptTurnPreview(turn.body),
      summary: "",
    },
    blocks: [
      {
        id: `${id}-body`,
        revision: blockRevision(turn.body),
        kind: "markdown",
        label: author.name,
        text: turn.body,
        commentable: true,
      },
    ],
  };
}

export function transcriptBodyBlockId(
  turn: ParsedTranscriptTurn,
  index: number,
  turns: readonly ParsedTranscriptTurn[],
): string {
  return projectTurn(turn, index, turns).blocks[0]!.id;
}

function speakerAuthor(name: string): TranscriptAuthor {
  return {
    id: slug(name),
    name,
    initials: initials(name),
    shape: "circle",
    background: SPEAKER_COLORS[hash(name) % SPEAKER_COLORS.length],
  };
}

function commentAuthor(comment: SavedTranscriptComment): TranscriptAuthor {
  if (comment.authorId === sampleReader.id) return sampleReader;
  return {
    id: comment.authorId,
    name: comment.authorName,
    initials: initials(comment.authorName),
    shape: "circle",
    background: "#64748b",
  };
}

function commentSignature(comments: readonly SavedTranscriptComment[]): string {
  return JSON.stringify(
    comments.map((comment) => [
      comment.id,
      comment.threadId,
      comment.blockId,
      comment.revision,
      comment.from,
      comment.to,
      comment.quote,
      comment.text,
      comment.version,
    ]),
  );
}

function slug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "speaker";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SP";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result + value.charCodeAt(index) * (index + 1)) % SPEAKER_COLORS.length;
  }
  return result;
}
