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
  policy: { allowLoopbackHttp?: boolean } = {},
): string | null {
  if (!settings.serverUrl || !settings.managedVaultId)
    return "Enter the Lapis Server URL and managed vault ID.";
  return validateSyncServerUrl(settings.serverUrl, policy);
}
export function validateSyncServerUrl(
  serverUrl: string,
  policy: { allowLoopbackHttp?: boolean } = {},
): string | null {
  if (!serverUrl) return "Enter the Lapis Server URL to load managed vaults.";
  try {
    const url = new URL(serverUrl);
    const localHttp =
      policy.allowLoopbackHttp === true &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !localHttp)
      return "Lapis Server requires HTTPS.";
    if (url.username || url.password || url.search || url.hash)
      return "Use a server URL without credentials, query parameters or fragments.";
  } catch {
    return "Enter a valid HTTPS server URL.";
  }
  return null;
}
