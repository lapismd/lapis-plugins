import type {
  SyncAccountHost,
  SyncAccountState,
} from "@lapis-notes/lapis-plugin-sync";

type Proof = { requestId: string; verifier: string };
const proofPattern = /^[A-Za-z0-9_-]{43}$/u;
const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** Private host adapter. No credential is exposed to the plugin or persisted. */
export class MemoryServerAccount implements SyncAccountHost {
  #state: SyncAccountState = {
    status: "signed-out",
    serverUrl: "",
    username: null,
    verificationUrl: null,
    message: "Enter your server URL, then sign in.",
  };
  #listeners = new Set<() => void>();
  #generation = 0;
  #proof?: Proof;
  #credential?: { origin: string; token: string };
  #timer?: ReturnType<typeof setTimeout>;
  #disposed = false;
  constructor(
    private readonly fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)
  ) {}
  snapshot(): SyncAccountState {
    return { ...this.#state };
  }
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  #set(patch: Partial<SyncAccountState>) {
    if (this.#disposed) return;
    this.#state = { ...this.#state, ...patch };
    this.#listeners.forEach((listener) => listener());
  }
  #origin(): string {
    const url = new URL(this.#state.serverUrl);
    const loopback =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (!loopback && url.protocol !== "https:") ||
      url.href !== `${url.origin}/`
    )
      throw new Error(
        "Use an HTTPS server origin without a path or credentials."
      );
    return url.origin;
  }
  async #send(origin: string, path: string, body: unknown) {
    return this.fetchImpl(`${origin}/api/client-auth/${path}`, {
      method: "POST",
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  }
  async #revoke(credential: { origin: string; token: string }) {
    const response = await this.fetchImpl(
      `${credential.origin}/api/trpc/auth.logout`,
      {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: {
          authorization: `Bearer ${credential.token}`,
          "content-type": "application/json",
        },
        body: "null",
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!response.ok && response.status !== 401)
      throw new Error("Sign-out unavailable");
  }
  configure(serverUrl: string): void {
    if (this.#state.serverUrl === serverUrl || this.#disposed) return;
    const old = this.#credential,
      proof = this.#proof;
    let oldOrigin: string | undefined;
    try {
      oldOrigin = this.#origin();
    } catch {
      /* No prior destination. */
    }
    this.#generation++;
    clearTimeout(this.#timer);
    this.#proof = this.#credential = undefined;
    this.#set({
      serverUrl,
      status: "signed-out",
      username: null,
      verificationUrl: null,
      message: "Sign in to access your managed vaults.",
    });
    if (old) void this.#revoke(old).catch(() => {});
    if (proof && oldOrigin)
      void this.#send(oldOrigin, "cancel", proof).catch(() => {});
  }
  async signIn(): Promise<void> {
    if (
      this.#disposed ||
      this.#credential ||
      this.#state.status === "signing-in"
    )
      return;
    const current = ++this.#generation;
    this.#set({
      status: "signing-in",
      verificationUrl: null,
      username: null,
      message: "Preparing secure sign-in…",
    });
    try {
      const origin = this.#origin();
      const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
      const codeChallenge = base64url(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(verifier)
          )
        )
      );
      const response = await this.#send(origin, "start", {
        clientName: "Lapis Notes Sync",
        codeChallenge,
      });
      if (!response.ok) throw new Error();
      const value = await response.json();
      const verification = new URL(value.verificationUrl);
      if (
        !proofPattern.test(value.requestId) ||
        verification.origin !== origin ||
        verification.username ||
        verification.password ||
        verification.pathname !== "/" ||
        verification.searchParams.get("authorize_client") !== value.requestId ||
        !Number.isFinite(value.expiresAt) ||
        value.expiresAt <= Date.now() ||
        value.expiresAt > Date.now() + 300_000
      )
        throw new Error();
      const proof = { requestId: value.requestId, verifier };
      if (current !== this.#generation || this.#disposed) {
        await this.#send(origin, "cancel", proof);
        return;
      }
      this.#proof = proof;
      this.#set({
        verificationUrl: verification.href,
        message:
          "Open server sign-in, approve Lapis Notes Sync, then return here. Waiting for approval…",
      });
      void this.#poll(current, origin, proof, value.expiresAt);
    } catch {
      if (current === this.#generation)
        this.#set({
          status: "error",
          verificationUrl: null,
          message:
            "Unable to start sign-in. Check the server address and connection, then retry.",
        });
    }
  }
  openSignIn(): void {
    const url = this.#state.verificationUrl;
    if (url && new URL(url).origin === this.#origin())
      window.open(url, "_blank", "noopener,noreferrer");
  }
  async #poll(
    current: number,
    origin: string,
    proof: Proof,
    expiresAt: number
  ): Promise<void> {
    try {
      if (Date.now() >= expiresAt) throw new Error("expired");
      const response = await this.#send(origin, "token", proof);
      if (response.status === 202) {
        if (current === this.#generation && !this.#disposed)
          this.#timer = setTimeout(
            () => void this.#poll(current, origin, proof, expiresAt),
            2_000
          );
        return;
      }
      if (!response.ok)
        throw new Error(response.status === 401 ? "expired" : "rejected");
      const grant = await response.json();
      if (
        grant.status !== "authorized" ||
        grant.tokenType !== "Bearer" ||
        !proofPattern.test(grant.accessToken)
      )
        throw new Error();
      const credential = { origin, token: grant.accessToken };
      if (current !== this.#generation || this.#disposed) {
        await this.#revoke(credential);
        return;
      }
      this.#credential = credential;
      this.#proof = undefined;
      const account = await this.request(`${origin}/api/trpc/auth.current`);
      if (!account.ok) throw new Error();
      const user = (await account.json()).result?.data?.user;
      if (
        !user ||
        typeof user.username !== "string" ||
        !user.username ||
        user.username.length > 200
      )
        throw new Error();
      if (current !== this.#generation || this.#disposed) return;
      this.#set({
        status: "signed-in",
        username: user.username,
        verificationUrl: null,
        message: `Signed in as ${user.username}. Device enrollment is still required before content can sync.`,
      });
    } catch (cause) {
      if (current !== this.#generation || this.#disposed) return;
      const credential = this.#credential;
      this.#credential = undefined;
      this.#proof = undefined;
      if (credential) void this.#revoke(credential).catch(() => {});
      const reason = cause instanceof Error ? cause.message : "";
      this.#set({
        status: "error",
        username: null,
        verificationUrl: null,
        message:
          reason === "expired"
            ? "Sign-in expired. Start again."
            : reason === "rejected"
            ? "Sign-in was rejected or cancelled. Start again when ready."
            : "Unable to complete sign-in. Check the connection and retry.",
      });
    }
  }
  async cancel(): Promise<void> {
    const proof = this.#proof;
    const credential = this.#credential;
    const origin = this.#origin();
    this.#generation++;
    clearTimeout(this.#timer);
    try {
      if (credential) await this.#revoke(credential);
      if (proof) {
        const response = await this.#send(origin, "cancel", proof);
        if (!response.ok && ![401, 403].includes(response.status))
          throw new Error();
      }
      this.#proof = undefined;
      this.#credential = undefined;
      this.#set({
        status: "signed-out",
        verificationUrl: null,
        message: "Sign-in cancelled.",
      });
    } catch {
      this.#set({
        status: "error",
        message:
          "Cancellation could not be confirmed. Retry or wait for the request to expire.",
      });
    }
  }
  async signOut(): Promise<void> {
    const credential = this.#credential;
    try {
      if (credential) await this.#revoke(credential);
      this.#generation++;
      this.#credential = undefined;
      this.#set({
        status: "signed-out",
        username: null,
        verificationUrl: null,
        message: "Signed out of Lapis Server.",
      });
    } catch {
      this.#set({
        status: "error",
        message: "Sign-out could not be confirmed. Please retry.",
      });
    }
  }
  readonly request: typeof fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url
    );
    const credential = this.#credential;
    if (
      !credential ||
      url.origin !== credential.origin ||
      url.origin !== this.#origin()
    )
      return new Response(null, { status: 401 });
    const headers = new Headers(init?.headers);
    headers.set("authorization", `Bearer ${credential.token}`);
    const response = await this.fetchImpl(input, {
      ...init,
      headers,
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(10_000),
    });
    if (response.status === 401 && this.#credential === credential) {
      this.#credential = undefined;
      this.#set({
        status: "signed-out",
        username: null,
        verificationUrl: null,
        message: "Your server session expired or was revoked. Sign in again.",
      });
    }
    return response;
  };
  async dispose(): Promise<void> {
    const credential = this.#credential,
      proof = this.#proof;
    let origin: string | undefined;
    try {
      origin = this.#origin();
    } catch {
      /* Unconfigured. */
    }
    this.#disposed = true;
    this.#generation++;
    clearTimeout(this.#timer);
    this.#credential = this.#proof = undefined;
    this.#listeners.clear();
    if (credential) await this.#revoke(credential).catch(() => {});
    if (proof && origin)
      await this.#send(origin, "cancel", proof).catch(() => {});
  }
}
