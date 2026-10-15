import type { NativeDesktopBridge } from "@lapis-notes/api";
import type { SyncAccountHost, SyncAccountState } from "./account";
import { validateSyncServerUrl } from "./settings";

/** Uses the released native bridge; bearer credentials and authorization proofs stay native. */
export class NativeSyncAccount implements SyncAccountHost {
  #state: SyncAccountState = {
    status: "signed-out",
    serverUrl: "",
    username: null,
    verificationUrl: null,
    message: "Enter your server URL, then sign in.",
  };
  #listeners = new Set<() => void>();
  #runtimeId = crypto.randomUUID();
  #generation = 0;
  #action = 0;
  #closed = false;
  #sessionId?: string;
  #tail: Promise<unknown> = Promise.resolve();
  #opening: Promise<string | undefined> = Promise.resolve(undefined);
  #timer?: ReturnType<typeof setTimeout>;
  constructor(
    readonly bridge: Pick<NativeDesktopBridge, "invoke">,
    readonly profileId: string
  ) {}
  snapshot() {
    return { ...this.#state };
  }
  subscribe(listener: () => void) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  #set(patch: Partial<SyncAccountState>) {
    if (this.#closed) return;
    const next = { ...this.#state, ...patch };
    if (
      (Object.keys(next) as (keyof SyncAccountState)[]).every(
        (key) => next[key] === this.#state[key]
      )
    )
      return;
    this.#state = next;
    this.#listeners.forEach((listener) => listener());
  }
  #current(generation: number) {
    return !this.#closed && generation === this.#generation;
  }
  #apply(value: unknown, generation: number) {
    if (!this.#current(generation)) return;
    if (!value || typeof value !== "object")
      throw new Error("Invalid native account state");
    const state = value as Record<string, unknown>;
    if (
      state.serverOrigin !== new URL(this.#state.serverUrl).origin ||
      typeof state.message !== "string" ||
      state.message.length > 1_000 ||
      (state.username !== null &&
        (typeof state.username !== "string" || state.username.length > 200))
    )
      throw new Error("Invalid native account state");
    const statuses = {
      "signed-out": "signed-out",
      checking: "signing-in",
      "signing-in": "signing-in",
      "signed-in": "signed-in",
      offline: "error",
      error: "error",
      closed: "unavailable",
    } as const;
    const status = statuses[state.status as keyof typeof statuses];
    if (!status) throw new Error("Invalid native account state");
    let verificationUrl: string | null = null;
    if (state.verificationUrl != null) {
      if (
        typeof state.verificationUrl !== "string" ||
        state.verificationUrl.length > 2_048
      )
        throw new Error("Invalid approval URL");
      const url = new URL(state.verificationUrl);
      if (
        url.origin !== state.serverOrigin ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.hash ||
        url.searchParams.size !== 1 ||
        !/^[A-Za-z0-9_-]{43}$/u.test(
          url.searchParams.get("authorize_client") ?? ""
        )
      )
        throw new Error("Invalid approval URL");
      verificationUrl = url.href;
    }
    this.#set({
      status,
      username: state.username as string | null,
      verificationUrl,
      message: state.message,
    });
    clearTimeout(this.#timer);
    if (status === "signing-in")
      this.#timer = setTimeout(() => void this.#call("snapshot"), 1_000);
  }
  configure(serverUrl: string) {
    if (this.#closed || serverUrl === this.#state.serverUrl) return;
    const generation = ++this.#generation,
      previous = this.#sessionId;
    this.#sessionId = undefined;
    clearTimeout(this.#timer);
    this.#set({
      serverUrl,
      status: "signed-out",
      username: null,
      verificationUrl: null,
      message: serverUrl
        ? "Checking saved server account…"
        : "Enter your server URL, then sign in.",
    });
    this.#opening = this.#tail
      .then(async () => {
        if (previous)
          await this.bridge.invoke("desktop_server_account_close", {
            sessionId: previous,
          });
        if (!this.#current(generation) || !serverUrl) return;
        if (validateSyncServerUrl(serverUrl, { allowLoopbackHttp: true }))
          throw new Error("Invalid server URL");
        const opened = await this.bridge.invoke<{
          sessionId: string;
          state: unknown;
        }>("desktop_server_account_open", {
          profileId: this.profileId,
          runtimeId: this.#runtimeId,
          serverOrigin: new URL(serverUrl).origin,
        });
        if (
          !opened ||
          typeof opened.sessionId !== "string" ||
          !/^[A-Za-z0-9-]{36}$/u.test(opened.sessionId)
        )
          throw new Error("Invalid native account session");
        if (!this.#current(generation)) {
          await this.bridge.invoke("desktop_server_account_close", {
            sessionId: opened.sessionId,
          });
          return;
        }
        this.#sessionId = opened.sessionId;
        this.#apply(opened.state, generation);
        return opened.sessionId;
      })
      .catch(() => {
        if (this.#current(generation))
          this.#set({
            status: "unavailable",
            message:
              "Protected server accounts are unavailable. Update the desktop host or check protected storage, then retry.",
          });
        return undefined;
      });
    this.#tail = this.#opening;
  }
  async #call(operation: string): Promise<void> {
    const generation = this.#generation;
    if (["signIn", "cancel", "signOut"].includes(operation)) this.#action++;
    const action = this.#action;
    try {
      const sessionId = await this.#opening;
      if (!sessionId || !this.#current(generation)) return;
      const state = await this.bridge.invoke("desktop_server_account_call", {
        sessionId,
        operation,
      });
      if (action === this.#action) this.#apply(state, generation);
    } catch {
      if (this.#current(generation) && action === this.#action)
        this.#set({
          status: "error",
          username: null,
          verificationUrl: null,
          message:
            "Account action could not complete. Check the connection and retry.",
        });
    }
  }
  async signIn() {
    await this.#call("signIn");
  }
  openSignIn() {
    void this.#call("openSignIn");
  }
  async cancel() {
    clearTimeout(this.#timer);
    await this.#call("cancel");
  }
  async signOut() {
    clearTimeout(this.#timer);
    await this.#call("signOut");
  }
  readonly request: typeof fetch = async (input, init) => {
    const generation = this.#generation,
      action = this.#action,
      sessionId = await this.#opening;
    if (!this.#current(generation) || !sessionId)
      return new Response(null, { status: 401 });
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (
      url.origin !== new URL(this.#state.serverUrl).origin ||
      url.username ||
      url.password ||
      (init?.method ?? "GET") !== "GET" ||
      init?.body != null
    )
      throw new Error("Unsupported native account request");
    init?.signal?.throwIfAborted();
    const result = await this.bridge.invoke<{
      status: number;
      body: string;
      state: unknown;
    }>("desktop_server_account_call", {
      sessionId,
      operation: "request",
      path: url.pathname + url.search,
    });
    init?.signal?.throwIfAborted();
    if (!this.#current(generation) || action !== this.#action)
      throw new Error("Native account destination or session changed");
    this.#apply(result.state, generation);
    if (
      typeof result.body !== "string" ||
      result.body.length > 1_048_576 ||
      !Number.isInteger(result.status) ||
      result.status < 200 ||
      result.status > 599
    )
      throw new Error("Invalid native account response");
    return new Response(result.body, {
      status: result.status,
      headers: { "content-type": "application/json" },
    });
  };
  async dispose() {
    this.#closed = true;
    this.#generation++;
    clearTimeout(this.#timer);
    await this.#tail;
    if (this.#sessionId)
      await this.bridge.invoke("desktop_server_account_close", {
        sessionId: this.#sessionId,
      });
    this.#listeners.clear();
  }
}
