import type { RevisionView } from "../presentation/types";

export function formatRevisionTimestamp(value: number): string {
  return new Date(value * 1000).toLocaleString();
}

export function shortRevisionId(eventId: string): string {
  return eventId.slice(0, 8);
}

export function revisionReasonLabel(reason: RevisionView["reason"]): string {
  switch (reason) {
    case "checkpoint":
      return "Snapshot";
    case "autosave":
      return "Autosave";
    case "restore-file":
      return "Restore file";
    case "restore-vault":
      return "Restore vault";
    case "merge":
      return "Merge";
  }
}

export function revisionRowLabel(revision: RevisionView): string {
  return `${revision.message} ${shortRevisionId(
    revision.eventId,
  )} ${revisionReasonLabel(revision.reason)}`;
}
