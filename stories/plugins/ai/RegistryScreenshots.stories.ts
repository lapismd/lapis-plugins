import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";
import AiWorkspaceDemo from "./shell/ShellDemo.svelte";

const meta = {
  title: "Plugins/AI/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: WORKSPACE_SHELL_DOCS_PARAMETERS,
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChatWithToolActivity: Story = {
  name: "Chat with tool activity",
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
