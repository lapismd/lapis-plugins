import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TranscriptReading } from "@lapis-notes/transcripts";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";
import ReadingPanelDemo from "./ReadingPanelDemo.svelte";

const PLACEMENT_HOST: Record<PanelDemoLayout, string> = {
  "middle-top-tabs": "workspace-tabs",
  "stacked-tabs": "workspace-stacked-tabs",
  "left-sidebar": "workspace-sidebar",
  "right-sidebar": "workspace-sidebar",
  "bottom-panel": "workspace-bottom-panel-group",
  "sidebar-group": "workspace-sidebar-group",
};

const PLACEMENT_SURFACE: Record<PanelDemoLayout, string> = {
  "middle-top-tabs": "body",
  "stacked-tabs": "body",
  "left-sidebar": "left-sidebar",
  "right-sidebar": "right-sidebar",
  "bottom-panel": "bottom-panel",
  "sidebar-group": "right-sidebar",
};

const meta = {
  title: "Plugins/Transcripts/Panels/Reading",
  component: TranscriptReading,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Sample speaker turns in the shared workspace shell, with one saved comment and a compact audio footer, in every governed panel placement.",
      },
    },
  },
} satisfies Meta<typeof TranscriptReading>;

export default meta;
type Story = StoryObj<typeof meta>;

const transcriptReadingSource = `<script lang="ts">
  import type { App, WorkspaceLeaf } from "@lapis-notes/api";
  import { TranscriptReading } from "@lapis-notes/transcripts";

  let { app, leaf }: { app: App; leaf: WorkspaceLeaf } = $props();
</script>

<TranscriptReading {app} {leaf} />`;

function readingParameters(layout: PanelDemoLayout, description: string) {
  const { visualDelta: _visualDelta, ...parameters } = placementParameters(
    "reading",
    layout,
    transcriptReadingSource,
    description,
  );
  return parameters;
}

function placementStory(
  layout: PanelDemoLayout,
  description: string,
): Story {
  return {
    name: PANEL_PLACEMENTS[layout].name,
    parameters: readingParameters(layout, description),
    render: () => ({
      Component: ReadingPanelDemo,
      props: { layout },
    }),
    play: async ({ canvasElement }) => {
      await waitFor(
        () =>
          expect(
            canvasElement.querySelector('[data-status="ready"]'),
          ).not.toBeNull(),
        { timeout: 30_000 },
      );
      const canvas = within(canvasElement);
      if (layout === "middle-top-tabs") {
        const explorer = await waitFor(() => {
          const node = canvasElement.querySelector<HTMLElement>(
            '[data-ui-component="workspace-explorer"]',
          );
          expect(node?.closest('[aria-label="Left sidebar"]')).not.toBeNull();
          return node as HTMLElement;
        });
        const body = canvasElement.querySelector<HTMLElement>(
          '[data-workspace-surface="body"]',
        );
        expect(
          body?.querySelectorAll('[data-ui-component="workspace-tabs"]'),
        ).toHaveLength(1);
        await userEvent.click(
          within(explorer).getByRole("button", {
            name: /Contract transcript/,
          }),
        );
        await waitFor(() => {
          expect(within(body!).queryByText("New Tab")).toBeNull();
          expect(within(body!).queryByText("No file is open")).toBeNull();
        });
      }
      const reading = await waitFor(() =>
        canvas.getByTestId("transcript-reading"),
      );
      await expect(reading).toBeVisible();
      const host = reading.closest(
        `[data-ui-component="${PLACEMENT_HOST[layout]}"]`,
      );
      expect(host).not.toBeNull();
      const surface = reading.closest("[data-workspace-surface]");
      expect(surface).toHaveAttribute(
        "data-workspace-surface",
        PLACEMENT_SURFACE[layout],
      );
      if (layout === "left-sidebar" || layout === "right-sidebar") {
        expect(host).toHaveAttribute(
          "data-workspace-sidebar-side",
          layout === "left-sidebar" ? "left" : "right",
        );
      }
      if (layout === "bottom-panel" || layout === "sidebar-group") {
        const header = host?.querySelector(
          'button[data-ui-part="panel-header"]',
        );
        expect(header).toHaveAttribute("aria-expanded", "true");
      }
      await expect(
        canvas.getByRole("region", { name: "Transcript" }),
      ).toBeVisible();
      await expect(canvas.getAllByText("Speaker 1").length).toBeGreaterThan(0);
      await expect(canvas.getByText("2 speakers")).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: /^Play$/ }),
      ).toBeVisible();
      await expect(
        canvas.getByText("Check this wording against the signed agreement."),
      ).toBeVisible();
      const document = reading.querySelector<HTMLElement>(
        ".ui-transcript-document",
      );
      expect(document).not.toBeNull();
      const padding = getComputedStyle(document!);
      expect(padding.paddingTop).toBe(padding.paddingRight);
      expect(padding.paddingRight).toBe(padding.paddingBottom);
      expect(padding.paddingBottom).toBe(padding.paddingLeft);
      const viewport = reading.querySelector<HTMLElement>(
        '[data-ui-part="scroll-area-viewport"]',
      );
      expect(viewport).not.toBeNull();
      expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
      viewport!.scrollTop = 240;
      expect(viewport!.scrollTop).toBeGreaterThan(0);
      const status = canvas.getByTestId("transcript-reading-status");
      const speakerAvatars = [
        ...reading.querySelectorAll<HTMLElement>(
          '.ui-transcript-message-avatar [data-ui-component="avatar"]',
        ),
      ];
      const commentAvatars = [
        ...reading.querySelectorAll<HTMLElement>(
          '.ui-transcript-comment-card [data-ui-component="avatar"]',
        ),
      ];
      expect(speakerAvatars.length).toBeGreaterThan(1);
      expect(
        speakerAvatars.every((avatar) => avatar.dataset.shape === "circle"),
      ).toBe(true);
      const avatarBackgrounds = new Set(
        speakerAvatars.map(
          (avatar) =>
            getComputedStyle(avatar.querySelector('[data-ui-part="content"]')!)
              .backgroundColor,
        ),
      );
      expect(avatarBackgrounds.size).toBeGreaterThan(1);
      expect(getComputedStyle(speakerAvatars[0]!).width).toBe("32px");
      expect(commentAvatars.length).toBeGreaterThan(0);
      expect(getComputedStyle(commentAvatars[0]!).width).toBe("24px");
      expect(getComputedStyle(status).height).toBe("32px");
      expect(getComputedStyle(status).backgroundColor).toBe("rgb(255, 255, 255)");
      const controls = within(status);
      await expect(controls.getByRole("slider", { name: "Seek" })).toBeVisible();
      await expect(controls.getByRole("button", { name: "Mute" })).toBeVisible();
      if (layout === "middle-top-tabs") {
        await expect(
          controls.getByRole("slider", { name: "Volume" }),
        ).toBeVisible();
        await expect(
          controls.getByRole("button", { name: /Playback speed/ }),
        ).toBeVisible();
        await expect(
          controls.getByRole("button", { name: "Back 10 seconds" }),
        ).toBeVisible();
      }
      await userEvent.click(canvas.getByRole("button", { name: "Source" }));
      await waitFor(() => {
        const editor = canvasElement.querySelector(
          '[data-ui-component="markdown-editing-surface"]',
        );
        expect(editor).not.toBeNull();
        expect(editor?.textContent).toContain("Contract transcript");
      });
      if (layout === "middle-top-tabs" || layout === "stacked-tabs") {
        await userEvent.click(
          canvas.getByRole("button", { name: /Click to open Transcript/ }),
        );
        await waitFor(() => {
          expect(canvas.getByTestId("transcript-reading")).toBeVisible();
        });
      }
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  "Reading in the middle workspace. Open Explorer reveals the file tree, and choosing the sample note opens it in the existing tab.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  "Reading selected inside the stacked-tabs presentation.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  "Reading in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  "Reading in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  "Reading inside the grouped bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  "Reading inside a grouped right-sidebar item.",
);
