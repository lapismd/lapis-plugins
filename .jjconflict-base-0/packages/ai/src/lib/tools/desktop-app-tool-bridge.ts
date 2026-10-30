import type { Json } from "@lapismd/ai-controller/contracts";
import type {
  AgentEvent,
  AppToolSessionDescriptor,
  ApprovalOptionKind,
} from "../core/types";
import type { ControllerConnection } from "../host/controller-connection";
import {
  AppToolExecutionError,
  AppToolHost,
  type CreateAppToolSessionInput,
} from "./app-tool-host";

export type AppToolBridgeEvent = { bindingId: string; event: AgentEvent };
export interface AppToolBridgeCoordinator {
  prepare(input: CreateAppToolSessionInput): Promise<AppToolSessionDescriptor>;
  closeBinding(bindingId: string): Promise<void>;
  respondToApproval(requestId: string, decision: ApprovalOptionKind): boolean;
  subscribe(listener: (event: AppToolBridgeEvent) => void): () => void;
  close(): Promise<void>;
}
type BridgeRecord = {
  bindingId: string;
  bridgeId: string;
  unregister?: () => Promise<void>;
  calls: Map<
    string,
    { abort: AbortController; runId: string; sequence: number }
  >;
};
/** App authorization stays here; the shared SDK owns transport and tool receipts. */
export class DesktopAppToolBridge implements AppToolBridgeCoordinator {
  readonly #records = new Map<string, BridgeRecord>();
  readonly #listeners = new Set<(event: AppToolBridgeEvent) => void>();
  readonly #unsubscribeApprovals: () => void;
  constructor(
    private readonly host: AppToolHost,
    private readonly connection: () => Promise<ControllerConnection>,
  ) {
    this.#unsubscribeApprovals = host.approvals.subscribe(
      (request, bindingId) => {
        const record = this.#records.get(bindingId);
        const active = record ? [...record.calls.values()].at(-1) : undefined;
        this.#emit(bindingId, {
          type: "permission.request",
          request,
          ...(record && active ? { source: nextSource(record, active) } : {}),
        });
      },
    );
  }
  async prepare(
    input: CreateAppToolSessionInput,
  ): Promise<AppToolSessionDescriptor> {
    if (this.#records.has(input.agentBindingId))
      throw new Error(
        `App tool bridge already exists: ${input.agentBindingId}`,
      );
    const descriptor = this.host.createSession(input);
    const record: BridgeRecord = {
      bindingId: input.agentBindingId,
      bridgeId: `lapis.tools.${input.agentBindingId}`,
      calls: new Map(),
    };
    this.#records.set(input.agentBindingId, record);
    if (!input.runtimeSupportsAppTools)
      return Object.freeze({
        ...descriptor,
        status: "runtime-unavailable",
        unavailableReason:
          "The selected runtime does not support application tools.",
      });
    if (!descriptor.tools.length)
      return Object.freeze({ ...descriptor, status: "disabled" });
    try {
      const { client } = await this.connection();
      record.unregister = await client.registerEndpoint({
        id: record.bridgeId,
        tools: descriptor.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema as Record<string, Json>,
          effect: tool.effect === "read" ? "read" : "write",
        })),
        handle: async (request, signal) => {
          if (
            request.operation !== "tool.execute" ||
            this.#records.get(record.bindingId) !== record
          )
            throw new Error("Application tool binding is unavailable.");
          const call = request.payload as {
            invocationId: string;
            name: string;
            arguments: Json;
          };
          const active = {
            abort: new AbortController(),
            runId: `app-tool-${call.invocationId}`,
            sequence: 0,
          };
          const abort = () => active.abort.abort();
          if (signal.aborted) abort();
          signal.addEventListener("abort", abort, { once: true });
          record.calls.set(call.invocationId, active);
          this.#emit(record.bindingId, {
            type: "tool.start",
            id: call.invocationId,
            name: call.name,
            server: "lapis-tools",
            input: call.arguments,
            source: nextSource(record, active),
          });
          try {
            const result = await this.host.invoke(
              record.bindingId,
              {
                runId: active.runId,
                toolCallId: call.invocationId,
                name: call.name,
                input: call.arguments,
              },
              active.abort.signal,
            );
            this.#emit(record.bindingId, {
              type: "tool.end",
              id: call.invocationId,
              name: call.name,
              server: "lapis-tools",
              output: result,
              source: nextSource(record, active),
            });
            return result as unknown as Json;
          } catch (error) {
            const normalized =
              error instanceof AppToolExecutionError
                ? { code: error.code, message: error.message }
                : {
                    code: "execution_failed",
                    message: "Application tool execution failed.",
                  };
            this.#emit(record.bindingId, {
              type: "tool.end",
              id: call.invocationId,
              name: call.name,
              server: "lapis-tools",
              error: normalized,
              source: nextSource(record, active),
            });
            return {
              content: [{ type: "text", text: normalized.message }],
              isError: true,
            };
          } finally {
            signal.removeEventListener("abort", abort);
            record.calls.delete(call.invocationId);
          }
        },
      });
      return Object.freeze({
        ...descriptor,
        bridgeId: record.bridgeId,
        status: "available",
      });
    } catch (error) {
      this.#records.delete(record.bindingId);
      this.host.closeBinding(record.bindingId);
      throw error;
    }
  }
  respondToApproval(requestId: string, decision: ApprovalOptionKind): boolean {
    return this.host.approvals.respond(requestId, decision);
  }
  subscribe(listener: (event: AppToolBridgeEvent) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  async closeBinding(bindingId: string): Promise<void> {
    const record = this.#records.get(bindingId);
    this.#records.delete(bindingId);
    for (const call of record?.calls.values() ?? []) call.abort.abort();
    this.host.closeBinding(bindingId);
    await record?.unregister?.().catch(() => undefined);
  }
  async close(): Promise<void> {
    for (const id of [...this.#records.keys()]) await this.closeBinding(id);
    this.#unsubscribeApprovals();
    this.#listeners.clear();
  }
  #emit(bindingId: string, event: AgentEvent): void {
    for (const listener of this.#listeners) listener({ bindingId, event });
  }
}
function nextSource(
  record: BridgeRecord,
  active: { runId: string; sequence: number },
) {
  return {
    sessionId: record.bridgeId,
    runId: active.runId,
    sequence: ++active.sequence,
  };
}
