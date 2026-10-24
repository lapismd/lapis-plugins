import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  TranscriptReading,
  sampleEmbeddedNote,
  samplePlainTranscript,
  sampleTranscriptFormats,
} from "@lapis-notes/transcripts";
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

  let { app, leaf, filePath }: {
    app: App;
    leaf: WorkspaceLeaf;
    filePath: string;
  } = $props();
</script>

<TranscriptReading {app} {leaf} mode="file" {filePath} />`;

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
      const lapisApp = await waitFor(() => {
        const owned = canvasElement.querySelector(
          "[data-testid='panel-demo']",
        ) as
          | (HTMLElement & {
              __lapisApp?: {
                commands: { commands: Record<string, { name: string }> };
                workspace: {
                  getLeavesOfType: (type: string) => Array<{
                    view: {
                      onPaneMenu: (
                        menu: {
                          addItem: (callback: (item: {
                            setSection: () => unknown;
                            setTitle: (title: string) => unknown;
                            setIcon: () => unknown;
                            setChecked: () => unknown;
                            onClick: () => unknown;
                          }) => void) => unknown;
                          addSeparator: () => unknown;
                        },
                        source: string,
                      ) => void;
                    };
                  }>;
                };
              };
            })
          | null;
        const app = owned?.__lapisApp;
        expect(app?.commands.commands["lapis-transcripts:open-transcript"]?.name).toBe(
          "Transcripts: Open transcript",
        );
        return app;
      });
      if (layout === "middle-top-tabs") {
        const menuTitles: string[] = [];
        const menu = {
            addItem(callback) {
              const item = {
                setSection() {
                  return item;
                },
                setTitle(title: string) {
                  menuTitles.push(title);
                  return item;
                },
                setIcon() {
                  return item;
                },
                setChecked() {
                  return item;
                },
                onClick() {
                  return item;
                },
              };
              callback(item);
              return menu;
            },
            addSeparator() {
              return menu;
            },
        };
        lapisApp?.workspace
          .getLeavesOfType("markdown")[0]
          ?.view.onPaneMenu(menu, "more-options");
        expect(menuTitles).toContain("Open transcript");
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
        expect(within(body!).queryByText("New Tab")).toBeNull();
        expect(
          within(body!).getAllByText("Contract transcript.md").length,
        ).toBeGreaterThan(0);
        expect(
          within(body!).getAllByText("Time first transcript.md").length,
        ).toBeGreaterThan(0);
        expect(
          within(body!).getAllByText(samplePlainTranscript.title).length,
        ).toBeGreaterThan(0);
        await waitFor(() => {
          const editor = body!.querySelector(
            '[data-ui-component="markdown-editing-surface"]',
          );
          expect(editor?.textContent).toContain(samplePlainTranscript.marker);
        });
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
      const reading = await waitFor(() => {
        const visible = [
          ...canvasElement.querySelectorAll<HTMLElement>(
            '[data-testid="transcript-reading"]',
          ),
        ].filter((node) => node.checkVisibility());
        expect(visible).toHaveLength(1);
        return visible[0]!;
      });
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
      const view = within(reading);
      await expect(
        view.getByRole("region", { name: "Transcript" }),
      ).toBeVisible();
      await expect(view.getAllByText("Speaker 1").length).toBeGreaterThan(0);
      await expect(view.getByText("2 speakers")).toBeVisible();
      await expect(view.getByRole("button", { name: /^Play$/ })).toBeEnabled();
      await waitFor(() => {
        expect(
          view
            .getAllByText("Check this wording against the signed agreement.")
            .filter((node) => node.checkVisibility()),
        ).toHaveLength(1);
      });
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
      const status = view.getByTestId("transcript-reading-status");
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
      await userEvent.click(view.getByRole("button", { name: "Source" }));
      await waitFor(() => {
        const editor = [
          ...canvasElement.querySelectorAll<HTMLElement>(
            '[data-ui-component="markdown-editing-surface"]',
          ),
        ].find((node) => node.checkVisibility());
        expect(editor).not.toBeNull();
        expect(editor?.textContent).toContain("mass page");
      });
      if (layout === "middle-top-tabs" || layout === "stacked-tabs") {
        await userEvent.click(
          canvas.getByRole("button", { name: /Click to open Transcript/ }),
        );
        await waitFor(() => {
          const visible = [
            ...canvasElement.querySelectorAll<HTMLElement>(
              '[data-testid="transcript-reading"]',
            ),
          ].filter((node) => node.checkVisibility());
          expect(visible).toHaveLength(1);
        });
      }
      if (layout === "middle-top-tabs") {
        const explorer = canvasElement.querySelector<HTMLElement>(
          '[data-ui-component="workspace-explorer"]',
        );
        expect(explorer).not.toBeNull();
        for (const format of sampleTranscriptFormats) {
          await userEvent.click(
            within(explorer!).getByRole("button", { name: format.title }),
          );
          await waitFor(() => {
            expect(canvas.getByText(format.marker)).toBeVisible();
          });
        }
        await userEvent.click(
          within(explorer!).getByRole("button", { name: /Contract transcript/ }),
        );
        await waitFor(() => {
          const notes = [...canvasElement.querySelectorAll("p")].filter(
            (node) =>
              node.checkVisibility() &&
              node.textContent?.includes(
                "Check this wording against the signed agreement.",
              ),
          );
          expect(notes).toHaveLength(1);
        });
        await userEvent.click(
          within(explorer!).getByRole("button", {
            name: samplePlainTranscript.title,
          }),
        );
        await waitFor(() => {
          const editor = [
            ...canvasElement.querySelectorAll<HTMLElement>(
              '[data-ui-component="markdown-editing-surface"]',
            ),
          ].find((node) => node.checkVisibility());
          expect(editor?.textContent).toContain(samplePlainTranscript.marker);
        });
        const read = [...canvasElement.querySelectorAll("button")].find(
          (button) =>
            button.checkVisibility() &&
            (button.getAttribute("aria-label") ?? "").includes("Click to read"),
        );
        expect(read).toBeTruthy();
        await userEvent.click(read!);
        await waitFor(() => {
          const readings = [
            ...canvasElement.querySelectorAll<HTMLElement>(
              '[data-testid="transcript-reading"]',
            ),
          ].filter((node) => node.checkVisibility());
          expect(
            readings.some((node) => node.textContent?.includes("mass page")),
          ).toBe(true);
          const agenda = canvas.getByText(sampleEmbeddedNote.marker);
          expect(agenda.closest('[data-testid="transcript-reading"]')).toBeNull();
        });
      }
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  "Reading in the middle workspace. Notes ending in transcript.md open in the reading view. Draft meeting.md is a transcript whose name does not match, so it opens in the Markdown editor.",
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
