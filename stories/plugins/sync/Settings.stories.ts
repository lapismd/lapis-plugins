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
  expect(canvas.queryByRole("button", {name: "Cancel pairing"})).toBeNull();
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

export const PairingControls = settings("dirty", async ({ canvas, runtime }) => {
  const group = canvas.getByRole("group", {name: "Pairing invitation actions"});
  expect(canvas.queryByRole("button", {name: "Cancel pairing"})).toBeNull();
  await userEvent.click(canvas.getByRole("button", {name: "Create pairing invitation"}));
  const qr = await canvas.findByRole("img", {name: "QR code for this pairing invitation"});
  expect(qr.getBoundingClientRect().top).toBeGreaterThanOrEqual(group.getBoundingClientRect().bottom);
  expect(canvas.queryByRole("button", {name: "Create pairing invitation"})).toBeNull();
  const cancel = canvas.getByRole("button", {name: "Cancel pairing"});
  expect(group).toContainElement(cancel);
  expect(cancel).toBeEnabled();
  await userEvent.click(cancel);
  await waitFor(() => expect(canvas.queryByRole("img", {name: "QR code for this pairing invitation"})).toBeNull());
  expect(runtime?.calls.some(a => a.type === "cancel-pairing")).toBe(true);
  expect(canvas.queryByRole("button", {name: "Cancel pairing"})).toBeNull();
  expect(canvas.getByRole("button", {name: "Create pairing invitation"})).toBeEnabled();
});
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
});
