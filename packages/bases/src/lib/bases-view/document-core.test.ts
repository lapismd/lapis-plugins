import { describe, expect, it } from "vitest";
import { normalizeBasesDocument } from "./document-core";

describe("normalizeBasesDocument", () => {
  it.each(["table", "cards", "list", "map", "kanban", "activity", "custom"])(
    "retains imported global and per-view string predicates for %s",
    (type) => {
      const document = normalizeBasesDocument({
        filters: 'status != "done"',
        views: [{ type, name: "Imported", filters: "price > 5" }],
      });
      expect(document.filters).toEqual({ and: ['status != "done"'] });
      expect(document.views[0].filter).toEqual({ and: ["price > 5"] });
      expect(document.views[0]).not.toHaveProperty("filters");
    }
  );

  it("keeps the native filter authoritative when both spellings are present", () => {
    const document = normalizeBasesDocument({
      views: [
        { type: "table", filter: { and: ["price > 5"] }, filters: "price < 0" },
      ],
    });
    expect(document.views[0].filter).toEqual({ and: ["price > 5"] });
    expect(document.views[0]).not.toHaveProperty("filters");
  });

  it.each([
    { and: "price > 5" },
    { xor: ["price > 5"] },
    { and: [{ or: [42] }] },
  ])(
    "rejects malformed filters rather than dropping predicates: %j",
    (filters) => {
      expect(() => normalizeBasesDocument({ filters })).toThrow(
        /Invalid Bases filter/
      );
      expect(() =>
        normalizeBasesDocument({ views: [{ type: "table", filters }] })
      ).toThrow(/Invalid Bases filter/);
    }
  );

  it("creates a default table document for empty input", () => {
    const document = normalizeBasesDocument(undefined);

    expect(document.activeView).toBe("Table");
    expect(document.views).toHaveLength(1);
    expect(document.views[0]).toMatchObject({
      type: "table",
      name: "Table",
      layout: "table",
      order: [],
      sort: [],
    });
  });

  it("normalizes partial parsed yaml into a usable bases document", () => {
    const document = normalizeBasesDocument({
      activeView: "Bad",
      views: [
        {
          type: "table",
          name: "Custom",
        },
      ],
    });

    expect(document.activeView).toBe("Custom");
    expect(document.views[0]).toMatchObject({
      type: "table",
      name: "Custom",
      filter: { and: [] },
      columnSize: {},
    });
  });

  it("preserves cards views when parsed back from source mode", () => {
    const document = normalizeBasesDocument({
      activeView: "Card",
      views: [
        {
          type: "cards",
          name: "Card",
          order: ["file.name"],
          sort: [],
          filter: { and: [] },
          limit: 0,
          imageAspectRatio: 0.25,
          cardSize: 283,
        },
      ],
    });

    expect(document.activeView).toBe("Card");
    expect(document.views).toHaveLength(1);
    expect(document.views[0]).toMatchObject({
      type: "cards",
      name: "Card",
      order: ["file.name"],
      filter: { and: [] },
      imageFit: "contain",
      imageAspectRatio: 0.25,
      cardSize: 283,
    });
  });

  it("preserves custom view types", () => {
    const document = normalizeBasesDocument({
      activeView: "Task List",
      views: [
        {
          type: "tasknotesTaskList",
          name: "Task List",
          order: ["note.title"],
          sort: [],
          filter: { and: [] },
          limit: 0,
        },
      ],
    });

    expect(document.activeView).toBe("Task List");
    expect(document.views[0]).toMatchObject({
      type: "tasknotesTaskList",
      name: "Task List",
      filter: { and: [] },
    });
  });

  it("preserves kanban lane configuration when parsed back from source mode", () => {
    const document = normalizeBasesDocument({
      activeView: "Board",
      views: [
        {
          type: "kanban",
          name: "Board",
          order: ["file.name", "note.owner"],
          groupBy: { property: "note.status", direction: "ASC" },
          titleProperty: "note.title",
          columnOrder: ["Planning", "Active"],
          columnMeta: { Active: { title: "Doing", color: "#1d4ed8" } },
          limit: 0,
        },
      ],
    });

    expect(document.views[0]).toMatchObject({
      type: "kanban",
      name: "Board",
      groupBy: { property: "note.status", direction: "ASC" },
      titleProperty: "note.title",
      columnOrder: ["Planning", "Active"],
      columnMeta: { Active: { title: "Doing", color: "#1d4ed8" } },
    });
  });
});

for (const type of ["kanban", "activity"]) {
  it(`retains mapped card fields, anchoring and column predicates for ${type}`, () => {
    const settings = {
      type,
      name: "Research",
      titleProperty: "note.heading",
      descriptionProperty: "note.abstract",
      tagsProperty: "note.labels",
      badgeProperty: "note.confidence",
      badgeLabel: "Evidence",
      badgeColor: "#4d7c0f",
      dateProperty: "note.reviewed",
      anchorColumnId: null,
      columnFilters: {
        collect: {
          and: [{ column: "note.owner", op: "=", value: "Maya Chen" }],
        },
      },
    };
    const document = normalizeBasesDocument({ views: [settings] });
    expect(document.views[0]).toMatchObject(settings);
    expect(
      normalizeBasesDocument(JSON.parse(JSON.stringify(document))).views[0]
    ).toMatchObject(settings);
  });
}
