import type { BasesOptions } from "@lapis-notes/api";
import { normalizeMetadataValue } from "@lapis-notes/api/metadata-value";
import { set, unset } from "lodash-es";
import {
  BasesView,
  BasesEntryGroup,
  QueryController,
  type BasesEntry,
  type BasesPropertyId,
} from "../bases.svelte";
import KanbanViewComponent from "./kanban.svelte";
import {
  groupIdentity,
  rawGroupValue,
  toColumnSources,
  valueToText,
  type KanbanColumnMeta,
  type KanbanColumnMetaMap,
} from "./mapping";
import { activityDateProperty } from "./configuration";
import { isFilterGroup, type Filters } from "../models";

/**
 * Kanban view: renders the grouped query result as a Design Core Kanban Board.
 * Grouping, ordering and per-column presentation persist in the view document;
 * card moves write the group value back to the grouped frontmatter property.
 */
export class KanbanBasesView extends BasesView {
  type: string = "kanban";

  constructor(
    readonly controller: QueryController,
    readonly scrollEl: HTMLElement,
    layout: "kanban" | "activity" = "kanban",
  ) {
    super(controller);
    this.type = layout;
    this.mountViewComponent(KanbanViewComponent, { view: this }, scrollEl);
  }

  onDataUpdated(): void {}

  static getViewOptions(): BasesOptions[] {
    return [
      {
        key: "titleProperty",
        type: "property",
        displayName: "Title property",
        default: "file.name",
      },
      {
        key: "chipProperty",
        type: "property",
        displayName: "Card chip property",
        placeholder: "Title",
      },
      {
        key: "descriptionProperty",
        type: "property",
        displayName: "Description property",
        placeholder: "Markdown body",
      },
      {
        key: "tagsProperty",
        type: "property",
        displayName: "Tags property",
        default: "file.tags",
      },
      {
        key: "badgeProperty",
        type: "property",
        displayName: "Badge property",
        placeholder: "No badge",
      },
      {
        key: "badgeLabel",
        type: "text",
        displayName: "Badge label",
        placeholder: "Property display name",
      },
      {
        key: "badgeColor",
        type: "text",
        displayName: "Badge colour",
        placeholder: "Column colour",
      },
    ];
  }

  get chipProperty(): BasesPropertyId | null {
    return this.config.getAsPropertyId("chipProperty");
  }

  get descriptionProperty(): BasesPropertyId | null {
    return this.config.getAsPropertyId("descriptionProperty");
  }
  get tagsProperty(): BasesPropertyId {
    return this.config.getAsPropertyId("tagsProperty") ?? "file.tags";
  }
  get badgeProperty(): BasesPropertyId | null {
    return this.config.getAsPropertyId("badgeProperty");
  }
  get badgeLabel(): string {
    const value = this.config.get("badgeLabel");
    return typeof value === "string" ? value : "";
  }
  get badgeColor(): string {
    const value = this.config.get("badgeColor");
    return typeof value === "string" ? value : "";
  }
  get dateProperty(): BasesPropertyId | null {
    return activityDateProperty(
      this.controller.selectedView,
      this.controller.getAllColumns(),
    );
  }
  get anchorColumnId(): string | null | undefined {
    const value = this.config.get("anchorColumnId");
    return value === null
      ? null
      : typeof value === "string"
        ? value
        : undefined;
  }
  setAnchorColumn(id: string | null | undefined): void {
    // BasesViewConfig.set(null) removes a setting. Null is a meaningful value
    // here, so retain it explicitly in the owning view document.
    if (id === null) this.controller.selectedView.anchorColumnId = null;
    else this.config.set("anchorColumnId", id);
  }
  get propertyLabels(): Record<string, string> {
    return Object.fromEntries(
      this.controller
        .getAllColumns()
        .map((column) => [column.id, column.displayName]),
    );
  }
  get propertyTypes(): Record<string, string> {
    return Object.fromEntries(
      this.controller.getAllColumns().map((column) => [column.id, column.type]),
    );
  }
  get columnFilters(): Record<string, Filters> {
    const value = this.config.get("columnFilters");
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(
      Object.entries(value).filter(([, filter]) => isFilterGroup(filter)),
    );
  }
  setColumnFilter(id: string, filter: Filters): void {
    this.config.set("columnFilters", { ...this.columnFilters, [id]: filter });
  }
  ensureColumnFilter(id: string): void {
    if (!this.columnFilters[id]) this.setColumnFilter(id, { and: [] });
  }
  filterGroups(): {
    groups: BasesEntryGroup[];
    totals: Record<string, number>;
  } {
    const totals: Record<string, number> = {};
    const property = this.data.groupBy ?? "";
    const groups = this.data.groupedData.map((group) => {
      const id = groupIdentity(property, group.key);
      totals[id] = group.entries.length;
      const filter = this.columnFilters[id];
      return new BasesEntryGroup(
        filter
          ? this.controller.filterEntries(group.entries, filter)
          : group.entries,
        group.key,
      );
    });
    return { groups, totals };
  }
  setGrouping(property: string): void {
    // Migrate legacy label-based presentation once, before changing its group scope.
    const current = this.data.groupBy;
    if (current) {
      const sources = toColumnSources(this.data.groupedData, current);
      const meta = { ...this.columnMeta };
      for (const source of sources) {
        if (meta[source.label]) {
          meta[source.id] ??= meta[source.label];
          delete meta[source.label];
        }
      }
      this.config.set("columnMeta", meta);
      this.setColumnOrder(
        this.columnOrder.map(
          (id) => sources.find((source) => source.label === id)?.id ?? id,
        ),
      );
    }
    this.config.set(
      "groupBy",
      property
        ? {
            property,
            direction: this.controller.selectedView.groupBy?.direction ?? "ASC",
          }
        : undefined,
    );
  }

  get titleProperty(): BasesPropertyId {
    return this.config.getAsPropertyId("titleProperty") ?? "file.name";
  }

  get canEditTitle(): boolean {
    return (
      !this.controller.readOnly &&
      (this.titleProperty === "file.name" ||
        this.titleProperty === "file.basename" ||
        (this.titleProperty.startsWith("note.") &&
          ["text", "unknown"].includes(
            this.controller.getColumn(this.titleProperty)?.type ?? "unknown",
          )))
    );
  }

  async saveTitle(entry: BasesEntry, title: string): Promise<string> {
    if (!this.canEditTitle)
      throw new Error("This title property is read-only.");
    if (this.titleProperty.startsWith("note.")) {
      await this.setGroupValue(entry, this.titleProperty, title);
    } else {
      if (
        !title.trim() ||
        /[\\/]/.test(title) ||
        title === "." ||
        title === ".."
      )
        throw new Error("Enter a valid file name.");
      const extension = entry.file.extension;
      const name =
        extension && !title.endsWith(`.${extension}`)
          ? `${title}.${extension}`
          : title;
      const directory = entry.file.path.slice(
        0,
        entry.file.path.lastIndexOf("/") + 1,
      );
      await this.controller.app.fileManager.renameFile(
        entry.file,
        directory + name,
      );
    }
    return entry.file.path;
  }

  get displayProperties(): BasesPropertyId[] {
    const title = this.titleProperty;
    return [
      ...new Set(
        this.config
          .getOrder()
          .filter((propertyId) => Boolean(propertyId) && propertyId !== title),
      ),
    ];
  }

  get columnOrder(): string[] {
    const configured = this.config.get("columnOrder");
    return Array.isArray(configured)
      ? configured.filter((value): value is string => typeof value === "string")
      : [];
  }

  get columnMeta(): KanbanColumnMetaMap {
    const configured = this.config.get("columnMeta");
    if (!configured || typeof configured !== "object") return {};
    return Object.fromEntries(
      Object.entries(configured as Record<string, unknown>).flatMap(
        ([columnId, value]) => {
          if (!value || typeof value !== "object") return [];
          const record = value as Record<string, unknown>;
          const title =
            typeof record.title === "string" && record.title.trim().length > 0
              ? record.title.trim()
              : undefined;
          const color =
            typeof record.color === "string" && record.color.trim().length > 0
              ? record.color.trim()
              : undefined;
          if (!title && !color) return [];
          return [[columnId, { title, color } satisfies KanbanColumnMeta]];
        },
      ),
    );
  }

  setColumnOrder(columnOrder: string[]): void {
    this.config.set("columnOrder", columnOrder);
  }

  setColumnMeta(columnId: string, meta: KanbanColumnMeta): void {
    const nextMeta = { ...this.columnMeta };
    const title = meta.title?.trim() ? meta.title.trim() : undefined;
    const color = meta.color?.trim() ? meta.color.trim() : undefined;
    if (!title && !color) {
      delete nextMeta[columnId];
    } else {
      nextMeta[columnId] = { title, color };
    }
    this.config.set(
      "columnMeta",
      Object.keys(nextMeta).length > 0 ? nextMeta : null,
    );
  }

  /** True when the grouped property can be written back on card moves. */
  get canMoveCards(): boolean {
    const groupBy = this.data.groupBy;
    return Boolean(
      !this.controller.readOnly &&
        groupBy &&
        groupBy.startsWith("note.") &&
        this.data.groupedData.every((group) => {
          const value = rawGroupValue(group.key);
          return (
            value === null ||
            ["string", "number", "boolean"].includes(typeof value)
          );
        }),
    );
  }

  openEntry(entry: BasesEntry): void {
    void this.controller.app.openFile(entry.file);
  }

  /** Writes the lane's group value to the entry's grouped property. */
  async setGroupValue(
    entry: BasesEntry,
    propertyId: BasesPropertyId,
    value: unknown,
  ): Promise<void> {
    if (this.controller.readOnly || !propertyId.startsWith("note.")) return;
    const id = propertyId.substring(5);
    const declaredType = this.controller.getColumn(propertyId)?.type ?? "text";
    const normalized =
      value === null ? null : normalizeMetadataValue(declaredType, value);
    await this.controller.app.fileManager.processFrontMatter(
      entry.file,
      (data) => {
        if (normalized === null || normalized === undefined) {
          unset(data, id);
        } else {
          set(data, id, normalized);
        }
      },
    );
  }

  findEntry(cardId: string): BasesEntry | null {
    return this.data.data.find((entry) => entry.id === cardId) ?? null;
  }
}

/** Independent Bases layout sharing the generic Markdown card mapping. */
export class ActivityBasesView extends KanbanBasesView {
  constructor(controller: QueryController, containerEl: HTMLElement) {
    super(controller, containerEl, "activity");
  }
  static getViewOptions(): BasesOptions[] {
    return [
      ...super.getViewOptions(),
      {
        key: "dateProperty",
        type: "property",
        displayName: "Activity date property",
        placeholder: "First date field in results",
      },
    ];
  }
}
