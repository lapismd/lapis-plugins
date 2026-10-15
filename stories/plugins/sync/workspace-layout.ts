import type { SyncPaneKind } from "@lapis-notes/lapis-plugin-sync";
export type SyncPlacement =
  | "middle-top-tabs"
  | "stacked-tabs"
  | "left-sidebar"
  | "right-sidebar"
  | "bottom-panel"
  | "sidebar-group";
export const PLACEMENTS: Record<SyncPlacement, string> = {
  "middle-top-tabs": "Middle (Top Tabs)",
  "stacked-tabs": "Stacked Tabs",
  "left-sidebar": "Left Sidebar",
  "right-sidebar": "Right Sidebar",
  "bottom-panel": "Bottom Panel",
  "sidebar-group": "Sidebar As a Group",
};
const leaf = (
  id: string,
  type: string,
  title: string,
  state: Record<string, unknown> = {},
) => ({
  id,
  type: "leaf",
  state: {
    type,
    state,
    title,
    icon: type === "sync" ? "refresh-cw" : "history",
  },
});
const tabs = (id: string, children: unknown[], stacked = false) => ({
  id,
  type: "tabs",
  children,
  currentTab: stacked ? 1 : 0,
  stacked,
});
const split = (id: string, children: unknown[], width?: string) => ({
  id,
  type: "split",
  direction: "vertical",
  children,
  sizes: [100],
  ...(width ? { width } : {}),
});

export function syncPanelLayout(kind: SyncPaneKind, placement: SyncPlacement) {
  const type = kind === "sync" ? "sync" : `sync-${kind}`;
  const panel = leaf(
    "sync-panel",
    type,
    kind === "sync" ? "Sync" : "Sync History",
    kind === "file-history"
      ? { path: "README.md" }
      : kind === "compare"
        ? { path: "README.md", revisionId: "a".repeat(64) }
        : {},
  );
  const group = {
    id: "sync-group",
    type: "sidebar-group",
    title: "Sync & History",
    icon: "history",
    children: [panel],
  };
  const layout = {
    main: split("main", []),
    left: split("left", [], "0px"),
    right: split("right", [], "0px"),
    bottom: { ...tabs("bottom", []), height: "0px" },
    floating: [],
    active: "sync-panel",
  };
  if (placement === "middle-top-tabs")
    layout.main = split("main", [tabs("panel-tabs", [panel])]);
  if (placement === "stacked-tabs")
    layout.main = split("main", [
      tabs(
        "panel-tabs",
        [leaf("empty-tab", "empty", "Workspace"), panel],
        true,
      ),
    ]);
  if (placement === "left-sidebar")
    layout.left = split("left", [tabs("panel-tabs", [panel])], "24rem");
  if (placement === "right-sidebar")
    layout.right = split("right", [tabs("panel-tabs", [panel])], "24rem");
  if (placement === "bottom-panel")
    layout.bottom = { ...tabs("bottom", [group]), height: "24rem" };
  if (placement === "sidebar-group")
    layout.right = split("right", [tabs("panel-tabs", [group])], "24rem");
  return layout;
}

export function syncShellLayout(kind: SyncPaneKind = "history") {
  const type = kind === "sync" ? "sync" : `sync-${kind}`;
  return {
    main: split("main", [
      tabs("history-tabs", [
        leaf(
          "history",
          type,
          kind === "merge"
            ? "Merge"
            : kind === "sync"
              ? "Sync"
              : "Sync History",
          kind === "file-history"
            ? { path: "README.md" }
            : kind === "compare"
              ? { path: "README.md", revisionId: "a".repeat(64) }
              : {},
        ),
      ]),
    ]),
    left: split(
      "left",
      [tabs("explorer-tabs", [leaf("explorer", "file-explorer", "Files")])],
      "16rem",
    ),
    right: split(
      "right",
      [
        tabs("side-tabs", [
          leaf("sync", "sync", "Sync"),
          leaf("file-history", "sync-file-history", "File History", {
            path: "README.md",
          }),
          leaf("search", "search", "Search"),
        ]),
      ],
      "22rem",
    ),
    bottom: { ...tabs("bottom", []), height: "0px" },
    floating: [],
    active: "history",
  };
}
