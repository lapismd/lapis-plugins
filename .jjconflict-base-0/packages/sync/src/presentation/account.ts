/** Public presentation only. The host retains every account credential. */
export type SyncAccountState = {
  status: "unavailable" | "signed-out" | "signing-in" | "signed-in" | "error";
  serverUrl: string;
  username: string | null;
  verificationUrl: string | null;
  message: string;
};

export interface SyncAccountHost {
  snapshot(): SyncAccountState;
  subscribe(listener: () => void): () => void;
  configure(serverUrl: string): void;
  signIn(): Promise<void>;
  openSignIn(): void;
  cancel(): Promise<void>;
  signOut(): Promise<void>;
}
