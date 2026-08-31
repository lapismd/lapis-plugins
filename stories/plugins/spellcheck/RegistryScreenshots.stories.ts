import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  showRegistryDiagnostics,
  showRegistryProblems,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Spell Check/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: WORKSPACE_SHELL_DOCS_PARAMETERS,
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const focusedEditor = (() => ({
  Component: PanelDemo,
  props: {
    kind: "explorer",
    layout: "left-sidebar",
    hideSidebars: true,
    diagnostics: "spellcheck",
  },
})) as NonNullable<Story["render"]>;

export const SuggestionsAndProblems: Story = {
  render: focusedEditor,
  play: async ({ canvasElement }) => {
    await showRegistryProblems(canvasElement, "Notes/Field notes.md", "harper");
  },
};

export const EditorActionPopover: Story = {
  name: "Editor action popover",
  render: focusedEditor,
  play: async ({ canvasElement }) => {
    await showRegistryDiagnostics(
      canvasElement,
      "Notes/Field notes.md",
      "harper"
    );
    const lintRange = [
      ...canvasElement.querySelectorAll<HTMLElement>(".cm-lintRange"),
    ].find((range) =>
      /recieved|accesibility|definately|seperate/u.test(range.textContent ?? "")
    );
    expect(lintRange).not.toBeNull();
    await userEvent.hover(lintRange!);
    const body = within(canvasElement.ownerDocument.body);
    const tooltip = await body.findByTestId("lapis-lint-tooltip");
    expect(within(tooltip).getByTestId("lapis-lint-source")).toHaveTextContent(
      /harper/i
    );
    const quickFix = within(tooltip).getByRole("button", {
      name: "Quick Fix",
    });
    expect(quickFix).toBeVisible();
    await userEvent.hover(tooltip);
  },
};

export const Overview: Story = {
  name: "Overview",
  render: SuggestionsAndProblems.render,
  play: SuggestionsAndProblems.play,
};
