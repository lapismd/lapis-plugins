import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import { registryPanelApp } from "../_shared/registry/registry-story-helpers";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";
import RegistryDemo from "./RegistryDemo.svelte";

const registrySource = pluginWorkspaceSource(
  "@lapis-notes/transcripts",
  "TranscriptsPlugin",
);

const meta = {
  title: "Plugins/Transcripts/Registry Screenshots",
  component: RegistryDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "An app-backed spoken transcript, and the same call embedded in a meeting note. Both sidebars stay closed.",
      },
    },
  },
} satisfies Meta<typeof RegistryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function shellRender(document: "reading" | "embedded"): Story["render"] {
  return (() => ({
    Component: RegistryDemo,
    props: { document },
  })) as Story["render"];
}

function expectClosedSidebars(canvasElement: HTMLElement): void {
  for (const side of ["left-sidebar", "right-sidebar"]) {
    const surface = canvasElement.querySelector<HTMLElement>(
      `[data-workspace-surface="${side}"]`,
    );
    expect(surface?.getBoundingClientRect().width ?? 0).toBeLessThan(2);
  }
}

export const Overview: Story = {
  name: "Overview",
  parameters: registryStoryParameters(
    registrySource,
    "The spoken sample fills the shell with both sidebars closed.",
  ),
  render: shellRender("reading"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        const reading = canvasElement.querySelector<HTMLElement>(
          '[data-testid="transcript-reading"]',
        );
        expect(reading?.checkVisibility()).toBe(true);
        expect(reading?.textContent).toContain("mass page");
        expect(
          reading
            ?.querySelector(
              '.ui-transcript-message-avatar [data-ui-component="avatar"]',
            )
            ?.checkVisibility(),
        ).toBe(true);
        expect(canvas.getAllByText("Speaker 1").length).toBeGreaterThan(0);
        expect(
          canvas.getByText("Check this wording against the signed agreement."),
        ).toBeVisible();
        expect(canvas.getByRole("button", { name: /^Play$/ })).toBeVisible();
        expect(canvas.getByText("2 speakers")).toBeVisible();
        expectClosedSidebars(canvasElement);
      },
      { timeout: 12_000 },
    );
  },
};

export const Embedded: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "A meeting note keeps the spoken call inside a Markdown embed.",
  ),
  render: shellRender("embedded"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitFor(
      () => {
        const embedded = canvasElement.querySelector<HTMLElement>(
          ".transcript-reading-embedded",
        );
        expect(embedded?.checkVisibility()).toBe(true);
        expect(embedded?.textContent).toContain("mass page");
        expect(
          embedded?.closest(".mira-embed")?.querySelector("figcaption")
            ?.textContent,
        ).toBe("Contract transcript.md");
        const hosts = [...canvasElement.querySelectorAll("p")].filter(
          (node) =>
            node.checkVisibility() &&
            node.textContent?.includes(
              "The signed wording sits in the recording.",
            ) &&
            !embedded?.contains(node),
        );
        expect(hosts).toHaveLength(1);
        expectClosedSidebars(canvasElement);
      },
      { timeout: 12_000 },
    );
  },
};
