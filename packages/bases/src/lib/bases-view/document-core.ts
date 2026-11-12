import type {
  AnyBasesView,
  BasesDocument,
  CardsView,
  Filters,
  TableView,
} from "./models";

function normalizeFilters(input: unknown): Filters {
  if (input === null || input === undefined || input === "")
    return emptyFilter();
  if (typeof input === "string") return { and: [input] };
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error(
      "Invalid Bases filter: expected an expression or filter group."
    );
  }
  const entries = Object.entries(input);
  if (
    entries.length !== 1 ||
    !["and", "or", "not"].includes(entries[0][0]) ||
    !Array.isArray(entries[0][1])
  ) {
    throw new Error("Invalid Bases filter: expected an and, or or not array.");
  }
  const [operator, values] = entries[0];
  return {
    [operator]: values.map((value: unknown) => {
      if (typeof value === "string") return value;
      if (
        value &&
        typeof value === "object" &&
        "column" in value &&
        "op" in value &&
        typeof value.column === "string" &&
        typeof value.op === "string"
      )
        return value;
      return normalizeFilters(value);
    }),
  } as Filters;
}

function emptyFilter(): Filters {
  return { and: [] };
}

function defaultTableView(): TableView {
  return {
    type: "table",
    name: "Table",
    layout: "table",
    order: [],
    sort: [],
    filter: emptyFilter(),
    limit: 0,
    columnSize: {},
    imageAspectRatio: 1,
  };
}

function defaultCardsView(): CardsView {
  return {
    type: "cards",
    name: "Cards",
    order: [],
    sort: [],
    filter: emptyFilter(),
    limit: 0,
    image: "",
    imageFit: "contain",
    imageAspectRatio: 1,
    cardSize: 200,
  };
}

function defaultCustomView(type: string): AnyBasesView {
  return {
    type,
    name: type,
    order: [],
    sort: [],
    filter: emptyFilter(),
    limit: 0,
  };
}

function normalizeView(
  view: unknown,
  fallbackName: string
): AnyBasesView | null {
  if (!view || typeof view !== "object") return null;

  const { filters: importedFilters, ...candidate } =
    view as Partial<AnyBasesView> & Record<string, unknown>;
  // The singular key remains the native model/write format. Remove the import
  // alias so subsequent UI edits cannot leave a second, stale predicate behind.
  const filter = normalizeFilters(candidate.filter ?? importedFilters);
  if (candidate.type === "table") {
    return {
      ...defaultTableView(),
      ...candidate,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string"
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter,
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      columnSize:
        candidate.columnSize && typeof candidate.columnSize === "object"
          ? (candidate.columnSize as Record<string, number>)
          : {},
      imageAspectRatio:
        typeof candidate.imageAspectRatio === "number"
          ? candidate.imageAspectRatio
          : 1,
    };
  }

  if (candidate.type === "cards") {
    return {
      ...defaultCardsView(),
      ...candidate,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string"
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter,
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      summaries:
        candidate.summaries && typeof candidate.summaries === "object"
          ? (candidate.summaries as Record<string, string>)
          : undefined,
      groupBy:
        candidate.groupBy && typeof candidate.groupBy === "object"
          ? candidate.groupBy
          : undefined,
      image: typeof candidate.image === "string" ? candidate.image : "",
      imageFit:
        candidate.imageFit === "cover" || candidate.imageFit === "contain"
          ? candidate.imageFit
          : "contain",
      imageAspectRatio:
        typeof candidate.imageAspectRatio === "number"
          ? candidate.imageAspectRatio
          : 1,
      cardSize:
        typeof candidate.cardSize === "number" ? candidate.cardSize : 200,
    };
  }

  if (candidate.type === "list" || candidate.type === "map") {
    return {
      type: candidate.type,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string"
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter,
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      summaries:
        candidate.summaries && typeof candidate.summaries === "object"
          ? (candidate.summaries as Record<string, string>)
          : undefined,
      groupBy:
        candidate.groupBy && typeof candidate.groupBy === "object"
          ? candidate.groupBy
          : undefined,
    } as AnyBasesView;
  }

  if (candidate.type === "kanban" || candidate.type === "activity") {
    return {
      ...candidate,
      type: candidate.type,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string"
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter,
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      summaries:
        candidate.summaries && typeof candidate.summaries === "object"
          ? (candidate.summaries as Record<string, string>)
          : undefined,
      groupBy:
        candidate.groupBy && typeof candidate.groupBy === "object"
          ? candidate.groupBy
          : undefined,
      titleProperty:
        typeof candidate.titleProperty === "string"
          ? candidate.titleProperty
          : undefined,
      columnOrder: Array.isArray(candidate.columnOrder)
        ? candidate.columnOrder.filter(
            (value): value is string => typeof value === "string"
          )
        : undefined,
      columnMeta:
        candidate.columnMeta && typeof candidate.columnMeta === "object"
          ? (candidate.columnMeta as Record<
              string,
              { title?: string; color?: string }
            >)
          : undefined,
    } as AnyBasesView;
  }

  if (typeof candidate.type === "string" && candidate.type.length > 0) {
    return {
      ...defaultCustomView(candidate.type),
      ...candidate,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string"
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter,
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      summaries:
        candidate.summaries && typeof candidate.summaries === "object"
          ? (candidate.summaries as Record<string, string>)
          : undefined,
      groupBy:
        candidate.groupBy && typeof candidate.groupBy === "object"
          ? candidate.groupBy
          : undefined,
    };
  }

  return null;
}

export function normalizeBasesDocument(input: unknown): BasesDocument {
  const candidate =
    input && typeof input === "object" ? (input as Partial<BasesDocument>) : {};
  const views = Array.isArray(candidate.views)
    ? candidate.views
        .map((view, index) => normalizeView(view, `View ${index + 1}`))
        .filter((view): view is AnyBasesView => !!view)
    : [];
  const normalizedViews = views.length ? views : [defaultTableView()];
  const activeView =
    typeof candidate.activeView === "string" &&
    normalizedViews.some((view) => view.name === candidate.activeView)
      ? candidate.activeView
      : normalizedViews[0].name;

  return {
    filters: normalizeFilters(candidate.filters),
    properties:
      candidate.properties && typeof candidate.properties === "object"
        ? candidate.properties
        : {},
    formulas:
      candidate.formulas && typeof candidate.formulas === "object"
        ? candidate.formulas
        : {},
    summaries:
      candidate.summaries && typeof candidate.summaries === "object"
        ? candidate.summaries
        : {},
    activeView,
    views: normalizedViews,
  };
}
