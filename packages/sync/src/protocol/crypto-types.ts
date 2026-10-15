/** Protocol-owned structural contracts; hosts retain key custody and crypto. */
export type SyncCryptoObjectType =
  | "file-content"
  | "file-manifest"
  | "tree-manifest"
  | "revision-payload"
  | "revision-archive"
  | "head-payload"
  | "membership-payload"
  | "local-state";
export type SyncIdentitySigningPurpose =
  "transport" | "relay-auth" | "blossom-auth" | "connection-probe";
export interface UnsignedSyncEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}
