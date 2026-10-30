import {
  getNativeDesktopBridge,
  type NativeDesktopBridge,
} from "@lapis-notes/api/desktop-native";
import { ControllerClient } from "@lapismd/ai-controller/client";

export interface ControllerConnection {
  client: ControllerClient;
  workspace: string;
}
/** Connections and volatile endpoint registrations belong to one plugin instance. */
export class ControllerConnectionPool {
  #bridge: NativeDesktopBridge | null = null;
  #closed = false;
  readonly #connections = new Map<string, Promise<ControllerConnection>>();
  constructor(readonly bridge = getNativeDesktopBridge) {}
  async get(workspace?: string): Promise<ControllerConnection> {
    if (this.#closed) throw new Error("AI controller connections are closed.");
    const bridge = this.bridge();
    if (!bridge) throw new Error("Connect an AI controller service first.");
    if (this.#bridge !== bridge) {
      this.#disposeConnections();
      this.#bridge = bridge;
    }
    const key = workspace ?? "";
    const existing = this.#connections.get(key);
    if (existing) return existing;
    const pending = (async () => {
      const connection = await bridge.invoke<{
        url: string;
        token: string;
        workspace: string;
      }>("desktop_ai_controller_connection", { workspace });
      if (this.#closed || this.#bridge !== bridge)
        throw new Error("The AI controller connection changed during startup.");
      if (
        typeof connection?.url !== "string" ||
        !/^wss?:\/\//u.test(connection.url) ||
        typeof connection.token !== "string" ||
        connection.token.length < 24 ||
        typeof connection.workspace !== "string" ||
        !connection.workspace.trim()
      )
        throw new Error(
          "The host returned an invalid AI controller connection.",
        );
      return {
        client: new ControllerClient(connection),
        workspace: connection.workspace,
      };
    })();
    this.#connections.set(key, pending);
    try {
      return await pending;
    } catch (error) {
      if (this.#connections.get(key) === pending) this.#connections.delete(key);
      throw error;
    }
  }
  close(): void {
    this.#closed = true;
    this.#disposeConnections();
    this.#bridge = null;
  }
  #disposeConnections(): void {
    for (const pending of this.#connections.values())
      void pending.then(
        (connection) => connection.client.dispose(),
        () => {},
      );
    this.#connections.clear();
  }
}
