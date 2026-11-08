/**
 * Pure mapping helpers turning Bases query results into Design Core Kanban
 * Board data. Kept DOM-free so the grouping, ordering, colour and card-field
 * rules are unit-testable without mounting the view.
 */
import type {
  KanbanCardData,
  KanbanColumnData,
} from "@lapismd/design-core/workspace/kanban";
import type {
  BasesEntry,
  BasesEntryGroup,
  BasesPropertyId,
} from "../bases.svelte";

/** Column id used for the group holding entries without a groupBy value. */
export const UNGROUPED_COLUMN_ID = "__bases_kanban_ungrouped__";

/** Fallback label for the ungrouped column. */
export const UNGROUPED_COLUMN_LABEL = "Ungrouped";

/** Per-column presentation persisted in the view document. */
export interface KanbanColumnMeta {
  title?: string;
  color?: string;
}

export type KanbanColumnMetaMap = Record<string, KanbanColumnMeta>;

/**
 * AA-contrast lane palette (the Design Core kanban swatch hues). Columns
 * without an explicit `columnMeta` colour cycle through this list.
 */
export const KANBAN_LANE_COLORS = [
  "#1d4ed8",
  "#64748b",
  "#a16207",
  "#b45309",
  "#4d7c0f",
  "#0e7490",
  "#6d28d9",
  "#7e22ce",
  "#a21caf",
];

/** Renders any Bases value (Value instances, arrays, tag objects) as text. */
export function valueToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => valueToText(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const record = value as {
      tag?: string;
      value?: unknown;
      toString?: () => string;
    };
    if (typeof record.tag === "string") {
      return record.tag.replace(/^#/, "");
    }
    if ("value" in record && record.value !== undefined) {
      return valueToText(record.value);
    }
  }
  const text = String(value);
  return text.trim();
}

/** Renders a multi-value Bases field (tags, multitext) as string items. */
export function valueToStrings(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === "object" && "value" in value)
    return valueToStrings((value as { value: unknown }).value);
  if (Array.isArray(value)) {
    return value
      .map((item) => valueToText(item))
      .filter((text) => text.length > 0);
  }
  const text = valueToText(value);
  return text.length > 0 ? [text] : [];
}

export interface KanbanColumnSource {
  /** Group key text; empty for the ungrouped bucket. */
  id: string;
  label: string;
  /** Raw group value written back to the groupBy property on move. */
  groupValue: unknown;
  entries: BasesEntry[];
}

/** Converts Bases entry groups into ordered column sources. */
export function rawGroupValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && "value" in value)
    return rawGroupValue((value as { value: unknown }).value);
  if (
    typeof value === "object" &&
    "toISO" in value &&
    typeof value.toISO === "function"
  )
    return value.toISO();
  if (Array.isArray(value)) return value.map(rawGroupValue);
  if (typeof value === "object") {
    const text = valueToText(value);
    return !text ? null : text === "[object Object]" ? value : text;
  }
  return value;
}

export function groupIdentity(property: string, value: unknown): string {
  return (
    encodeURIComponent(property) +
    ":" +
    encodeURIComponent(JSON.stringify(rawGroupValue(value)) ?? "null")
  );
}

export function toColumnSources(
  groups: BasesEntryGroup[],
  groupProperty?: string,
): KanbanColumnSource[] {
  return groups.map((group) => {
    const keyText = valueToText(group.key ?? null);
    return {
      id: groupProperty
        ? groupIdentity(groupProperty, group.key)
        : keyText || UNGROUPED_COLUMN_ID,
      label: keyText || UNGROUPED_COLUMN_LABEL,
      groupValue: rawGroupValue(group.key),
      entries: group.entries,
    };
  });
}

/** Applies the persisted column order, keeping unknown/new columns at the end. */
export function applyColumnOrder(
  sources: KanbanColumnSource[],
  columnOrder: string[],
): KanbanColumnSource[] {
  if (!Array.isArray(columnOrder) || columnOrder.length === 0) return sources;
  const byId = new Map(sources.map((source) => [source.id, source]));
  const ordered: KanbanColumnSource[] = [];
  const seen = new Set<string>();
  for (const id of columnOrder) {
    const source =
      byId.get(id) ?? sources.find((candidate) => candidate.label === id);
    if (source && !seen.has(source.id)) {
      ordered.push(source);
      seen.add(source.id);
    }
  }
  for (const source of sources) {
    if (!seen.has(source.id)) ordered.push(source);
  }
  return ordered;
}

export interface KanbanCardFields {
  titleProperty: BasesPropertyId;
  /** Visible property columns rendered in the card meta cells. */
  displayProperties: BasesPropertyId[];
  chipProperty?: BasesPropertyId | null;
  descriptionProperty?: BasesPropertyId | null;
  tagsProperty?: BasesPropertyId;
  badgeProperty?: BasesPropertyId | null;
  badgeLabel?: string;
  badgeColor?: string;
  propertyLabels?: Record<string, string>;
  propertyTypes?: Record<string, string>;
  summaries?: Record<string, string>;
}

/** Formats a date (epoch ms, Date, ISO string) as card meta text (e.g. "Sep 12"). */
export function formatDateText(value: unknown): string {
  const text = valueToText(value);
  if (!text) return "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(
        Number(text.slice(0, 4)),
        Number(text.slice(5, 7)) - 1,
        Number(text.slice(8, 10)),
      )
    : /^\d+$/.test(text)
      ? new Date(Number(text))
      : new Date(text);
  return Number.isNaN(parsed.getTime())
    ? text
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/;

/** Renders a display-property value, shortening ISO dates for the meta cells. */
export function formatDisplayText(value: unknown): string {
  const text = valueToText(value);
  return ISO_DATE_PATTERN.test(text) ? formatDateText(text) : text;
}

export function propertyText(value: unknown, type?: string): string {
  if (type === "date" || type === "datetime") return formatDateText(value);
  return valueToText(value);
}

/** Maps one Bases entry onto kanban card data for a given lane colour. */
export function toCardData(
  entry: BasesEntry,
  color: string,
  fields: KanbanCardFields,
): KanbanCardData {
  const title =
    valueToText(entry.getValue(fields.titleProperty)) || entry.file.basename;
  const display = fields.displayProperties
    .map((propertyId) => formatDisplayText(entry.getValue(propertyId)))
    .filter((text) => text.length > 0);
  const stat = entry.file.stat;
  return {
    id: entry.id,
    title,
    tabLabel: fields.chipProperty
      ? propertyText(
          entry.getValue(fields.chipProperty),
          fields.propertyTypes?.[fields.chipProperty],
        ) || title
      : title,
    color,
    tags: valueToStrings(entry.getValue(fields.tagsProperty ?? "file.tags")),
    summary:
      (fields.descriptionProperty
        ? valueToText(entry.getValue(fields.descriptionProperty))
        : "") ||
      fields.summaries?.[entry.id] ||
      "",
    metadata: fields.displayProperties.map((id) => ({
      id,
      label: fields.propertyLabels?.[id] ?? id.replace(/^(note|file)\./, ""),
      value:
        propertyText(entry.getValue(id), fields.propertyTypes?.[id]) || "—",
    })),
    badge:
      fields.badgeProperty &&
      valueToText(entry.getValue(fields.badgeProperty)) !== ""
        ? {
            label:
              fields.badgeLabel?.trim() ||
              fields.propertyLabels?.[fields.badgeProperty] ||
              fields.badgeProperty.replace(/^(note|file)\./, ""),
            value: propertyText(
              entry.getValue(fields.badgeProperty),
              fields.propertyTypes?.[fields.badgeProperty],
            ),
            color: fields.badgeColor || undefined,
          }
        : null,
    createdAt: formatDateText(stat?.ctime ?? null),
    updatedAt: formatDateText(stat?.mtime ?? null),
    statusText: display[0] ?? "",
    // Roll every remaining visible property into the second meta cell so
    // adding a property to the view always surfaces on the card; "" keeps
    // the family's legacy "No priority" placeholder from leaking through.
    priorityText: display.slice(1).join(" · "),
  };
}

export interface BuildKanbanColumnsInput extends KanbanCardFields {
  groupProperty?: string;
  columnTotals?: Record<string, number>;
  groups: BasesEntryGroup[];
  titleProperty: BasesPropertyId;
  displayProperties: BasesPropertyId[];
  columnOrder: string[];
  columnMeta: KanbanColumnMetaMap;
}

export interface BuiltKanbanColumns {
  columns: KanbanColumnData[];
  /** Column id → raw group value for frontmatter writes on move. */
  groupValues: Record<string, unknown>;
}

/** Builds Design Core kanban columns (and the move-target value map). */
export function buildKanbanColumns(
  input: BuildKanbanColumnsInput,
): BuiltKanbanColumns {
  const ordered = applyColumnOrder(
    toColumnSources(input.groups, input.groupProperty),
    input.columnOrder,
  );
  const groupValues: Record<string, unknown> = {};
  const columns = ordered.map((source, index) => {
    const meta =
      input.columnMeta[source.id] ?? input.columnMeta[source.label] ?? {};
    const colorIndex = input.groupProperty
      ? [...source.id].reduce(
          (hash, character) =>
            (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0,
          0,
        )
      : index;
    const color =
      meta.color ?? KANBAN_LANE_COLORS[colorIndex % KANBAN_LANE_COLORS.length]!;
    groupValues[source.id] = source.groupValue;
    return {
      id: source.id,
      label: meta.title?.trim() || source.label,
      color,
      primary: index === 0,
      totalCount: input.columnTotals?.[source.id],
      cards: source.entries.map((entry) =>
        toCardData(entry, color, {
          ...input,
          titleProperty: input.titleProperty,
          displayProperties: input.displayProperties,
        }),
      ),
    } satisfies KanbanColumnData;
  });
  return { columns, groupValues };
}
