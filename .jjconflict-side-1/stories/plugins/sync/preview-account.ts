import type {
  SyncAccountHost,
  SyncAccountState,
} from "@lapis-notes/lapis-plugin-sync";

/** Presentation fixture only. Live approval is verified separately against Deno. */
export class PreviewAccountHost implements SyncAccountHost {
  #state: SyncAccountState;
  #listeners = new Set<() => void>();
  readonly calls: string[] = [];
  constructor(status: SyncAccountState["status"]) {
    this.#state = {
      status,
      serverUrl: "https://sync.example.test",
      username: status === "signed-in" ? "alex" : null,
      verificationUrl:
        status === "signing-in"
          ? "https://sync.example.test/?authorize_client=review"
          : null,
      message:
        status === "signed-in"
          ? "Signed in as alex. Device enrollment is still required before content can sync."
          : status === "signing-in"
          ? "Open server sign-in, approve Lapis Notes Sync, then return here. Waiting for approval…"
          : status === "error"
          ? "Sign-in expired. Start again."
          : "Sign in to access your managed vaults.",
    };
  }
  snapshot() {
    return { ...this.#state };
  }
  subscribe(listener: () => void) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  configure(serverUrl: string) {
    this.#state.serverUrl = serverUrl;
  }
  #set(patch: Partial<SyncAccountState>) {
    this.#state = { ...this.#state, ...patch };
    this.#listeners.forEach((listener) => listener());
  }
  async signIn() {
    this.calls.push("signIn", "openSignIn");
    this.#set({
      status: "signing-in",
      verificationUrl: `${this.#state.serverUrl}/?authorize_client=review`,
      message:
        "Complete server sign-in in the opened window or use the link below, then return here. Waiting for approval…",
    });
  }
  openSignIn() {
    this.calls.push("openSignIn");
  }
  approve() {
    this.#set({
      status: "signed-in",
      username: "alex",
      verificationUrl: null,
      message:
        "Signed in as alex. Device enrollment is still required before content can sync.",
    });
  }
  async cancel() {
    this.calls.push("cancel");
    this.#set({
      status: "signed-out",
      username: null,
      verificationUrl: null,
      message: "Sign-in cancelled.",
    });
  }
  async signOut() {
    this.calls.push("signOut");
    this.#set({
      status: "signed-out",
      username: null,
      verificationUrl: null,
      message: "Signed out of Lapis Server.",
    });
  }
}
