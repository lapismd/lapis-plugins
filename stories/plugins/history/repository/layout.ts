export type Placement =
  | "middle"
  | "stacked"
  | "left"
  | "right"
  | "bottom"
  | "group";

export function repositoryLayout(placement: Placement, operations = false) {
  const view = {
    id: "repository",
    type: "leaf",
    state: {
      type: operations ? "repository-oplog" : "repository-history",
      state: {},
      title: operations ? "Repository Op Log" : "Repository History",
      icon: "git-branch",
    },
  };
  const group = {
    id: "repository-group",
    type: "sidebar-group",
    name: "History",
    icon: "git-branch",
    children: [view],
    collapsed: { repository: false },
    panelSizes: { repository: 100 },
  };
  type Item = typeof view | typeof group;
  const tabs = (id: string, children: Item[], stacked = false) => ({
    id,
    type: "tabs",
    stacked,
    currentTab: 0,
    children,
  });
  const dock = (id: string, children: Item[], width: string) => ({
    id,
    type: "split",
    direction: "vertical",
    sizes: [100],
    children: children.length ? [tabs(`${id}-tabs`, children)] : [],
    width,
  });
  const middle = placement === "middle" || placement === "stacked";
  return {
    main: {
      id: "main",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        tabs("main-tabs", middle ? [view] : [], placement === "stacked"),
      ],
    },
    left: dock(
      "left",
      placement === "left" ? [view] : placement === "group" ? [group] : [],
      placement === "left" || placement === "group" ? "24rem" : "0px"
    ),
    right: dock(
      "right",
      placement === "right" ? [view] : [],
      placement === "right" ? "24rem" : "0px"
    ),
    bottom: {
      ...tabs("bottom-panel", placement === "bottom" ? [group] : []),
      height: placement === "bottom" ? "28rem" : "0px",
    },
    floating: [],
    active: view.id,
  };
}
