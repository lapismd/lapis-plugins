import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RemotesPreviewDemo from "./RemotesPreviewDemo.svelte";
import { cleanupRemotesPreviews, remotesPreviewFor } from "./runtime.svelte";

async function openRepositoryStatus(canvasElement: HTMLElement) {
  const footer = within(
    await within(canvasElement).findByRole(
      "contentinfo",
      { name: "Workspace status" },
      { timeout: 30_000 }
    )
  );
  await userEvent.click(
    await footer.findByRole("button", { name: /^Working copy details:/ })
  );
  const menu = await within(document.body).findByRole("region", {
    name: "Working copy details",
  });
  await waitFor(() => expect(menu).toBeVisible());
  return within(menu);
}

const meta = {
  title: "Plugins/History/Repository/Remotes and credentials",
  component: RemotesPreviewDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: {
    layout: "fullscreen",
    catalogLayout: "full-viewport",
    a11y: { test: "error" },
  },
  beforeEach: () => cleanupRemotesPreviews,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-fixture-controls]")
    ).toBeNull();
    await expect(canvasElement.querySelector(".remote-toolbar")).toBeNull();
    await expect(
      await canvas.findByRole(
        "heading",
        { name: "Remotes and credentials" },
        { timeout: 30_000 }
      )
    ).toBeVisible();
    await expect(
      canvas.getByRole("region", { name: "Vault backup" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("region", { name: "Original repository" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("switch", {
        name: "Synchronize the vault backup automatically",
      })
    ).not.toBeChecked();
    if (args.host === "server")
      await expect(
        canvas.getByText(/server’s encrypted credential store/)
      ).toBeVisible();
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
export const MissingCredentials: Story = {
  args: { scenario: "missing-credentials" },
};
export const LockedServerStore: Story = {
  args: { host: "server", scenario: "locked" },
};
export const SshUnavailable: Story = {
  args: { host: "server", scenario: "ssh-unavailable" },
};
export const SshConnected: Story = {
  args: { host: "server", scenario: "ssh-connected" },
};
export const Fetching: Story = { args: { scenario: "fetching" } };
export const PushReview: Story = { args: { scenario: "push-review" } };
export const LockedReviewCannotPublish: Story = {
  args: { host: "server", scenario: "push-review" },
  play: async ({ canvasElement }) => {
    const dialog = within(
      await within(document.body).findByRole(
        "dialog",
        { name: "Push to original repository?" },
        { timeout: 30_000 }
      )
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    const close = fixture.actions.dismissReview;
    const dismissed: string[] = [];
    fixture.actions.dismissReview = (target) => {
      dismissed.push(target);
      close(target);
    };
    fixture.update("original", {
      status: "credentials-required",
      canFetch: false,
      canPush: false,
    });
    fixture.state.storage = "locked";
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "Push to origin/main" })).toBeDisabled()
    );
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeEnabled();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await expect(dismissed).toEqual(["original"]);
    await expect(fixture.target("original").review).toBeUndefined();
    await waitFor(() => expect(within(document.body).queryByRole("dialog", {
      name: "Push to original repository?",
    })).toBeNull());
    await expect(fixture.activity.some((item) => item.kind === "push")).toBe(false);
  },
};
export const UnknownPush: Story = { args: { scenario: "unknown" } };
export const DeviceSignIn: Story = { args: { scenario: "device-sign-in" } };
export const ExpiredDeviceSignIn: Story = {
  args: { scenario: "expired-sign-in" },
};

export const SaveIsNotTransfer: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const original = within(
      await canvas.findByRole(
        "region",
        { name: "Original repository" },
        { timeout: 30_000 }
      )
    );
    const input = original.getByRole("textbox", { name: "Remote branch" });
    await userEvent.clear(input);
    await userEvent.type(input, "notes");
    await expect(
      original.getByRole("button", { name: "Fetch original repository" })
    ).toBeDisabled();
    await userEvent.click(
      original.getByRole("button", { name: "Save connection" })
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() =>
      expect(fixture.activity).toEqual([
        { kind: "save", target: "original", id: undefined },
      ])
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
      await canvas.findByRole(
        "region",
        { name: "Original repository" },
        { timeout: 30_000 }
      )
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await userEvent.click(
      original.getByRole("button", { name: "Test connection" })
    );
    await waitFor(() =>
      expect(fixture.target("original").busy).toBeUndefined()
    );
    await userEvent.click(
      original.getByRole("button", { name: "Fetch original repository" })
    );
    await waitFor(() =>
      expect(
        fixture.activity.filter((item) => item.kind === "fetch")
      ).toHaveLength(1)
    );
    await waitFor(() =>
      expect(fixture.target("original").busy).toBeUndefined()
    );
    await userEvent.click(
      original.getByRole("button", {
        name: "Review push to original repository",
      })
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", {
        name: "Push to original repository?",
      })
    );
    await waitFor(() =>
      expect(dialog.getByText("Organize project notes")).toBeVisible()
    );
    await expect(fixture.activity.some((item) => item.kind === "push")).toBe(
      false
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Push to origin/main" })
    );
    await waitFor(() =>
      expect(
        fixture.activity.filter((item) => item.kind === "push")
      ).toHaveLength(1)
    );
    await waitFor(() =>
      expect(fixture.target("original").observation?.outgoing).toBe(0)
    );
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
        { timeout: 30_000 }
      )
    );
    await userEvent.click(
      original.getByRole("button", {
        name: "Review push to original repository",
      })
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", {
        name: "Push to original repository?",
      })
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Push to origin/main" })
    );
    await expect(
      await within(document.body).findByText(
        "The remote branch changed. Fetch updates and review the push again."
      )
    ).toBeVisible();
    await expect(
      remotesPreviewFor(canvasElement).fixture.target("original").observation
        ?.outgoing
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
        { timeout: 30_000 }
      )
    );
    await expect(
      original.getByRole("button", {
        name: "Review push to original repository",
      })
    ).toBeDisabled();
    await userEvent.click(
      original.getByRole("button", { name: "Check push outcome" })
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() =>
      expect(fixture.target("original").publication).toBeUndefined()
    );
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
      await canvas.findByRole(
        "button",
        { name: "Add access token" },
        { timeout: 30_000 }
      )
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", {
        name: "Add remote credential",
      })
    );
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Credential label" }),
      "Work token"
    );
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Host", exact: true }),
      "forge.example"
    );
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Username" }),
      "alex"
    );
    await userEvent.type(
      dialog.getByLabelText("Access token", { exact: true }),
      "synthetic-preview-secret"
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Save credential" })
    );
    await expect(await canvas.findByText("Work token")).toBeVisible();
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await expect(JSON.stringify(fixture.state)).not.toContain(
      "synthetic-preview-secret"
    );
    await expect(JSON.stringify(fixture.activity)).not.toContain(
      "synthetic-preview-secret"
    );
    await expect(fixture.state.automaticSync).toBe(false);
  },
};
export const ForgetCredential: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole(
        "button",
        { name: "Forget Repository token" },
        { timeout: 30_000 }
      )
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() =>
      expect(fixture.target("original").canFetch).toBe(false)
    );
    await expect(fixture.target("backup").canFetch).toBe(true);
    await expect(
      canvas.queryByRole("button", { name: "Forget Repository token" })
    ).toBeNull();
  },
};
export const AutomaticSyncRequiresOptIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole(
      "switch",
      { name: "Synchronize the vault backup automatically" },
      { timeout: 30_000 }
    );
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await userEvent.click(
      canvas.getByRole("button", { name: "Forget Personal GitHub" })
    );
    await expect(toggle).not.toBeDisabled();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
    await expect(
      remotesPreviewFor(canvasElement).fixture.activity.some(
        (item) => item.kind === "fetch" || item.kind === "push"
      )
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
        { timeout: 30_000 }
      )
    );
    const branch = original.getByRole("textbox", { name: "Remote branch" });
    await userEvent.clear(branch);
    await userEvent.type(branch, "other");
    await expect(
      original.getByRole("button", { name: "Save connection" })
    ).toBeDisabled();
    await expect(
      remotesPreviewFor(canvasElement).fixture.target("original").connection
        ?.branch
    ).toBe("main");
  },
};
export const SignInCompletes: Story = {
  args: { scenario: "device-sign-in" },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = within(
      await body.findByRole(
        "dialog",
        { name: "Sign in to GitHub" },
        { timeout: 30_000 }
      )
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Check sign-in" })
    );
    await waitFor(() =>
      expect(
        remotesPreviewFor(canvasElement).fixture.state.authorization
      ).toBeUndefined()
    );
  },
};
export const KeyboardCredentialDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole(
      "button",
      { name: "Add access token" },
      { timeout: 30_000 }
    );
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = within(
      await within(document.body).findByRole("dialog", {
        name: "Add remote credential",
      })
    );
    const token = dialog.getByLabelText("Access token", { exact: true });
    await userEvent.type(token, "discard-this-preview-secret");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    const reopened = within(
      await within(document.body).findByRole("dialog", {
        name: "Add remote credential",
      })
    );
    await expect(
      reopened.getByLabelText("Access token", { exact: true })
    ).toHaveValue("");
  },
};
export const HistoryEntry: Story = {
  args: { settings: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = await openRepositoryStatus(canvasElement);
    await expect(
      canvasElement.querySelector("[data-fixture-controls]")
    ).toBeNull();
    await expect(canvasElement.querySelector(".remote-toolbar")).toBeNull();
    await userEvent.click(
      await footer.findByRole(
        "button",
        { name: "Manage remotes for original repository" },
        { timeout: 30_000 }
      )
    );
    await expect(
      await canvas.findByRole("heading", { name: "Remotes and credentials" })
    ).toBeVisible();
  },
};
export const HistoryNeedsConnection: Story = {
  args: { settings: false, scenario: "disconnected" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = await openRepositoryStatus(canvasElement);
    await expect(
      await footer.findByRole(
        "button",
        { name: "Fetch original repository" },
        { timeout: 30_000 }
      )
    ).toBeDisabled();
    await expect(
      footer.getByRole("button", { name: "Review push to original repository" })
    ).toBeDisabled();
    await userEvent.click(
      footer.getByRole("button", {
        name: "Manage remotes for original repository",
      })
    );
    await expect(
      await canvas.findByRole("heading", { name: "Remotes and credentials" })
    ).toBeVisible();
  },
};
export const FooterFetchAndPush: Story = {
  args: { settings: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = await openRepositoryStatus(canvasElement);
    await expect(
      footer.getByRole("group", {
        name: "Original repository upstream actions",
      })
    ).toBeVisible();
    await expect(
      footer.queryByRole("button", { name: "Pull original repository" })
    ).toBeNull();
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await userEvent.click(
      footer.getByRole("button", { name: "Fetch original repository" })
    );
    await waitFor(() =>
      expect(
        fixture.activity.some(
          (item) => item.kind === "fetch" && item.target === "original"
        )
      ).toBe(true)
    );
    await waitFor(() =>
      expect(fixture.target("original").busy).toBeUndefined()
    );
    await userEvent.click(
      footer.getByRole("button", { name: "Review push to original repository" })
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", {
        name: "Push to original repository?",
      })
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Push to origin/main" })
    );
    await waitFor(() =>
      expect(fixture.target("original").observation?.outgoing).toBe(0)
    );
    await expect(fixture.target("backup").observation?.outgoing).toBe(3);
    await expect(canvasElement.querySelector(".remote-toolbar")).toBeNull();
    await expect(
      canvas
        .getByRole("contentinfo", { name: "Workspace status" })
        .getBoundingClientRect().bottom
    ).toBeLessThanOrEqual(window.innerHeight);
  },
};
export const FooterSummary: Story = {
  args: { settings: false },
  play: async ({ canvasElement }) => {
    const footer = within(
      await within(canvasElement).findByRole(
        "contentinfo",
        { name: "Workspace status" },
        { timeout: 30_000 }
      )
    );
    await expect(footer.queryByText("Saved locally")).not.toBeVisible();
    const expand = footer.getByRole("button", {
      name: "Expand repository status",
    });
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(expand);
    await expect(await footer.findByText("Saved locally")).toBeVisible();
    await expect(footer.getByText("+24")).toBeVisible();
    await expect(footer.getByText("-6")).toBeVisible();
    await expect(footer.getByLabelText("Incoming commits")).toHaveTextContent(
      "2"
    );
    await expect(footer.getByLabelText("Outgoing commits")).toHaveTextContent(
      "1"
    );
    await userEvent.click(
      footer.getByRole("button", { name: "Fetch original repository" })
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() =>
      expect(fixture.activity).toEqual([
        { kind: "fetch", target: "original", id: undefined },
      ])
    );
    await expect(fixture.target("backup").observation?.outgoing).toBe(3);
    await userEvent.click(
      footer.getByRole("button", { name: "Collapse repository status" })
    );
    await expect(
      footer.getByRole("button", { name: "Expand repository status" })
    ).toHaveAttribute("aria-expanded", "false");
    await expect(footer.queryByText("Saved locally")).not.toBeVisible();
  },
};
export const NarrowFooter: Story = {
  args: { settings: false, narrow: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = await canvas.findByRole(
      "contentinfo",
      { name: "Workspace status" },
      { timeout: 30_000 }
    );
    const repository = await within(footer).findByRole("button", {
      name: /^Working copy details:/,
    });
    await expect(repository).toBeVisible();
    repository.focus();
    await expect(repository).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const menu = within(
      await within(document.body).findByRole("region", {
        name: "Working copy details",
      })
    );
    const fetch = menu.getByRole("button", {
      name: "Fetch original repository",
    });
    await waitFor(() => expect(fetch).toBeVisible());
    await userEvent.click(fetch);
    await waitFor(() =>
      expect(
        remotesPreviewFor(canvasElement).fixture.activity.some(
          (item) => item.kind === "fetch" && item.target === "original"
        )
      ).toBe(true)
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(repository).toHaveFocus());
  },
};
export const ExistingStatusControls: Story = {
  args: { settings: false, legacyStatus: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = within(
      await canvas.findByRole(
        "contentinfo",
        { name: "Workspace status" },
        { timeout: 30_000 }
      )
    );
    await userEvent.click(
      footer.getByRole("button", { name: /^Working copy details:/ })
    );
    const details = within(
      await within(document.body).findByRole("region", {
        name: "Working copy details",
      })
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
      await waitFor(() =>
        expect(fixture.activity.some((item) => item.kind === kind)).toBe(true)
      );
    }
  },
};

export const LogRemoteActions: Story = {
  args: { settings: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const header = within(
      await canvas.findByRole(
        "group",
        { name: args.operations ? "Op Log header" : "JJ Log header" },
        { timeout: 30_000 }
      )
    );
    await expect(
      header.queryByRole("combobox", { name: "Repository workspace" })
    ).toBeNull();
    await expect(
      header.queryByRole("combobox", { name: "Operation" })
    ).toBeNull();
    await expect(
      header.queryByRole("button", { name: "Pull original repository" })
    ).toBeNull();
    await userEvent.click(
      header.getByRole("button", { name: "Fetch original repository" })
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() =>
      expect(
        fixture.activity.some(
          (item) => item.kind === "fetch" && item.target === "original"
        )
      ).toBe(true)
    );
    await waitFor(() =>
      expect(fixture.target("original").busy).toBeUndefined()
    );
    await userEvent.click(
      header.getByRole("button", { name: "Review push to original repository" })
    );
    const dialog = within(
      await within(document.body).findByRole("dialog", {
        name: "Push to original repository?",
      })
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Push to origin/main" })
    );
    await waitFor(() =>
      expect(fixture.target("original").observation?.outgoing).toBe(0)
    );
    await expect(fixture.target("backup").observation?.outgoing).toBe(3);
  },
};
export const LogNeedsConnection: Story = {
  args: { settings: false, scenario: "disconnected" },
  play: async ({ canvasElement, args }) => {
    const header = within(
      await within(canvasElement).findByRole(
        "group",
        { name: args.operations ? "Op Log header" : "JJ Log header" },
        { timeout: 30_000 }
      )
    );
    await expect(
      header.queryByRole("combobox", { name: "Repository workspace" })
    ).toBeNull();
    await expect(
      header.queryByRole("combobox", { name: "Operation" })
    ).toBeNull();
    await expect(
      header.queryByRole("button", { name: "Fetch original repository" })
    ).toBeNull();
    await expect(
      header.queryByRole("button", {
        name: "Review push to original repository",
      })
    ).toBeNull();
    await expect(header.getByRole("button", { name: "Refresh" })).toBeVisible();
  },
};

export const OperationLogRemoteActions: Story = {
  ...LogRemoteActions,
  args: { settings: false, operations: true },
};
export const OperationLogNeedsConnection: Story = {
  ...LogNeedsConnection,
  args: { settings: false, operations: true, scenario: "disconnected" },
};

export const CopyCodeAndOpenGitHub: Story = {
  args: { scenario: "device-sign-in" },
  play: async ({ canvasElement }) => {
    const dialog = within(
      await within(document.body).findByRole(
        "dialog",
        { name: "Sign in to GitHub" },
        { timeout: 30_000 }
      )
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Copy code and open GitHub" })
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() =>
      expect(fixture.deviceHandoff).toEqual({
        code: fixture.state.authorization?.code,
        url: "https://github.com/login/device",
      })
    );
    await expect(fixture.activity.map((item) => item.kind)).toEqual([
      "copy-device-code",
      "open-device-url",
    ]);
  },
};
export const ExpiredCodeCannotOpenGitHub: Story = {
  args: { scenario: "expired-sign-in" },
  play: async ({ canvasElement }) => {
    const dialog = within(
      await within(document.body).findByRole(
        "dialog",
        { name: "Sign in to GitHub" },
        { timeout: 30_000 }
      )
    );
    await expect(
      dialog.getByRole("button", { name: "Copy code and open GitHub" })
    ).toBeDisabled();
    await expect(
      remotesPreviewFor(canvasElement).fixture.deviceHandoff
    ).toBeUndefined();
  },
};

export const BackupSettingsFetch: Story = {
  play: async ({ canvasElement }) => {
    const backup = within(
      await within(canvasElement).findByRole(
        "region",
        { name: "Vault backup" },
        { timeout: 30_000 }
      )
    );
    await userEvent.click(
      backup.getByRole("button", { name: "Fetch vault backup" })
    );
    const fixture = remotesPreviewFor(canvasElement).fixture;
    await waitFor(() =>
      expect(fixture.activity).toEqual([
        { kind: "fetch", target: "backup", id: undefined },
      ])
    );
    await expect(fixture.target("original").observation?.outgoing).toBe(1);
  },
};
