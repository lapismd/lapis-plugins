import type {
  PluginSettingsDefinition,
  WorkspaceActionSetting,
} from "@lapis-notes/api";
import type { PairingSettingsFieldDefinition } from "./field-values";
import type { SyncAction } from "../presentation/types";
import type { SyncSettingsSource } from "./source";
import PairingSettingsField from "../ui/PairingSettingsField.svelte";
import RecoverySettingsField from "../ui/RecoverySettingsField.svelte";

export function createSyncSettingsDefinition(
  source: SyncSettingsSource,
): PluginSettingsDefinition {
  const session = source.plugin.session;
  const action = (
    type: SyncAction["type"],
    description: string,
    label: string,
    icon: WorkspaceActionSetting["icon"],
    run: WorkspaceActionSetting["run"],
    isDisabled = () => !session.can(type),
  ): WorkspaceActionSetting => ({
    id: `sync.${type}`,
    type: "action",
    title: label,
    description,
    label,
    icon,
    isDisabled,
    isBusy: () => session.busy,
    run,
  });
  const pairingField: PairingSettingsFieldDefinition = {
    id: "sync.pairing",
    type: "custom",
    title: "Pairing invitation",
    adapter: "sync.pairing",
    presentation: "full-width",
    actions: [
      action(
        "begin-pairing",
        "Owner invitation",
        "Create pairing invitation",
        "qr-code",
        () => source.action({ type: "begin-pairing" }),
      ),
      action(
        "cancel-pairing",
        "Cancel pairing",
        "Cancel pairing",
        "x",
        () => source.action({ type: "cancel-pairing" }),
        () => !source.canCancel(),
      ),
    ],
  };
  return {
    source,
    adapters: [
      { id: "sync.pairing", component: PairingSettingsField },
      { id: "sync.recovery", component: RecoverySettingsField },
    ],
    section: {
      id: "sync",
      title: "Lapis Sync",
      description: "Encrypted history, paired devices and Lapis Server.",
      icon: "refresh-cw",
      order: 45,
      navigationGroupId: "core-plugins",
      sourcePluginId: "sync",
      fields: [
        {
          id: "sync.services",
          type: "group",
          title: "Sync services",
          fields: [
            {
              id: "sync.provider",
              type: "enum",
              title: "Destination",
              description:
                "Lapis Server stores encrypted revisions and content objects.",
              default: "lapis-server",
              options: [{ value: "lapis-server", label: "Lapis Server" }],
              readOnly: true,
            },
            { id: "sync.encryption", type: "output", title: "Encryption" },
            {
              id: "sync.syncIdentity",
              type: "output",
              title: "Vault Sync Identity",
              presentation: "copyable",
              emptyLabel: "Not enrolled",
              description:
                "The stable npub shared by enrolled devices. Account login alone does not grant content access.",
            },
            {
              id: "sync.serverUrl",
              type: "string",
              title: "Server URL",
              description:
                "Use the HTTPS address of your Lapis Server, without credentials.",
              presentation: "url",
              default: "",
              placeholder: "https://sync.example.com",
              maxLength: 2048,
            },
            {
              id: "sync.managedVaultId",
              type: "string",
              title: "Managed vault ID",
              description:
                "The managed vault you are authorized to synchronize.",
              default: "",
              maxLength: 256,
            },
            action(
              "test-connection",
              "Remote access",
              "Test connection",
              "radio",
              () => source.action({ type: "test-connection" }),
            ),
            {
              id: "sync.connection",
              type: "output",
              title: "Connection health",
              presentation: "status",
            },
            {
              id: "sync.enabled",
              type: "boolean",
              title: "Enable sync",
              description:
                "Requires an authorized server connection and an enrolled, unlocked device.",
              default: false,
              disabled: !session.runtime?.actions.includes("sync"),
            },
            {
              id: "sync.indexFileTags",
              type: "boolean",
              title: "Publish opaque file-index tags",
              description:
                "Include keyed path tags without exposing plaintext paths.",
              default: false,
            },
          ],
        },
        {
          id: "sync.this-device",
          type: "group",
          title: "This device",
          fields: [
            { id: "sync.deviceAlias", type: "output", title: "Alias" },
            {
              id: "sync.devicePublicKey",
              type: "output",
              title: "Device public key",
              presentation: "copyable",
            },
            {
              id: "sync.role",
              type: "output",
              title: "Role",
              presentation: "status",
            },
            { id: "sync.epoch", type: "output", title: "Encryption epoch" },
          ],
        },
        {
          id: "sync.active-devices",
          type: "group",
          title: "Active devices",
          description:
            "Revocation prevents future access. A device can retain content and keys it received before revocation.",
          fields: [
            {
              id: "sync.devices",
              type: "object-array",
              title: "Devices",
              default: [],
              rowKey: "publicKey",
              allowAdd: false,
              allowRemove: false,
              properties: [
                {
                  id: "alias",
                  title: "Device",
                  type: "string",
                  readOnly: true,
                },
                {
                  id: "publicKey",
                  title: "Public key",
                  type: "string",
                  presentation: "copyable",
                  readOnly: true,
                },
                {
                  id: "role",
                  title: "Role",
                  type: "string",
                  presentation: "status",
                  readOnly: true,
                },
              ],
              rowActions: [
                {
                  id: "revoke",
                  label: "Revoke device",
                  icon: "shield-x",
                  variant: "destructive",
                  disabled: (row) =>
                    !session.can("revoke-device") ||
                    row.publicKey ===
                      session.snapshot().security.devicePublicKey ||
                    row.revoked === true,
                  confirm: () =>
                    window.confirm(
                      "Revoke this device? It may retain content and keys received before revocation. The Vault Sync Identity is unchanged.",
                    ),
                  run: (row) =>
                    source.action({
                      type: "revoke-device",
                      publicKey: String(row.publicKey),
                    }),
                },
              ],
            },
          ],
        },
        {
          id: "sync.pair-device",
          type: "group",
          title: "Pair a device",
          description:
            "Each device retains its own signing key. Confirm the same security code before encrypted access is transferred.",
          fields: [
            {
              id: "sync.pairingAlias",
              type: "string",
              title: "New device alias",
              description:
                "A recognizable name for the device you are enrolling.",
              default: "This device",
              maxLength: 64,
            },
            pairingField,
            action(
              "accept-pairing",
              "Join this vault",
              "Accept invitation",
              "link",
              () => source.acceptPairing(),
              () => !source.canAccept(),
            ),
            action(
              "confirm-pairing",
              "Verify both devices",
              "Confirm security code",
              "shield-check",
              () => source.confirmPairing(),
            ),
          ],
        },
        {
          id: "sync.recovery-group",
          type: "group",
          title: "Recovery",
          description:
            "Keep encrypted recovery bundles private. Review the file bindings before applying recovery.",
          fields: [
            action(
              "export-recovery",
              "Owner recovery",
              "Export encrypted recovery bundle",
              "download",
              () => source.action({ type: "export-recovery" }),
            ),
            {
              id: "sync.recovery",
              type: "custom",
              title: "Recovery bundle",
              adapter: "sync.recovery",
              presentation: "row",
            },
            action(
              "preview-recovery",
              "Review recovery",
              "Preview recovery",
              "scan-search",
              () => source.previewRecovery(),
              () => !source.canPreview(),
            ),
            action(
              "apply-recovery",
              "Apply reviewed choices",
              "Apply recovery",
              "archive-restore",
              () => source.applyRecovery(),
              () => !source.canApplyRecovery(),
            ),
          ],
        },
        {
          id: "sync.operationResult",
          type: "output",
          title: "Last operation",
          presentation: "status",
        },
      ],
    },
  };
}
