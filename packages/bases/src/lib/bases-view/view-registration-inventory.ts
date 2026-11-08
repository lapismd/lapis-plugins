export const BUILT_IN_BASES_VIEW_ITEMS = [
  { id: "table", name: "Table", icon: "lucide-table" },
  { id: "unknown", name: "Unknown", icon: "lucide-file" },
  { id: "cards", name: "Cards", icon: "lucide-layout-grid" },
  { id: "list", name: "List", icon: "lucide-list" },
  { id: "kanban", name: "Kanban", icon: "lucide-kanban" },
  { id: "activity", name: "Activity", icon: "lucide-activity" },
  { id: "map", name: "Map", icon: "lucide-map" },
] as const;

export type BuiltInBasesViewId =
  (typeof BUILT_IN_BASES_VIEW_ITEMS)[number]["id"];
