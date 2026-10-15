import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SyncWorkspaceDemo from "./SyncWorkspaceDemo.svelte";
import { expectSyncReady } from "./story-assertions";
import type { SyncStoryState } from "./preview-runtime";
const meta = {
  title: "Plugins/Sync/Settings",
  component: SyncWorkspaceDemo,
  tags: ["!autodocs", "visual-pending", "test"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SyncWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function ready(canvasElement: HTMLElement) {
  const owner = await expectSyncReady(canvasElement);
  const dialog = await within(canvasElement).findByRole("dialog", {
    name: "Settings",
  });
  const canvas = within(dialog);
  expect(
    await canvas.findByRole("heading", { name: "Lapis Sync" }),
  ).toBeVisible();
  expect(canvas.getByText(/End-to-end encryption is required/)).toBeVisible();
  expect(canvas.queryByRole("textbox", { name: /private key/i })).toBeNull();
  return { ...owner, canvas, dialog };
}
function settings(
  state: SyncStoryState,
  play?: (owner: Awaited<ReturnType<typeof ready>>) => Promise<void>,
): Story {
  return {
    args: { options: { state, settings: true } },
    play: async ({ canvasElement }) => {
      const owner = await ready(canvasElement);
      await play?.(owner);
    },
  };
}
export const Setup = settings("setup", async ({ canvas }) => {
  expect(
    canvas.getByRole("button", { name: "Test connection" }),
  ).toBeDisabled();
});
export const Owner = settings("dirty", async ({ canvas, app, plugin }) => {
  expect(
    canvas.getByRole("button", { name: "Create pairing invitation" }),
  ).toBeEnabled();
  const url = canvas.getByRole("textbox", { name: "Server URL" });
  await userEvent.clear(url);
  await userEvent.type(url, "https://new-sync.example.test");
  await userEvent.tab();
  await waitFor(() =>
    expect(plugin.settings.serverUrl).toBe("https://new-sync.example.test"),
  );
  expect(plugin.settings.enabled).toBe(false);
  expect(app.configuration.getPluginData("sync")).toEqual({
    version: 1,
    settings: plugin.settings,
  });
});
export const Member = settings("member", async ({ canvas }) => {
  expect(canvas.queryByRole("button", { name: "Cancel pairing" })).toBeNull();
  expect(
    canvas.getByRole("button", { name: "Create pairing invitation" }),
  ).toBeDisabled();
  expect(
    canvas.getByRole("button", { name: "Export encrypted recovery bundle" }),
  ).toBeDisabled();
});
export const InvitationQR = settings("qr", async ({ canvas }) => {
  expect(
    await canvas.findByRole("img", {
      name: "QR code for this pairing invitation",
    }),
  ).toBeVisible();
});
export const PasteInvitation = settings(
  "dirty",
  async ({ canvas, runtime, plugin }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Invitation URL" }),
      "lapis://sync-pair?invitation=ui-test",
    );
    await waitFor(() =>
      expect(plugin.settingsSource?.get("sync.pairing")).toMatchObject({
        invitationInput: "lapis://sync-pair?invitation=ui-test",
      }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Accept invitation" }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Accept invitation" }),
    );
    await waitFor(() =>
      expect(canvas.getByLabelText("Pairing security code")).toHaveTextContent(
        "482196",
      ),
    );
    expect(runtime?.calls.some((a) => a.type === "accept-pairing")).toBe(true);
  },
);
export const SecurityCode = settings("sas", async ({ canvas, runtime }) => {
  expect(canvas.getByLabelText("Pairing security code")).toHaveTextContent(
    "482196",
  );
  await userEvent.click(
    canvas.getByRole("button", { name: "Confirm security code" }),
  );
  await waitFor(() =>
    expect(runtime?.snapshot().pairing.stage).toBe("complete"),
  );
  expect(canvas.queryByRole("button", { name: "Cancel pairing" })).toBeNull();
});
export const RecoveryPreview = settings(
  "recovery",
  async ({ canvas, runtime }) => {
    const apply = canvas.getByRole("button", { name: "Apply recovery" });
    expect(apply).toBeDisabled();
    await userEvent.click(canvas.getByRole("radio", { name: "keep both" }));
    await waitFor(() => expect(apply).toBeEnabled());
    await userEvent.click(apply);
    await waitFor(() =>
      expect(runtime?.calls).toContainEqual({
        type: "apply-recovery",
        choices: { "research-choice": "keep-both" },
      }),
    );
  },
);
export const ConnectionError = settings("error", async ({ canvas }) => {
  expect(
    canvas.getByText(/server rejected a stale file generation/),
  ).toBeVisible();
});
export const RecoveryFile = settings(
  "dirty",
  async ({ canvas, runtime, app, plugin }) => {
    const file = new File(["encrypted-ui-fixture"], "atlas.lapis-recovery", {
      type: "application/octet-stream",
    });
    await plugin.settingsSource!.set("sync.recovery", {
      selectedFile: file,
      choices: {},
    });
    await waitFor(() =>
      expect(canvas.getByText("Selected: atlas.lapis-recovery")).toBeVisible(),
    );
    const preview = canvas.getByRole("button", { name: "Preview recovery" });
    await waitFor(() => expect(preview).toBeEnabled());
    await userEvent.click(preview);
    await waitFor(() =>
      expect(canvas.getByText("Rebind preview")).toBeVisible(),
    );
    expect(
      runtime?.calls.some(
        (a) => a.type === "preview-recovery" && a.file.name === file.name,
      ),
    ).toBe(true);
    expect(
      JSON.stringify(app.configuration.getPluginData("sync")),
    ).not.toContain("encrypted-ui-fixture");
  },
);
export const CameraUnavailable = settings("dirty", async ({ canvas }) => {
  const media = navigator.mediaDevices;
  const original = media.getUserMedia;
  media.getUserMedia = async () => {
    throw new DOMException("Camera access was denied", "NotAllowedError");
  };
  try {
    await userEvent.click(canvas.getByRole("button", { name: "Scan QR code" }));
    expect(
      await canvas.findByRole("alert", {}, { timeout: 10_000 }),
    ).toHaveTextContent(/Camera unavailable: Camera access was denied/);
    expect(canvas.queryByRole("button", { name: "Stop camera" })).toBeNull();
  } finally {
    media.getUserMedia = original;
  }
});

export const PairingControls = settings(
  "dirty",
  async ({ canvas, runtime }) => {
    const group = canvas.getByRole("group", {
      name: "Pairing invitation actions",
    });
    expect(canvas.queryByRole("button", { name: "Cancel pairing" })).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Create pairing invitation" }),
    );
    const qr = await canvas.findByRole("img", {
      name: "QR code for this pairing invitation",
    });
    expect(qr.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      group.getBoundingClientRect().bottom,
    );
    expect(
      canvas.queryByRole("button", { name: "Create pairing invitation" }),
    ).toBeNull();
    const cancel = canvas.getByRole("button", { name: "Cancel pairing" });
    expect(group).toContainElement(cancel);
    expect(cancel).toBeEnabled();
    await userEvent.click(cancel);
    await waitFor(() =>
      expect(
        canvas.queryByRole("img", {
          name: "QR code for this pairing invitation",
        }),
      ).toBeNull(),
    );
    expect(runtime?.calls.some((a) => a.type === "cancel-pairing")).toBe(true);
    expect(canvas.queryByRole("button", { name: "Cancel pairing" })).toBeNull();
    expect(
      canvas.getByRole("button", { name: "Create pairing invitation" }),
    ).toBeEnabled();
  },
);
export const InlineFields = settings("dirty", async ({ canvas }) => {
  for (const name of ["Invitation URL", "Recovery bundle"]) {
    const control = canvas.getByLabelText(name) as HTMLInputElement;
    const label =
      name === "Invitation URL"
        ? control.closest("label")!.querySelector("span")!
        : canvas.getByText("Recovery bundle", { exact: true });
    const labelRect = label.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();
    expect(controlRect.left).toBeGreaterThan(labelRect.right);
    expect(labelRect.bottom).toBeGreaterThan(controlRect.top);
    expect(labelRect.top).toBeLessThan(controlRect.bottom);
    expect(getComputedStyle(label).fontSize).toBe(
      getComputedStyle(canvas.getByText("New device alias", { exact: true }))
        .fontSize,
    );
  }
  const file = canvas.getByLabelText("Recovery bundle");
  expect(file).toHaveAttribute("data-ui-component", "input");
  expect(getComputedStyle(file, "::file-selector-button").borderWidth).toBe(
    "0px",
  );
});
export const LastOperation = settings("dirty", async ({ canvas }) => {
  expect(
    canvas.getByRole("status", { name: "Last operation" }),
  ).toHaveTextContent("No operations yet.");
  await userEvent.click(
    canvas.getByRole("button", { name: "Test connection" }),
  );
  await waitFor(() =>
    expect(
      canvas.getByRole("status", { name: "Last operation" }),
    ).toHaveTextContent("Connection test completed."),
  );
  const button = canvas.getByRole("button", { name: "Test connection" });
  const row = button.closest<HTMLElement>('[data-ui-part="setting-item"]')!;
  const result = within(row).getByRole("status");
  expect(result.parentElement).toBe(row);
  expect(result.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    button.parentElement!.getBoundingClientRect().bottom,
  );
  expect(result.getBoundingClientRect().width).toBeCloseTo(
    row.getBoundingClientRect().width,
    0,
  );
});

export const LabelSpace = settings("dirty", async ({ canvas }) => {
  const label = canvas.getByText("Publish opaque file-index tags", {
    exact: true,
  });
  const row = label.closest<HTMLElement>('[data-ui-part="setting-item"]')!;
  expect(
    row.firstElementChild!.getBoundingClientRect().width,
  ).toBeGreaterThanOrEqual(row.clientWidth * 0.5);
  expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
});

export const RealConnectionAdapter = settings(
  "setup",
  async ({ canvas, plugin }) => {
    const original = globalThis.fetch;
    const vaultId = "11111111-1111-4111-8111-111111111111";
    const calls: string[] = [];
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      if (url.origin !== "https://connection.example.test")
        return original(input, init);
      calls.push(url.pathname);
      return Response.json({
        result: {
          data: url.pathname.endsWith("system.info")
            ? { protocolMajor: 1 }
            : url.pathname.endsWith("vault.list")
            ? [
                { id: vaultId, name: "Research notes", role: "editor" },
                {
                  id: "22222222-2222-4222-8222-222222222222",
                  name: "Read-only archive",
                  role: "viewer",
                },
              ]
            : { vaultId, role: "editor" },
        },
      });
    };
    try {
      const server = canvas.getByRole("textbox", { name: "Server URL" });
      await userEvent.type(server, "https://connection.example.test");
      await userEvent.tab();
      await waitFor(() =>
        expect(plugin.settings.serverUrl).toBe(
          "https://connection.example.test",
        ),
      );
      const picker = canvas.getByRole("combobox", {
        name: "Managed vault",
        exact: true,
      });
      const refresh = canvas.getByRole("button", {
        name: "Refresh managed vaults",
      });
      expect(refresh).toHaveAttribute("data-variant", "ghost");
      expect(refresh.getBoundingClientRect().height).toBe(
        picker.getBoundingClientRect().height,
      );
      await userEvent.click(picker);
      const body = within(document.body);
      const option = await body.findByRole("option", {
        name: "Research notes",
      });
      const readOnly = body.getByRole("option", { name: /Read-only archive/ });
      expect(readOnly).toHaveAttribute("data-disabled");
      await expect(userEvent.click(readOnly)).rejects.toThrow(/pointer-events/);
      expect(plugin.settings.managedVaultId).toBe("");
      await userEvent.click(option);
      await waitFor(() => expect(plugin.settings.managedVaultId).toBe(vaultId));
      expect(picker).toHaveTextContent("Research notes");
      await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
      const test = canvas.getByRole("button", { name: "Test connection" });
      await waitFor(() => expect(test).toBeEnabled());
      await waitFor(() =>
        expect(getComputedStyle(test).pointerEvents).not.toBe("none"),
      );
      await userEvent.click(test);
      await waitFor(() =>
        expect(plugin.session.snapshot().destination.status).toBe("healthy"),
      );
      expect(
        canvas.getByText(
          /Connected to Lapis Server\. Account access confirmed/,
        ),
      ).toBeVisible();
      expect(calls).toEqual([
        "/api/trpc/system.info",
        "/api/trpc/vault.list",
        "/api/trpc/system.info",
        "/api/trpc/vault.open",
      ]);
      const copy = canvas.getByRole("button", {
        name: new RegExp(`^Copy full managed vault ID: ${vaultId}`),
      });
      expect(copy.textContent).not.toContain(vaultId);
      const clipboard = navigator.clipboard;
      const originalWrite = clipboard.writeText;
      let copied = "";
      clipboard.writeText = async (text) => {
        copied = text;
      };
      try {
        await userEvent.click(copy);
        await waitFor(() =>
          expect(copy).toHaveAttribute("data-copied", "true"),
        );
        expect(copied).toBe(vaultId);
      } finally {
        clipboard.writeText = originalWrite;
      }
      expect(plugin.session.can("sync")).toBe(false);
      expect(plugin.session.can("checkpoint")).toBe(false);
      expect(
        canvas.getByRole("switch", { name: "Enable sync" }),
      ).toBeDisabled();
      expect(
        canvas.getByRole("button", { name: "Create pairing invitation" }),
      ).toBeDisabled();
    } finally {
      globalThis.fetch = original;
    }
  },
);

export const VaultDiscoveryFailureAndRetry = settings(
  "setup",
  async ({ canvas, plugin }) => {
    const original = globalThis.fetch;
    let retry = false;
    let finish!: (response: Response) => void;
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      if (url.origin !== "https://vaults.example.test")
        return original(input, init);
      if (url.pathname.endsWith("system.info"))
        return Response.json({ result: { data: { protocolMajor: 1 } } });
      if (!retry) return new Response(null, { status: 401 });
      return new Promise((resolve) => {
        finish = resolve;
      });
    };
    try {
      await userEvent.type(
        canvas.getByRole("textbox", { name: "Server URL" }),
        "https://vaults.example.test",
      );
      await userEvent.tab();
      await waitFor(() =>
        expect(plugin.settings.serverUrl).toBe("https://vaults.example.test"),
      );
      const refresh = canvas.getByRole("button", {
        name: "Refresh managed vaults",
      });
      await userEvent.click(refresh);
      expect(await canvas.findByRole("alert")).toHaveTextContent(/Sign in/);
      retry = true;
      await userEvent.click(refresh);
      expect(await canvas.findByText("Loading managed vaults…")).toBeVisible();
      await waitFor(() => expect(finish).toBeTypeOf("function"));
      finish(Response.json({ result: { data: [] } }));
      expect(
        await canvas.findByText(
          "No active managed vaults are available to this account.",
        ),
      ).toBeVisible();
      expect(plugin.settings.managedVaultId).toBe("");
      expect(plugin.session.can("sync")).toBe(false);
    } finally {
      globalThis.fetch = original;
    }
  },
);
