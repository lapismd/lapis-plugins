import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";
import AiWorkspaceDemo from "./shell/ShellDemo.svelte";

const meta = {
  title: "Plugins/AI/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: { layout: "fullscreen" },
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
          "ready",
        );
      },
      { timeout: 12_000 },
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(
      () => {
        expect(within(panel).getByText("vault.read")).toBeVisible();
        expect(
          within(panel).getByRole("article", {
            name: "Message from assistant",
          }),
        ).toHaveTextContent("Summary");
      },
      { timeout: 10_000 },
    );
  },
};

export const History: Story = {
  render: (() => ({
    Component: PanelDemo,
    props: { kind: "ai-history", layout: "right-sidebar" },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitForRegistrySurface(
      canvasElement,
      '[data-testid="ai-conversation-history"]',
    );
  },
};

export const Catalog: Story = {
  render: (() => ({
    Component: PanelDemo,
    props: { kind: "ai-catalog", layout: "right-sidebar" },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitForRegistrySurface(canvasElement, '[data-testid="ai-catalog"]');
  },
};
