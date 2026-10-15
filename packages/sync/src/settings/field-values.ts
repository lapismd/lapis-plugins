import type {
  WorkspaceActionSetting,
  WorkspaceCustomSetting,
} from "@lapis-notes/api";
import type {
  PairingState,
  RecoveryPreview,
  ManagedVault,
} from "../presentation/types";
export type PairingSettingsValue = PairingState & {
  invitationInput: string;
  cameraActive: boolean;
};
export type RecoverySettingsValue = {
  selectedFile: File | null;
  status: string | null;
  preview: RecoveryPreview | null;
  choices: Record<string, "remote" | "local" | "keep-both">;
  error: string | null;
};

export interface PairingSettingsFieldDefinition extends WorkspaceCustomSetting {
  actions: WorkspaceActionSetting[];
}

export type ManagedVaultSettingsValue = {
  requiresSignIn?: boolean;
  selectedId: string;
  serverUrl: string;
  vaults: ManagedVault[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
};
export interface ManagedVaultSettingsFieldDefinition
  extends WorkspaceCustomSetting {
  refresh(): Promise<void>;
  cancel(): void;
}

export interface AccountSettingsFieldDefinition extends WorkspaceCustomSetting {
  openSignIn(): void;
  signIn(): Promise<void>;
  cancel(): Promise<void>;
  signOut(): Promise<void>;
}
