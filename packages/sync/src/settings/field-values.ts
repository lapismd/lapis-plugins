import type {
  WorkspaceActionSetting,
  WorkspaceCustomSetting,
} from "@lapis-notes/api";
import type { PairingState, RecoveryPreview } from "../presentation/types";
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
