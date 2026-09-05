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
import type {
  RegistryCatalogDataSource,
  RegistryCatalogDetail,
  RegistryCatalogEntry,
} from "@lapismd/lapis-community/registry";
import { createCommunityTestRuntime } from "@lapismd/lapis-community/testing";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import { registryStoryParameters } from "../_shared/registry/registry-docs";
import CommunityNativeViewHarness from "./CommunityNativeViewHarness.svelte";

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

const registryEntry: RegistryCatalogEntry = {
  schemaVersion: 1,
  id: "ai",
  name: "AI Assistant",
  description: "Draft, revise, and explore ideas without leaving your notes.",
  author: "Lapis Notes",
  channel: "official",
  status: "active",
  latestVersion: "0.1.0",
  minAppVersion: "0.1.0",
  platforms: ["web", "desktop"],
  categories: ["productivity", "writing"],
  badges: ["official", "verified"],
  owner: { name: "Lapis Notes", verified: true },
  appearance: { icon: "sparkles", accent: "#7c3aed" },
  latestRelease: {
    releasedAt: "2026-09-05T08:00:00.000Z",
    bundleSize: 1_048_576,
  },
  detail: "plugins/ai.json",
};
const registryDetail: RegistryCatalogDetail = {
  schemaVersion: 1,
  id: registryEntry.id,
  name: registryEntry.name,
  description: registryEntry.description,
  author: registryEntry.author,
  channel: registryEntry.channel,
  status: registryEntry.status,
  latestVersion: registryEntry.latestVersion,
  owner: registryEntry.owner,
  appearance: registryEntry.appearance,
  license: "AGPL-3.0-or-later",
  highlights: [
    "Draft and revise from the active note",
    "Keep agent sessions attached to the workspace",
  ],
  versions: {
    "0.1.0": {
      version: "0.1.0",
      minAppVersion: "0.1.0",
      releasedAt: "2026-09-05T08:00:00.000Z",
      platforms: ["web", "desktop"],
      bundle: {
        url: "https://registry.example/plugins/ai/0.1.0.lapis-plugin",
        sha256: "a".repeat(64),
        size: 1_048_576,
      },
    },
  },
};
const registrySource: RegistryCatalogDataSource = {
  async loadIndex() {
    return {
      schemaVersion: 1,
      generatedAt: "2026-09-05T08:00:00.000Z",
      plugins: [registryEntry],
    };
  },
  async loadRuntime() {
    return null;
  },
  async loadPluginDetail() {
    return registryDetail;
  },
  async loadMarkdown() {
    return "# AI Assistant\n\nWork with your notes from one trusted workspace.";
  },
};
const registryOptions = {
  source: registrySource,
  installActions: { ai: { state: "available" as const } },
  onInstall: async () => undefined,
};

const consumerSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { CommunityPluginApplication } from "@lapis-notes/community";

  let { app }: { app: App } = $props();
<\/script>

<CommunityPluginApplication {app} />`;

const meta = {
  title: "Plugins/Community/Registry Screenshots",
  component: CommunityPluginApplication,
  args: { app, registryOptions },
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
    registryOptions: {
      control: false,
      description:
        "Optional registry composition; Lapis Notes derives it from app.pluginDistribution by default.",
    },
  },
  tags: ["registry-media", "visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    communityAppShell: true,
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      source: { language: "svelte", code: consumerSource, type: "code" },
      description: {
        component:
          "The first-party Community workspace view mounts the public CommunityApplication with the host-configured registry and delegates identity and installation operations to the host.",
      },
    },
  },
} satisfies Meta<typeof CommunityPluginApplication>;

export default meta;
type Story = StoryObj<typeof meta>;
const renderNativeView = ((args) => ({
  Component: CommunityNativeViewHarness,
  props: args,
})) as Story["render"];

export const Overview: Story = {
  args: { controller: runtime.controller },
  render: renderNativeView,
  parameters: registryStoryParameters(
    consumerSource,
    "The full Community workspace presents NIP-29 conversations and the host-verified plugin registry."
  ),
  play: async ({ canvas, canvasElement }) => {
    const application = canvasElement.querySelector(
      '[data-ui-component="community-app-shell"]'
    );
    if (!(application instanceof HTMLElement)) {
      throw new Error("Community application did not mount");
    }
    const nativeHeader = canvasElement.querySelector(
      '[data-testid="community-native-view-header"]'
    );
    await expect(nativeHeader).not.toBeVisible();
    await waitFor(
      () =>
        expect(application).toHaveAttribute(
          "data-community-status",
          "connected"
        ),
      { timeout: 15_000 }
    );
    const registry = canvas.getByRole("button", { name: "Registry" });
    await expect(registry).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Back" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Forward" })).toBeVisible();
    await userEvent.click(registry);
    await expect(
      canvas.getByRole("heading", { name: "Make Lapis Notes yours." })
    ).toBeVisible();
    await expect(canvas.getAllByText("AI Assistant").length).toBeGreaterThan(0);
  },
};

export const HostOwnedIdentity: Story = {
  args: { controller: anonymousController },
  render: renderNativeView,
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
      canvas.getByRole("button", { name: "Registry" })
    ).toBeVisible();
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
