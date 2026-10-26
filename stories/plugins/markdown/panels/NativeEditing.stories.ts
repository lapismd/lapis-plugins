import { FileEmbed } from "@lapis-notes/markdown/embed";
import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NativePreviewDemo from "./NativePreviewDemo.svelte";
import type { NativePreviewFixture } from "./native-preview-fixture";

const meta = {
  title: "Plugins/Markdown/Native Editing Intent",
  component: FileEmbed,
  args: { app: undefined as unknown as App },
  tags: ["visual-pending", "!autodocs", "test"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FileEmbed>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ProtectedAdmissionAndHandoff: Story = {
  render: (() => ({ Component: NativePreviewDemo })) as NonNullable<
    Story["render"]
  >,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = await canvas.findByTestId("native-preview");
    await waitFor(() => expect(root).toHaveAttribute("data-ready", "true"));
    const fixture = (root as HTMLElement & { fixture: NativePreviewFixture })
      .fixture;
    let editor!: HTMLElement;
    await waitFor(() => {
      editor = root.querySelector<HTMLElement>(".cm-content")!;
      expect(editor).not.toBeNull();
      expect(editor).toHaveAttribute("contenteditable", "false");
    });
    await userEvent.click(editor);
    await userEvent.keyboard("Forbidden before admission");
    expect(await fixture.adapter.read(fixture.file.path)).toBe(
      fixture.original
    );
    expect(editor).not.toHaveTextContent("Forbidden before admission");
    await userEvent.click(
      canvas.getByRole("button", { name: "Release native admission" })
    );
    await waitFor(() =>
      expect(editor).toHaveAttribute("contenteditable", "true")
    );
    await userEvent.click(editor);
    await userEvent.keyboard(
      "{Control>}{End}{/Control}{Enter}A protected draft."
    );
    await fixture.app.fileEditingSessions.guard(fixture.file.path, async () => {
      expect(editor).toHaveAttribute("contenteditable", "false");
      expect(fixture.state()).toMatchObject({ active: false, dirty: false });
      expect(await fixture.adapter.read(fixture.file.path)).toContain(
        "A protected draft."
      );
      await userEvent.keyboard("Forbidden during handoff");
      const saved = await fixture.adapter.read(fixture.file.path);
      await fixture.adapter.write(
        fixture.file.path,
        `${saved}\nNative saved change.`
      );
    });
    expect(editor).not.toHaveTextContent("Forbidden during handoff");
    await waitFor(() =>
      expect(editor).toHaveAttribute("contenteditable", "true")
    );
    expect(fixture.state()).toMatchObject({ active: true, generation: 2 });
    await waitFor(() =>
      expect(editor).toHaveTextContent("Native saved change.")
    );
    await userEvent.click(editor);
    await userEvent.keyboard(
      "{Control>}{End}{/Control}{Enter}Next local draft."
    );
    await fixture.app.fileEditingSessions.guard(
      fixture.file.path,
      async () => {}
    );
    expect(await fixture.adapter.read(fixture.file.path)).toContain(
      "Next local draft."
    );
  },
};
