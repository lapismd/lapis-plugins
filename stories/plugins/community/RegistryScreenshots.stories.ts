import {
  NostrSignerHost,
  type App,
  type NostrSignerBroker,
} from "@lapis-notes/api";
import { CommunityPluginApplication } from "@lapis-notes/community";
import {
  createCommunityController,
  createNip29CommunitySource,
} from "@lapismd/lapis-community/community";
import { createCommunityTestRuntime } from "@lapismd/lapis-community/testing";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import { registryStoryParameters } from "../_shared/registry/registry-docs";

const runtime = await createCommunityTestRuntime({
  namespace: "community-plugin-story",
});
const anonymousController = createCommunityController({
  scopes: [runtime.scenario.scope],
  source: createNip29CommunitySource({ relayFactory: runtime.relayFactory }),
  now: () => 1_700_000_100,
});

const signerBroker: NostrSignerBroker = {
  listAccounts: async () => [
    {
      id: "storybook-profile",
      label: "Steve",
      pubkey: "a".repeat(64),
      kind: "local",
    },
  ],
  requestProfileCreation: async () => {
    throw new Error("Not used in this story");
  },
  connectRemoteSigner: async () => {
    throw new Error("Not used in this story");
  },
  getPublicKey: async () => "a".repeat(64),
  signEvent: async (_context, _accountId, event) => ({
    ...event,
    id: "b".repeat(64),
    pubkey: "a".repeat(64),
    sig: "c".repeat(128),
  }),
  nip44Encrypt: async () => "ciphertext",
  nip44Decrypt: async () => "plaintext",
  close: async () => undefined,
};
const app = {
  nostr: new NostrSignerHost(signerBroker),
} as App;

const consumerSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { CommunityPluginApplication } from "@lapis-notes/community";

  let { app }: { app: App } = $props();
<\/script>

<CommunityPluginApplication {app} />`;

const meta = {
  title: "Plugins/Community/Registry Screenshots",
  component: CommunityPluginApplication,
  args: { app },
  argTypes: {
    app: {
      control: false,
      description: "Initialized Lapis App that owns the Nostr signer broker.",
    },
    controller: {
      control: false,
      description:
        "Optional Community controller for host composition and deterministic tests.",
    },
    loginOptions: {
      control: false,
      description:
        "Optional host login composition; Lapis Notes uses app.nostr by default.",
    },
  },
  tags: ["registry-media", "visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    communityAppShell: true,
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      source: { language: "svelte", code: consumerSource },
      description: {
        component:
          "The first-party Community workspace view mounts the public CommunityApplication without registry routes and delegates identity operations to the host.",
      },
    },
  },
} satisfies Meta<typeof CommunityPluginApplication>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  args: { controller: runtime.controller },
  parameters: registryStoryParameters(
    consumerSource,
    "The full Community workspace presents NIP-29 conversations without exposing registry navigation."
  ),
  play: async ({ canvas, canvasElement }) => {
    const application = canvasElement.querySelector(
      '[data-ui-component="community-app-shell"]'
    );
    if (!(application instanceof HTMLElement)) {
      throw new Error("Community application did not mount");
    }
    await waitFor(
      () =>
        expect(application).toHaveAttribute(
          "data-community-status",
          "connected"
        ),
      { timeout: 15_000 }
    );
    await expect(
      canvas.queryByRole("button", { name: "Registry" })
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "general" })).toBeVisible();
  },
};

export const HostOwnedIdentity: Story = {
  args: { controller: anonymousController },
  parameters: registryStoryParameters(
    consumerSource,
    "Community offers saved profiles, local profile creation, and NIP-46 remote signers through the host-owned identity boundary."
  ),
  play: async ({ canvas, canvasElement }) => {
    const application = canvasElement.querySelector(
      '[data-ui-component="community-app-shell"]'
    );
    if (!(application instanceof HTMLElement)) {
      throw new Error("Community application did not mount");
    }
    await waitFor(
      () =>
        expect(application).toHaveAttribute(
          "data-community-status",
          "connected"
        ),
      { timeout: 15_000 }
    );
    await expect(
      canvas.queryByRole("button", { name: "Registry" })
    ).not.toBeInTheDocument();
    const overlay = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open profile menu for Guest" })
    );
    await userEvent.click(overlay.getByRole("menuitem", { name: "Sign in" }));
    const dialog = await overlay.findByRole("dialog", {
      name: "Sign in to Community",
    });
    const login = within(dialog);
    await expect(login.getByRole("button", { name: /Steve/u })).toBeVisible();
    await expect(
      login.getByRole("button", { name: /Create a new account/u })
    ).toBeVisible();
    await expect(
      login.getByRole("button", { name: /Remote signer/u })
    ).toBeVisible();
    await expect(
      login.queryByRole("button", { name: /Paste a private key/u })
    ).not.toBeInTheDocument();
  },
};
