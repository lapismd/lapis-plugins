import type {
  TranscriptAuthor,
  TranscriptCommentThread,
  TranscriptSubmission,
} from "@lapismd/design-core/chat";

export interface SavedTranscriptComment {
  id: string;
  threadId: string;
  blockId: string;
  revision: string;
  from: number;
  to: number;
  quote: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt?: number;
  version: string;
}

export function commentsFromValue(value: unknown): SavedTranscriptComment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const comment = savedComment(entry);
    return comment ? [comment] : [];
  });
}

export function upsertComments(
  existing: readonly SavedTranscriptComment[],
  snapshot: TranscriptSubmission,
): SavedTranscriptComment[] {
  const next = [...existing];
  for (const comment of snapshot.comments) {
    const previous = comment.editOf
      ? next.find((item) => item.id === comment.editOf?.commentId)
      : undefined;
    if (comment.editOf) {
      const index = next.findIndex(
        (item) => item.id === comment.editOf?.commentId,
      );
      if (index >= 0) next.splice(index, 1);
    }
    const saved = toSaved(comment, previous);
    const index = next.findIndex((item) => item.id === saved.id);
    if (index >= 0) next[index] = saved;
    else next.push(saved);
  }
  return next;
}

export function removeComments(
  existing: readonly SavedTranscriptComment[],
  ids: readonly string[],
): SavedTranscriptComment[] {
  const removed = new Set(ids);
  return existing.filter((comment) => !removed.has(comment.id));
}

export function writeComments(
  frontmatter: Record<string, unknown>,
  comments: readonly SavedTranscriptComment[],
): void {
  if (comments.length === 0) delete frontmatter.comments;
  else frontmatter.comments = comments.map((comment) => ({ ...comment }));
}

export function threadsFromComments(
  comments: readonly SavedTranscriptComment[],
  authorFor: (comment: SavedTranscriptComment) => TranscriptAuthor,
): TranscriptCommentThread[] {
  const threads: TranscriptCommentThread[] = [];
  for (const comment of comments) {
    let thread = threads.find((item) => item.id === comment.threadId);
    if (!thread) {
      thread = {
        id: comment.threadId,
        label: comment.authorName,
        anchor: {
          blockId: comment.blockId,
          revision: comment.revision,
          from: comment.from,
          to: comment.to,
          quote: comment.quote,
        },
        comments: [],
      };
      threads.push(thread);
    }
    thread.comments.push({
      id: comment.id,
      author: authorFor(comment),
      text: comment.text,
      status: "sent",
      version: comment.version,
      createdAt: comment.createdAt,
    });
  }
  return threads;
}

function toSaved(
  comment: TranscriptSubmission["comments"][number],
  previous: SavedTranscriptComment | undefined,
): SavedTranscriptComment {
  const version = previous ? nextVersion(previous.version) : "1";
  return {
    id: comment.commentId,
    threadId: comment.threadId,
    blockId: comment.anchor.blockId,
    revision: comment.anchor.revision,
    from: comment.anchor.from,
    to: comment.anchor.to,
    quote: comment.anchor.quote,
    text: comment.text,
    authorId: comment.author.id,
    authorName: comment.author.name,
    ...(typeof comment.author.id === "string" && previous?.createdAt
      ? { createdAt: previous.createdAt }
      : {}),
    version,
  };
}

function nextVersion(version: string): string {
  const value = Number(version);
  return Number.isInteger(value) && value > 0 ? String(value + 1) : "2";
}

function savedComment(value: unknown): SavedTranscriptComment | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = text(record.id);
  const threadId = text(record.threadId);
  const blockId = text(record.blockId);
  const revision = text(record.revision);
  const quote = typeof record.quote === "string" ? record.quote : null;
  const body = typeof record.text === "string" ? record.text : null;
  const authorId = text(record.authorId);
  const authorName = text(record.authorName);
  const version = versionText(record.version);
  const from = whole(record.from);
  const to = whole(record.to);
  if (
    !id ||
    !threadId ||
    !blockId ||
    !revision ||
    quote === null ||
    body === null ||
    !authorId ||
    !authorName ||
    !version ||
    from === null ||
    to === null ||
    from < 0 ||
    to < from
  ) {
    return null;
  }
  const createdAt = whole(record.createdAt);
  return {
    id,
    threadId,
    blockId,
    revision,
    from,
    to,
    quote,
    text: body,
    authorId,
    authorName,
    ...(createdAt !== null ? { createdAt } : {}),
    version,
  };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function versionText(value: unknown): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return String(value);
  }
  return text(value);
}

function whole(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}
