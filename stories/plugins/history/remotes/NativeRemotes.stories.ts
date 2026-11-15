import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NativeRemotesDemo from "./NativeRemotesDemo.svelte";
import {
  cleanupNativeRemotesStories,
  nativeRemotesStoryFor,
} from "./native-runtime.svelte";
const meta = {
  title: "Plugins/History/Repository/Native remote composition",
  component: NativeRemotesDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: {
    layout: "fullscreen",
    catalogLayout: "full-viewport",
    a11y: { test: "error" },
  },
  beforeEach: () => cleanupNativeRemotesStories,
} satisfies Meta<typeof NativeRemotesDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function settings(canvas: HTMLElement) {
  const runtime = nativeRemotesStoryFor(canvas);
  runtime.plugin.remotes!.manage("original");
  await expect(
    await within(canvas).findByRole(
      "heading",
      { name: "Remotes and credentials" },
      { timeout: 30_000 }
    )
  ).toBeVisible();
  const original = within(
    within(canvas).getByRole("region", { name: "Original repository" })
  );
  await waitFor(() =>
    expect(original.getByRole("textbox", { name: "Remote name" })).toHaveFocus()
  );
  return runtime;
}
export const Server: Story = {
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole(
      "group",
      { name: "JJ Log header" },
      { timeout: 30_000 }
    );
    const runtime = await settings(canvasElement);
    await expect(
      within(canvasElement).getByText(/server’s encrypted credential store/)
    ).toBeVisible();
    await expect(runtime.commands).toEqual([]);
  },
};
export const Desktop: Story = {
  args: { host: "desktop" },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole(
      "group",
      { name: "JJ Log header" },
      { timeout: 30_000 }
    );
    await settings(canvasElement);
    await expect(
      within(canvasElement).getByText(/this computer’s OS credential store/)
    ).toBeVisible();
  },
};
export const FooterAndLog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = within(
      await canvas.findByRole(
        "group",
        { name: "JJ Log header" },
        { timeout: 30_000 }
      )
    );
    await expect(header.queryByRole("combobox")).toBeNull();
    await userEvent.click(
      header.getByRole("button", { name: /Fetch vault backup/ })
    );
    const runtime = nativeRemotesStoryFor(canvasElement);
    await waitFor(() =>
      expect(
        runtime.commands.some(
          (c) => c.kind === "fetch" && c.target === "backup"
        )
      ).toBe(true)
    );
    await waitFor(() =>
      expect(
        header.getByRole("button", { name: /Fetch vault backup/ })
      ).toBeEnabled()
    );
    const footer = within(
      await canvas.findByRole("contentinfo", { name: "Workspace status" })
    );
    await userEvent.click(
      await footer.findByRole("button", { name: "Expand repository status" })
    );
    await expect(footer.getByText("Saved locally")).toBeVisible();
    await userEvent.click(
      footer.getByRole("button", { name: /Working copy details:/ })
    );
    const details = within(
      await within(document.body).findByRole("region", {
        name: "Working copy details",
      })
    );
    await userEvent.click(
      details.getByRole("button", {
        name: /Review push to original repository/,
      })
    );
    await waitFor(() =>
      expect(runtime.commands.filter((c) => c.kind === "review_push")).toEqual([
        { kind: "review_push", target: "original" },
      ])
    );
    await expect(runtime.plugin.remotes!.review?.target).toBe("original");
    const review = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog", {
        name: "Push to original repository?",
      })
    );
    await expect(
      review.getByText("origin · https://github.com/alex/knowledge.git")
    ).toBeVisible();
    await userEvent.click(review.getByRole("button", { name: "Cancel" }));
    await expect(runtime.commands.some((c) => c.kind === "push")).toBe(false);
  },
};
export const ReviewWithHiddenFooter: Story = {
  args: { footer: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = within(
      await canvas.findByRole(
        "group",
        { name: "JJ Log header" },
        { timeout: 30_000 }
      )
    );
    await expect(
      canvas.queryByRole("button", { name: "Expand repository status" })
    ).toBeNull();
    await userEvent.click(
      header.getByRole("button", { name: /Review push to vault backup/ })
    );
    const review = within(
      await within(document.body).findByRole("dialog", {
        name: "Push to vault backup?",
      })
    );
    await expect(
      review.getByRole("button", { name: "Push to backup/main" })
    ).toBeEnabled();
    await userEvent.click(review.getByRole("button", { name: "Cancel" }));
    const runtime = nativeRemotesStoryFor(canvasElement);
    await expect(
      runtime.commands.filter((c) => c.kind === "review_push")
    ).toEqual([{ kind: "review_push", target: "backup" }]);
    await expect(runtime.commands.some((c) => c.kind === "push")).toBe(false);
  },
};
export const OpLog: Story = {
  args: { operations: true },
  play: async ({ canvasElement }) => {
    const header = within(
      await within(canvasElement).findByRole(
        "group",
        { name: "Op Log header" },
        { timeout: 30_000 }
      )
    );
    await expect(header.queryByRole("combobox")).toBeNull();
    await userEvent.click(
      header.getByRole("button", { name: /Fetch vault backup/ })
    );
    await waitFor(() =>
      expect(nativeRemotesStoryFor(canvasElement).commands).toEqual([
        { kind: "fetch", target: "backup" },
      ])
    );
  },
};

export const Dark: Story = {
  globals: { colorMode: "dark" },
  play: Server.play,
};
export const NarrowDark: Story = {
  args: { narrow: true },
  globals: { colorMode: "dark" },
  play: Server.play,
};
