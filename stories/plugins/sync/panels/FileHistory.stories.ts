import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SyncWorkspaceDemo from "../SyncWorkspaceDemo.svelte";
import { exerciseSyncPane } from "../story-assertions";
import { PLACEMENTS, type SyncPlacement } from "../workspace-layout";
const meta = {
  title: "Plugins/Sync/Panels/File History",
  component: SyncWorkspaceDemo,
  tags: ["!autodocs", "visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The installed File History pane in each supported workspace destination.",
      },
    },
  },
} satisfies Meta<typeof SyncWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
function placement(placement: SyncPlacement): Story {
  return {
    name: PLACEMENTS[placement],
    args: { options: { kind: "file-history", placement } },
    parameters: {
      docs: {
        description: { story: `File History in ${PLACEMENTS[placement]}.` },
      },
      visualDelta: {
        images: [
          `/visual-baselines/stories/plugins/sync/panels/file-history/${placement}-chromium.png`,
        ],
      },
    },
    play: ({ canvasElement }) =>
      exerciseSyncPane(canvasElement, "file-history", placement),
  };
}
export const MiddleTopTabs = placement("middle-top-tabs");
export const StackedTabs = placement("stacked-tabs");
export const LeftSidebar = placement("left-sidebar");
export const RightSidebar = placement("right-sidebar");
export const BottomPanel = placement("bottom-panel");
export const SidebarGroup = placement("sidebar-group");
