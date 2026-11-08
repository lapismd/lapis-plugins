import type { BasesPropertyId } from "@lapis-notes/api";
import type { ColumnDefinition } from "../columns";
import type { BasesViewBase } from "../models";

export function activityDateProperty(
  view: BasesViewBase,
  columns: readonly ColumnDefinition[],
): BasesPropertyId | null {
  if (typeof view.dateProperty === "string" && view.dateProperty)
    return view.dateProperty as BasesPropertyId;
  const ordered = [
    ...new Set([...view.order, ...columns.map((column) => column.id)]),
  ];
  return (
    (ordered.find((id) =>
      columns.some(
        (column) =>
          column.id === id &&
          (column.type === "date" || column.type === "datetime"),
      ),
    ) as BasesPropertyId | undefined) ?? null
  );
}

/** Layout mappings participate in projection even when hidden in Properties. */
export function boardRequiredProperties(
  view: BasesViewBase,
  columns: readonly ColumnDefinition[],
): BasesPropertyId[] {
  const ids = [
    view.titleProperty || "file.name",
    view.chipProperty,
    view.descriptionProperty,
    view.tagsProperty || "file.tags",
    view.badgeProperty,
  ];
  if (view.type === "activity") ids.push(activityDateProperty(view, columns));
  return [
    ...new Set(
      ids.filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ] as BasesPropertyId[];
}

/** The excerpt is read-only derived content; persistence always edits the source. */
export function markdownExcerpt(source: string): string {
  const body = source
    .replace(
      /^\uFEFF?---[^\S\r\n]*\r?\n[\s\S]*?\r?\n---[^\S\r\n]*(?:\r?\n|$)/,
      "",
    )
    .replace(/^\s*#{1,6}\s+.*$/gm, "");
  const paragraph = body
    .split(/\r?\n\s*\r?\n/)
    .find((value) => value.trim() && !/^\s*#{1,6}\s/.test(value));
  return (paragraph ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_, path: string, label: string) => label || path,
    )
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}
