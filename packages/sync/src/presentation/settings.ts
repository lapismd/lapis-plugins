import type { SyncSettings } from "./types";

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  provider: "lapis-server",
  serverUrl: "",
  managedVaultId: "",
  enabled: false,
  indexFileTags: false,
};
export function readSyncSettings(value: unknown): SyncSettings {
  const data =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  let serverUrl =
    typeof data.serverUrl === "string"
      ? data.serverUrl.trim().slice(0, 2048)
      : "";
  try {
    const url = new URL(serverUrl);
    if (url.username || url.password || url.search || url.hash) serverUrl = "";
  } catch {
    /* Partial public URL drafts remain editable. */
  }
  return {
    ...DEFAULT_SYNC_SETTINGS,
    serverUrl,
    managedVaultId:
      typeof data.managedVaultId === "string" ? data.managedVaultId.trim() : "",
    enabled: data.enabled === true,
    indexFileTags: data.indexFileTags === true,
  };
}
export function validateSyncDestination(
  settings: Pick<SyncSettings, "serverUrl" | "managedVaultId">,
): string | null {
  if (!settings.serverUrl || !settings.managedVaultId)
    return "Enter the Lapis Server URL and managed vault ID.";
  try {
    const url = new URL(settings.serverUrl);
    if (url.protocol !== "https:") return "Lapis Server requires HTTPS.";
    if (url.username || url.password || url.search || url.hash)
      return "Use a server URL without credentials, query parameters or fragments.";
  } catch {
    return "Enter a valid HTTPS server URL.";
  }
  return null;
}
