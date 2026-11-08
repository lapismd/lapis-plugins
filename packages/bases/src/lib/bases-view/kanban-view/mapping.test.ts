import { describe, expect, test } from "vitest";
import {
  applyColumnOrder,
  buildKanbanColumns,
  formatDateText,
  formatDisplayText,
  KANBAN_LANE_COLORS,
  toColumnSources,
  toCardData,
  groupIdentity,
  UNGROUPED_COLUMN_ID,
  valueToStrings,
  valueToText,
} from "./mapping";

/**
 * Structural fakes for Bases runtime classes. Importing `../bases.svelte`
 * would pull `@lapis-notes/api` (whose bundled configuration components read
 * `ResizeObserver` at module scope) into the node test environment, so the
 * mapping helpers are exercised against the same shapes instead; the real
 * classes are covered by the governed kanban Storybook scenario.
 */
const stringValue = (text: string) => ({
  value: text,
  isTruthy: () => text.length > 0,
  toString: () => text,
});

const nullValue = () => ({
  isTruthy: () => false,
  toString: () => "",
});

function entry(id: string, values: Record<string, unknown> = {}) {
  return {
    id,
    file: {
      basename: `note-${id}`,
      path: `${id}.md`,
      stat: {
        ctime: Date.parse("2026-09-01T10:00:00Z"),
        mtime: Date.parse("2026-09-10T12:00:00Z"),
        size: 128,
      },
    },
    getValue: (propertyId: string) => values[propertyId] ?? null,
  };
}

function group(key: unknown, entries: unknown[]) {
  return { key, entries } as never;
}

describe("kanban mapping", () => {
  test("renders values, arrays and tag objects as text", () => {
    expect(valueToText(stringValue("Active"))).toBe("Active");
    expect(valueToText(nullValue())).toBe("");
    expect(valueToText(null)).toBe("");
    expect(valueToText(["a", "b"])).toBe("a, b");
    expect(valueToText([{ tag: "#launch" }, { tag: "design" }])).toBe(
      "launch, design",
    );
    expect(valueToStrings([{ tag: "#launch" }, "design"])).toEqual([
      "launch",
      "design",
    ]);
    expect(valueToStrings(nullValue())).toEqual([]);
  });

  test("formats parseable dates and passes display text through", () => {
    expect(formatDateText("not a date")).toBe("not a date");
    expect(formatDateText(null)).toBe("");
    const formatted = formatDateText("2026-09-12T09:00:00Z");
    expect(formatted).toMatch(/12|Sep/);
    // Epoch milliseconds (TFile.stat) format like dates.
    expect(formatDateText(Date.parse("2026-09-12T09:00:00Z"))).toMatch(
      /12|Sep/,
    );
    expect(formatDisplayText("2026-09-18T00:00")).toMatch(/18|Sep/);
    expect(formatDisplayText(stringValue("Maya Chen"))).toBe("Maya Chen");
    expect(formatDisplayText(stringValue("2026"))).toBe("2026");
  });

  test("maps groups to column sources with an ungrouped bucket", () => {
    const sources = toColumnSources([
      group(stringValue("Active"), [entry("a")]),
      group(nullValue(), [entry("b")]),
    ]);
    expect(sources.map((source) => source.id)).toEqual([
      "Active",
      UNGROUPED_COLUMN_ID,
    ]);
    expect(sources[1]!.label).toBe("Ungrouped");
    expect(sources[1]!.groupValue).toBeNull();
    expect(sources[0]!.groupValue).toBe("Active");
  });

  test("applies the persisted order and appends unknown columns", () => {
    const sources = toColumnSources([
      group(stringValue("A"), []),
      group(stringValue("B"), []),
      group(stringValue("C"), []),
    ]);
    const ordered = applyColumnOrder(sources, ["C", "missing", "A"]);
    expect(ordered.map((source) => source.id)).toEqual(["C", "A", "B"]);
  });

  test("builds columns with meta overrides, lane colours and card fields", () => {
    const built = buildKanbanColumns({
      groups: [
        group(stringValue("Active"), [
          entry("a", {
            "note.title": stringValue("First note"),
            "file.tags": [{ tag: "#launch" }],
            "note.owner": stringValue("Maya"),
            "note.score": {
              value: 94,
              isTruthy: () => true,
              toString: () => "94",
            },
            "note.due": {
              value: "2026-09-18",
              isTruthy: () => true,
              toString: () => "2026-09-18T00:00",
            },
          }),
        ]),
        group(stringValue("Planning"), [entry("b")]),
      ],
      titleProperty: "note.title",
      displayProperties: ["note.owner", "note.score", "note.due"],
      columnOrder: [],
      columnMeta: { Planning: { title: "Later", color: "#111111" } },
    });

    expect(built.columns).toHaveLength(2);
    const [active, planning] = built.columns;
    expect(active!.id).toBe("Active");
    expect(active!.primary).toBe(true);
    expect(active!.color).toBe(KANBAN_LANE_COLORS[0]);
    expect(active!.cards[0]).toMatchObject({
      id: "a",
      title: "First note",
      tags: ["launch"],
      statusText: "Maya",
    });
    // The first visible property fills the status cell; every remaining one
    // rolls into the priority cell so added properties always surface.
    expect(active!.cards[0]!.priorityText).toMatch(/^94 · /);
    expect(active!.cards[0]!.priorityText).toMatch(/18|Sep/);
    expect(active!.cards[0]!.createdAt).toMatch(/1|Sep/);
    expect(active!.cards[0]!.updatedAt).toMatch(/10|Sep/);
    expect(planning!.label).toBe("Later");
    expect(planning!.color).toBe("#111111");
    expect(planning!.cards[0]!.title).toBe("note-b");
    // No display values: empty cells, never the family's "No priority".
    expect(planning!.cards[0]!.priorityText).toBe("");
    expect(built.groupValues).toEqual({
      Active: "Active",
      Planning: "Planning",
    });
  });
});

test("maps summaries, individually positioned metadata, wrapped tags and typed badges", () => {
  const item = entry("a", {
    "note.abstract": stringValue("A configured summary"),
    "note.company": stringValue("Atlas AI"),
    "note.score": { value: 0 },
    "note.confirmed": { value: false },
    "note.labels": { value: ["fieldwork", "research"] },
  }) as never;
  const fields = {
    titleProperty: "file.name",
    displayProperties: ["note.score", "note.missing", "note.confirmed"],
    tagsProperty: "note.labels",
    badgeProperty: "note.score",
    propertyLabels: { "note.score": "Confidence" },
    summaries: { a: "Body excerpt" },
  } as const;
  const card = toCardData(item, "#0e7490", {
    ...fields,
    displayProperties: [...fields.displayProperties],
  });
  expect(card.summary).toBe("Body excerpt");
  expect(card.tags).toEqual(["fieldwork", "research"]);
  expect(card.metadata?.map((cell) => cell.value)).toEqual(["0", "—", "false"]);
  expect(card.badge).toMatchObject({ label: "Confidence", value: "0" });
  expect(
    toCardData(item, "#0e7490", {
      ...fields,
      displayProperties: [],
      descriptionProperty: "note.abstract",
    }).summary,
  ).toBe("A configured summary");
  expect(
    toCardData(item, "#0e7490", {
      ...fields,
      displayProperties: [],
      badgeProperty: "note.confirmed",
    }).badge?.value,
  ).toBe("false");
});

test("scopes group identity by property and value type while retaining legacy presentation", () => {
  expect(groupIdentity("note.phase", "1")).not.toBe(
    groupIdentity("note.phase", 1),
  );
  expect(groupIdentity("note.phase", "Collect")).not.toBe(
    groupIdentity("note.owner", "Collect"),
  );
  const built = buildKanbanColumns({
    groups: [group("Collect", []), group("Reflect", [])],
    groupProperty: "note.phase",
    titleProperty: "file.name",
    displayProperties: [],
    columnOrder: ["Reflect"],
    columnMeta: { Reflect: { title: "Synthesis", color: "#4d7c0f" } },
  });
  expect(built.columns[0]).toMatchObject({
    id: groupIdentity("note.phase", "Reflect"),
    label: "Synthesis",
    color: "#4d7c0f",
  });
  expect(built.groupValues[built.columns[0]!.id]).toBe("Reflect");
});

test("the card chip defaults to title and can map an independent property", () => {
  const item = entry("a", {
    "note.title": "Infrastructure lead",
    "note.company": "Atlas AI",
  }) as never;
  const fields = {
    titleProperty: "note.title",
    displayProperties: [],
  } as const;
  expect(
    toCardData(item, "#0e7490", { ...fields, displayProperties: [] }).tabLabel,
  ).toBe("Infrastructure lead");
  expect(
    toCardData(item, "#0e7490", {
      ...fields,
      displayProperties: [],
      chipProperty: "note.company",
    }).tabLabel,
  ).toBe("Atlas AI");
  expect(
    toCardData(item, "#0e7490", {
      ...fields,
      displayProperties: [],
      chipProperty: "note.missing",
    }).tabLabel,
  ).toBe("Infrastructure lead");
});

test("derived column colours remain stable across query order changes", () => {
  const input = {
    groupProperty: "note.phase",
    titleProperty: "file.name",
    displayProperties: [],
    columnOrder: [],
    columnMeta: {},
  } as const;
  const first = buildKanbanColumns({
    ...input,
    displayProperties: [],
    columnOrder: [],
    groups: [group("Collect", []), group("Reflect", [])],
  });
  const reordered = buildKanbanColumns({
    ...input,
    displayProperties: [],
    columnOrder: [],
    groups: [group("Reflect", []), group("Collect", [])],
  });
  expect(first.columns[0]!.color).toBe(reordered.columns[1]!.color);
});
