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
      const findToggle = view.getByRole("button", { name: "Find and replace" });
      await userEvent.click(findToggle);
      await waitFor(() => {
        expect(view.getByRole("textbox", { name: "Find" })).toBeVisible();
      });
      expect(findToggle).toHaveAttribute("aria-pressed", "true");
      await userEvent.click(findToggle);
      await waitFor(() => {
        expect(view.queryByRole("textbox", { name: "Find" })).toBeNull();
      });
      await expect(view.getByRole("button", { name: /^Play$/ })).toBeEnabled();
      await waitFor(() => {
        expect(view.getByRole("link", { name: "recording terms" })).toBeVisible();
      });
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
      expect(Number.parseFloat(padding.paddingTop)).toBeGreaterThan(
        Number.parseFloat(padding.paddingRight),
      );
      expect(padding.paddingRight).toBe(padding.paddingBottom);
      expect(padding.paddingBottom).toBe(padding.paddingLeft);
      const viewport = reading.querySelector<HTMLElement>(
        '[data-ui-part="scroll-area-viewport"]',
      );
      expect(viewport).not.toBeNull();
      viewport!.scrollTop = 0;
      const firstBlock = [
        ...reading.querySelectorAll<HTMLElement>(".ui-transcript-text-block"),
      ].find((node) => !node.closest(".ui-transcript-markdown-preview"));
      expect(firstBlock).toBeTruthy();
      firstBlock!.tabIndex = -1;
      firstBlock!.focus();
      const firstActions = firstBlock!.querySelector<HTMLElement>(
        ":scope > .ui-transcript-text-actions",
      );
      expect(firstActions).toBeTruthy();
      const firstActionBox = firstActions!.getBoundingClientRect();
      const portBox = viewport!.getBoundingClientRect();
      expect(getComputedStyle(firstActions!).opacity).not.toBe("0");
      expect(firstActionBox.top).toBeGreaterThanOrEqual(portBox.top - 1);
      expect(firstActionBox.height).toBeGreaterThan(0);
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
      const timeSeparators = [
        ...reading.querySelectorAll<HTMLElement>(
          '.ui-transcript-message-metadata [data-ui-part="timestamp"] + [data-ui-part="separator"]',
        ),
      ];
      expect(
        timeSeparators.filter(
          (separator) => getComputedStyle(separator).display !== "none",
        ),
      ).toHaveLength(0);
      const commented = view
        .getAllByText("Check this wording against the signed agreement.")
        .find((node) => node.checkVisibility())
        ?.closest<HTMLElement>("[data-chat-item]");
      expect(commented).toBeTruthy();
      const commentedBlock = commented!.querySelector<HTMLElement>(
        ".ui-transcript-text-block",
      );
      expect(commentedBlock).toBeTruthy();
      commentedBlock!.tabIndex = -1;
      commentedBlock!.focus();
      await userEvent.click(
        within(commented!).getByRole("button", { name: /More actions/ }),
      );
      const removeMenu = await waitFor(() => {
        const menu = [
          ...canvasElement.ownerDocument.querySelectorAll<HTMLElement>(
            ".ui-message-actions__menu, [data-ui-part='dropdown-menu-content']",
          ),
        ].find((node) => node.textContent?.includes("Remove comment"));
        expect(menu, "remove comment menu").not.toBeNull();
        expect(
          within(menu!).getByRole("menuitem", { name: "Remove comment" }),
        ).toBeVisible();
        return menu!;
      });
      const removeItem = within(removeMenu).getByRole("menuitem", {
        name: "Remove comment",
      });
      expect(removeItem.querySelector("svg")).not.toBeNull();
      expect(removeMenu.scrollWidth).toBeLessThanOrEqual(
        removeMenu.clientWidth + 1,
      );
      expect(removeMenu.scrollHeight).toBeLessThanOrEqual(
        removeMenu.clientHeight + 1,
      );
      await userEvent.keyboard("{Escape}");
      const avatarColumn = speakerAvatars[0]!.getBoundingClientRect().left;
      await userEvent.click(view.getByRole("button", { name: /^Play$/ }));
      let playingMessage: HTMLElement | null = null;
      try {
        playingMessage = await waitFor(
          () => {
            const message = reading.querySelector<HTMLElement>(
              '[data-playing="true"] .ui-transcript-message',
            );
            if (!message) throw new Error("waiting for playback");
            return message;
          },
          { timeout: 1500 },
        );
      } catch {
        playingMessage = null;
      }
      if (playingMessage) {
        const playingAvatar = playingMessage.querySelector<HTMLElement>(
          '.ui-transcript-message-avatar [data-ui-component="avatar"]',
        );
        expect(playingAvatar, "playing avatar").not.toBeNull();
        expect(
          Math.abs(playingAvatar!.getBoundingClientRect().left - avatarColumn),
        ).toBeLessThan(1);
        const playingStyle = getComputedStyle(playingMessage);
        expect(Number.parseFloat(playingStyle.paddingTop)).toBeGreaterThan(0);
        expect(Number.parseFloat(playingStyle.marginTop)).toBeLessThan(0);
        expect(
          playingMessage.querySelector(".transcript-reading-sound"),
          "playing sound",
        ).not.toBeNull();
        const playingSeparator = playingMessage.querySelector<HTMLElement>(
          '[data-ui-part="timestamp"] + [data-ui-part="separator"]',
        );
        expect(playingSeparator, "playing separator").not.toBeNull();
        expect(getComputedStyle(playingSeparator!).display).not.toBe("none");
        await userEvent.click(
          within(playingMessage).getByRole("button", { name: "Pause" }),
        );
        await waitFor(() => {
          expect(reading.querySelector('[data-playing="true"]')).toBeNull();
        });
      } else {
        const item = reading.querySelector<HTMLElement>("[data-chat-item]");
        const separator = item?.querySelector<HTMLElement>(
          '.ui-transcript-message-metadata [data-ui-part="timestamp"] + [data-ui-part="separator"]',
        );
        if (separator) {
          item!.dataset.playing = "true";
          expect(getComputedStyle(separator).display).not.toBe("none");
          delete item!.dataset.playing;
          expect(getComputedStyle(separator).display).toBe("none");
        }
      }
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
        expect(editor?.textContent).toContain("audio: recordings/meeting.m4a");
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
            expect(canvas.queryByRole("button", { name: /^Play$/ })).toBeNull();
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
        await (
          lapisApp?.commands as {
            executeCommand: (id: string) => Promise<unknown>;
          }
        ).executeCommand("lapis-transcripts:open-transcript");
        await waitFor(() => {
          const transcript = [
            ...canvasElement.querySelectorAll<HTMLElement>(
              '[data-testid="transcript-reading"]',
            ),
          ].find(
            (node) =>
              node.checkVisibility() &&
              node.textContent?.includes(sampleEmbeddedNote.marker),
          );
          expect(transcript).toBeTruthy();
          const preview = transcript!.querySelector<HTMLElement>(
            ".ui-transcript-markdown-preview.mira-embed",
          );
          expect(preview?.querySelector("figcaption")?.textContent).toBe(
            "Contract transcript.md",
          );
          expect(getComputedStyle(preview!).borderInlineStartWidth).toBe("2px");
          const embedded = preview!.querySelector<HTMLElement>(
            ".transcript-reading-embedded",
          );
          expect(embedded).toBeTruthy();
          const frame = getComputedStyle(embedded!);
          expect(frame.borderTopWidth).toBe("1px");
          expect(frame.borderTopStyle).toBe("solid");
          expect(frame.borderRadius).not.toBe("0px");
          expect(
            within(transcript!).getByRole("link", { name: "recording terms" }),
          ).toBeVisible();
        });
        const preview = [
          ...canvasElement.querySelectorAll<HTMLElement>(
            '[data-testid="transcript-reading"]',
          ),
        ]
          .find(
            (node) =>
              node.checkVisibility() &&
              node.textContent?.includes(sampleEmbeddedNote.marker),
          )
          ?.querySelector<HTMLElement>(".ui-transcript-markdown-preview.mira-embed");
        const turn = preview?.querySelector<HTMLElement>(
          ".ui-transcript-text-block",
        );
        const actions = [
          ...preview!.querySelectorAll<HTMLElement>(".ui-transcript-text-actions"),
        ];
        expect(turn).toBeTruthy();
        expect(actions.length).toBeGreaterThan(1);
        // Focus uses the same reveal rule as hover, and it stays inside this turn.
        turn!.tabIndex = -1;
        turn!.focus();
        const visibleActions = actions.filter(
          (node) => getComputedStyle(node).opacity !== "0",
        );
        expect(visibleActions).toHaveLength(1);
        const embedded = preview!.querySelector<HTMLElement>(
          ".transcript-reading-embedded",
        );
        const actionBox = visibleActions[0]!.getBoundingClientRect();
        const frameBox = embedded!.getBoundingClientRect();
        const documentList = embedded!.querySelector<HTMLElement>(
          "ol.ui-transcript-document",
        );
        expect(documentList).toBeTruthy();
        expect(getComputedStyle(documentList!).listStyleType).toBe("none");
        expect(
          getComputedStyle(documentList!.querySelector(":scope > li")!)
            .marginInlineStart,
        ).toBe("0px");
        const pad = getComputedStyle(documentList!).paddingTop;
        expect(
          actionBox.top,
          `padding ${pad}; action ${actionBox.top}; frame ${frameBox.top}`,
        ).toBeGreaterThanOrEqual(frameBox.top - 1);
        const surface = preview!.querySelector<HTMLElement>(
          "[data-ui-component='transcript']",
        );
        surface!.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "f",
            metaKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
        await waitFor(() => {
          expect(
            within(surface!).getByRole("textbox", { name: "Find" }),
          ).toBeVisible();
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
