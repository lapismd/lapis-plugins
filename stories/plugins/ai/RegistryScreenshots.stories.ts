import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";
import AiWorkspaceDemo from "./shell/ShellDemo.svelte";

const registrySource = pluginWorkspaceSource("@lapis-notes/ai", "AiPlugin");

const meta = {
  title: "Plugins/AI/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "App-backed AI workflows showing chat, conversation history, and the agent catalog in the Lapis workspace.",
      },
    },
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChatWithToolActivity: Story = {
  name: "Chat with tool activity",
  parameters: registryStoryParameters(
    registrySource,
    "A live chat trace shows assistant output alongside completed tool activity."
  ),
  render: (() => ({
    Component: AiWorkspaceDemo,
    props: { scenario: "registry-chat" },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
          "ready"
        );
      },
      { timeout: 12_000 }
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(
      () => {
        const leftSidebar = canvasElement.querySelector<HTMLElement>(
          '[data-workspace-surface="left-sidebar"]'
        );
        expect(leftSidebar?.getBoundingClientRect().width ?? 0).toBeLessThan(2);
        expect(within(panel).getByText("vault.read")).toBeVisible();
        expect(
          within(panel).getByRole("article", {
            name: "Message from assistant",
          })
        ).toHaveTextContent("Summary");
      },
      { timeout: 10_000 }
    );
  },
};

export const Overview: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "The complete AI workspace combines chat, conversation history, and the agent catalog."
  ),
  render: (() => ({
    Component: AiWorkspaceDemo,
    props: { scenario: "registry-overview" },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
          "ready"
        );
        expect(canvas.getByTestId("ai-chat-panel")).toHaveTextContent(
          "Summary"
        );
        expect(canvas.getByTestId("ai-conversation-history")).toBeVisible();
        expect(canvas.getByTestId("ai-catalog")).toBeVisible();
      },
      { timeout: 20_000 }
    );
  },
};

export const History: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "Conversation History is mounted in the right sidebar with seeded sessions."
  ),
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "ai-history",
      layout: "right-sidebar",
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitForRegistrySurface(
      canvasElement,
      '[data-testid="ai-conversation-history"]'
    );
  },
};

export const Catalog: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "The agent catalog lists the runtimes and agents available to the AI plugin."
  ),
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "ai-catalog",
      layout: "right-sidebar",
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitForRegistrySurface(canvasElement, '[data-testid="ai-catalog"]');
  },
};
