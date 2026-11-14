import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import { mount, unmount, type ComponentProps } from "svelte";
import TranscriptFileEmbed from "../../../packages/transcripts/src/lib/TranscriptFileEmbed.svelte";

type Adapter = NonNullable<
  ComponentProps<typeof TranscriptFileEmbed>["adapter"]
>;
const meta = {
  title: "Plugins/Transcripts/Embed Lifecycle",
  component: TranscriptFileEmbed,
  tags: ["!autodocs", "visual-pending"],
  args: { href: "" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof TranscriptFileEmbed>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PendingRendererTeardown: Story = {
  play: async ({ canvasElement }) => {
    const target = document.createElement("div");
    canvasElement.append(target);
    let finish!: (cleanup: () => void) => void;
    let signal: AbortSignal | undefined;
    let started = false;
    let cleanups = 0;
    const adapter: Adapter = {
      resolveLink: () => ({ path: "Agenda.md" }),
      renderEmbed: (_file, _element, context) => {
        started = true;
        signal = context?.signal;
        return new Promise<() => void>((resolve) => {
          finish = resolve;
        });
      },
    };
    let mounted = true;
    const component = mount(TranscriptFileEmbed, {
      target,
      props: { adapter, href: "Agenda.md" },
    });
    try {
      await waitFor(() => expect(started).toBe(true));
      await unmount(component);
      mounted = false;
      expect(signal?.aborted).toBe(true);
      finish(() => {
        cleanups++;
      });
      await waitFor(() => expect(cleanups).toBe(1));
      expect(target.textContent).toBe("");
    } finally {
      if (mounted) await unmount(component);
      target.remove();
    }
  },
};

export const AsyncDeclineUsesMarkdown: Story = {
  args: {
    href: "Agenda.md",
    adapter: {
      resolveLink: () => ({ path: "Agenda.md" }),
      renderEmbed: async () => false,
      readMarkdown: async () => "Agenda fallback body",
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.textContent).toContain("Agenda fallback body"),
    );
  },
};
