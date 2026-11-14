import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RemotesPreviewDemo from "./RemotesPreviewDemo.svelte";
import { cleanupRemotesPreviews, remotesPreviewFor } from "./runtime.svelte";

const meta = {
  title: "Plugins/History/Repository/Remotes and credentials",
  component: RemotesPreviewDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen", catalogLayout: "full-viewport", a11y: { test: "error" } },
  beforeEach: () => cleanupRemotesPreviews,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector("[data-fixture-controls]")).toBeNull();
    await expect(canvasElement.querySelector(".remote-toolbar")).toBeNull();
    await expect(
      await canvas.findByRole("heading", { name: "Remotes and credentials" }, { timeout: 30_000 }),
    ).toBeVisible();
    await expect(canvas.getByRole("region", { name: "Vault backup" })).toBeVisible();
    await expect(canvas.getByRole("region", { name: "Original repository" })).toBeVisible();
    await expect(
      canvas.getByRole("switch", { name: "Synchronize the vault backup automatically" }),
    ).not.toBeChecked();
    if (args.host === "server")
      await expect(canvas.getByText(/server’s encrypted credential store/)).toBeVisible();
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await expect(fixture.activity).toEqual([]);
  },
} satisfies Meta<typeof RemotesPreviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};
export const Server: Story = { args: { host: "server" } };
export const Dark: Story = { globals: { colorMode: "dark" } };
export const Narrow: Story = { args: { narrow: true } };
export const ServerNarrowDark: Story = {
  args: { host: "server", narrow: true },
  globals: { colorMode: "dark" },
};
export const Disconnected: Story = { args: { scenario: "disconnected" } };
export const PublicHttps: Story = { args: { scenario: "anonymous" } };
export const ReadOnly: Story = { args: { scenario: "read-only" } };
export const MissingCredentials: Story = { args: { scenario: "missing-credentials" } };
export const LockedServerStore: Story = { args: { host: "server", scenario: "locked" } };
export const SshUnavailable: Story = { args: { host: "server", scenario: "ssh-unavailable" } };
export const SshConnected: Story = { args: { host: "server", scenario: "ssh-connected" } };
export const Fetching: Story = { args: { scenario: "fetching" } };
export const PushReview: Story = { args: { scenario: "push-review" } };
export const UnknownPush: Story = { args: { scenario: "unknown" } };
export const DeviceSignIn: Story = { args: { scenario: "device-sign-in" } };
export const ExpiredDeviceSignIn: Story = { args: { scenario: "expired-sign-in" } };

export const SaveIsNotTransfer: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const original = within(
      await canvas.findByRole("region", { name: "Original repository" }, { timeout: 30_000 }),
    );
    const input = original.getByRole("textbox", { name: "Remote branch" });
    await userEvent.clear(input);
    await userEvent.type(input, "notes");
    await expect(
      original.getByRole("button", { name: "Fetch original repository" }),
    ).toBeDisabled();
    await userEvent.click(original.getByRole("button", { name: "Save connection" }));
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() =>
      expect(fixture.activity).toEqual([{ kind: "save", target: "original", id: undefined }]),
    );
    await expect(fixture.target("backup").connection?.branch).toBe("main");
    await expect(fixture.state.automaticSync).toBe(false);
    await expect(fixture.target("original").connection?.branch).toBe("notes");
  },
};
export const ManualFetchAndPush: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const original = within(
      await canvas.findByRole("region", { name: "Original repository" }, { timeout: 30_000 }),
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await userEvent.click(original.getByRole("button", { name: "Test connection" }));
    await waitFor(() => expect(fixture.target("original").busy).toBeUndefined());
    await userEvent.click(original.getByRole("button", { name: "Fetch original repository" }));
    await waitFor(() =>
      expect(fixture.activity.filter((item) => item.kind === "fetch")).toHaveLength(1),
    );
    await waitFor(() => expect(fixture.target("original").busy).toBeUndefined());
    await userEvent.click(
      original.getByRole("button", { name: "Review push to original repository" }),
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", { name: "Push to original repository?" }),
    );
    await waitFor(() => expect(dialog.getByText("Organize project notes")).toBeVisible());
    await expect(fixture.activity.some((item) => item.kind === "push")).toBe(false);
    await userEvent.click(dialog.getByRole("button", { name: "Push to origin/main" }));
    await waitFor(() =>
      expect(fixture.activity.filter((item) => item.kind === "push")).toHaveLength(1),
    );
    await waitFor(() => expect(fixture.target("original").observation?.outgoing).toBe(0));
    await expect(fixture.target("backup").observation?.outgoing).toBe(3);
  },
};
export const RejectedPush: Story = {
  args: { scenario: "rejected" },
  play: async ({ canvasElement }) => {
    const original = within(
      await within(canvasElement).findByRole(
        "region",
        { name: "Original repository" },
        { timeout: 30_000 },
      ),
    );
    await userEvent.click(
      original.getByRole("button", { name: "Review push to original repository" }),
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", { name: "Push to original repository?" }),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Push to origin/main" }));
    await expect(
      await within(document.body).findByText(
        "The remote branch changed. Fetch updates and review the push again.",
      ),
    ).toBeVisible();
    await expect(
      remotesPreviewFor(canvasElement).fixture.target("original").observation?.outgoing,
    ).toBe(1);
  },
};
export const ObserveDoesNotRepublish: Story = {
  args: { scenario: "unknown" },
  play: async ({ canvasElement }) => {
    const original = within(
      await within(canvasElement).findByRole(
        "region",
        { name: "Original repository" },
        { timeout: 30_000 },
      ),
    );
    await expect(
      original.getByRole("button", { name: "Review push to original repository" }),
    ).toBeDisabled();
    await userEvent.click(original.getByRole("button", { name: "Check push outcome" }));
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() => expect(fixture.target("original").publication).toBeUndefined());
    await expect(fixture.activity).toEqual([
      { kind: "observe", target: "original", id: "push-original-1" },
    ]);
  },
};
export const SaveCredential: Story = {
  args: { host: "server", scenario: "disconnected" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Add access token" }, { timeout: 30_000 }),
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", { name: "Add remote credential" }),
    );
    await userEvent.type(dialog.getByRole("textbox", { name: "Credential label" }), "Work token");
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Host", exact: true }),
      "forge.example",
    );
    await userEvent.type(dialog.getByRole("textbox", { name: "Username" }), "alex");
    await userEvent.type(
      dialog.getByLabelText("Access token", { exact: true }),
      "synthetic-preview-secret",
    );
    await userEvent.click(dialog.getByRole("button", { name: "Save credential" }));
    await expect(await canvas.findByText("Work token")).toBeVisible();
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await expect(JSON.stringify(fixture.state)).not.toContain("synthetic-preview-secret");
    await expect(JSON.stringify(fixture.activity)).not.toContain("synthetic-preview-secret");
    await expect(fixture.state.automaticSync).toBe(false);
  },
};
export const ForgetCredential: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Forget Repository token" }, { timeout: 30_000 }),
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() => expect(fixture.target("original").canFetch).toBe(false));
    await expect(fixture.target("backup").canFetch).toBe(true);
    await expect(canvas.queryByRole("button", { name: "Forget Repository token" })).toBeNull();
  },
};
export const AutomaticSyncRequiresOptIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole(
      "switch",
      { name: "Synchronize the vault backup automatically" },
      { timeout: 30_000 },
    );
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "Forget Personal GitHub" }));
    await expect(toggle).not.toBeDisabled();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
    await expect(
      remotesPreviewFor(canvasElement).fixture.activity.some(
        (item) => item.kind === "fetch" || item.kind === "push",
      ),
    ).toBe(false);
  },
};
export const UnknownPushKeepsConnection: Story = {
  args: { scenario: "unknown" },
  play: async ({ canvasElement }) => {
    const original = within(
      await within(canvasElement).findByRole(
        "region",
        { name: "Original repository" },
        { timeout: 30_000 },
      ),
    );
    const branch = original.getByRole("textbox", { name: "Remote branch" });
    await userEvent.clear(branch);
    await userEvent.type(branch, "other");
    await expect(original.getByRole("button", { name: "Save connection" })).toBeDisabled();
    await expect(
      remotesPreviewFor(canvasElement).fixture.target("original").connection?.branch,
    ).toBe("main");
  },
};
export const SignInCompletes: Story = {
  args: { scenario: "device-sign-in" },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = within(
      await body.findByRole("dialog", { name: "Sign in to GitHub" }, { timeout: 30_000 }),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Check sign-in" }));
    await waitFor(() =>
      expect(remotesPreviewFor(canvasElement).fixture.state.authorization).toBeUndefined(),
    );
  },
};
export const KeyboardCredentialDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole(
      "button",
      { name: "Add access token" },
      { timeout: 30_000 },
    );
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = within(
      await within(document.body).findByRole("dialog", { name: "Add remote credential" }),
    );
    const token = dialog.getByLabelText("Access token", { exact: true });
    await userEvent.type(token, "discard-this-preview-secret");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    const reopened = within(
      await within(document.body).findByRole("dialog", { name: "Add remote credential" }),
    );
    await expect(reopened.getByLabelText("Access token", { exact: true })).toHaveValue("");
  },
};
export const HistoryEntry: Story = {
  args: { settings: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = within(
      await canvas.findByRole("contentinfo", { name: "Workspace status" }, { timeout: 30_000 }),
    );
    await expect(canvasElement.querySelector("[data-fixture-controls]")).toBeNull();
    await expect(canvasElement.querySelector(".remote-toolbar")).toBeNull();
    await userEvent.click(
      await footer.findByRole(
        "button",
        { name: "Manage remotes for original repository" },
        { timeout: 30_000 },
      ),
    );
    await expect(
      await canvas.findByRole("heading", { name: "Remotes and credentials" }),
    ).toBeVisible();
  },
};
export const HistoryNeedsConnection: Story = {
  args: { settings: false, scenario: "disconnected" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = within(
      await canvas.findByRole("contentinfo", { name: "Workspace status" }, { timeout: 30_000 }),
    );
    await expect(
      await footer.findByRole("button", { name: "Fetch original repository" }, { timeout: 30_000 }),
    ).toBeDisabled();
    await expect(
      footer.getByRole("button", { name: "Review push to original repository" }),
    ).toBeDisabled();
    await userEvent.click(
      footer.getByRole("button", { name: "Manage remotes for original repository" }),
    );
    await expect(
      await canvas.findByRole("heading", { name: "Remotes and credentials" }),
    ).toBeVisible();
  },
};
export const FooterFetchAndPush: Story = {
  args: { settings: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = within(
      await canvas.findByRole("contentinfo", { name: "Workspace status" }, { timeout: 30_000 }),
    );
    await expect(
      footer.getByRole("button", { name: /^Working copy details: 3 files/ }),
    ).toBeVisible();
    await expect(
      footer.getByRole("button", { name: "Vault history: Saved locally" }),
    ).toBeVisible();
    await expect(footer.getByRole("button", { name: "Pull original repository" })).toBeDisabled();
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await userEvent.click(footer.getByRole("button", { name: "Fetch original repository" }));
    await waitFor(() =>
      expect(
        fixture.activity.some((item) => item.kind === "fetch" && item.target === "original"),
      ).toBe(true),
    );
    await waitFor(() => expect(fixture.target("original").busy).toBeUndefined());
    await userEvent.click(
      footer.getByRole("button", { name: "Review push to original repository" }),
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", { name: "Push to original repository?" }),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Push to origin/main" }));
    await waitFor(() => expect(fixture.target("original").observation?.outgoing).toBe(0));
    await expect(fixture.target("backup").observation?.outgoing).toBe(3);
    await expect(canvasElement.querySelector(".remote-toolbar")).toBeNull();
    await expect(
      canvas.getByRole("contentinfo", { name: "Workspace status" }).getBoundingClientRect().bottom,
    ).toBeLessThanOrEqual(window.innerHeight);
  },
};
export const FooterBackupPull: Story = {
  args: { settings: false },
  play: async ({ canvasElement }) => {
    const footer = within(
      await within(canvasElement).findByRole(
        "contentinfo",
        { name: "Workspace status" },
        { timeout: 30_000 },
      ),
    );
    await userEvent.click(footer.getByRole("button", { name: "Pull vault backup" }));
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() => expect(fixture.target("backup").observation?.incoming).toBe(0));
    await expect(fixture.target("original").observation?.incoming).toBe(2);
    await expect(fixture.activity).toEqual([{ kind: "pull", target: "backup", id: undefined }]);
  },
};
export const NarrowFooter: Story = {
  args: { settings: false, narrow: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = await canvas.findByRole(
      "contentinfo",
      { name: "Workspace status" },
      { timeout: 30_000 },
    );
    await expect(footer).toBeVisible();
    const more = await within(footer).findByRole("button", { name: "More left status items" });
    await userEvent.click(more);
    const fetch = await within(document.body).findByRole("button", {
      name: "Fetch original repository",
    });
    await waitFor(() => expect(fetch).toBeVisible());
    await userEvent.click(fetch);
    await waitFor(() =>
      expect(
        remotesPreviewFor(canvasElement).fixture.activity.some(
          (item) => item.kind === "fetch" && item.target === "original",
        ),
      ).toBe(true),
    );
  },
};
export const ExistingStatusControls: Story = {
  args: { settings: false, legacyStatus: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = within(
      await canvas.findByRole("contentinfo", { name: "Workspace status" }, { timeout: 30_000 }),
    );
    await userEvent.click(footer.getByRole("button", { name: /^Working copy details:/ }));
    const details = within(
      await within(document.body).findByRole("region", { name: "Working copy details" }),
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    for (const [label, kind] of [
      ["Fetch from upstream", "legacy-fetch"],
      ["Pull from upstream", "legacy-pull"],
      ["Push to upstream", "legacy-push"],
    ]) {
      const button = details.getByRole("button", { name: label });
      await waitFor(() => expect(button).not.toBeDisabled());
      await userEvent.click(button);
      await waitFor(() => expect(fixture.activity.some((item) => item.kind === kind)).toBe(true));
    }
  },
};
