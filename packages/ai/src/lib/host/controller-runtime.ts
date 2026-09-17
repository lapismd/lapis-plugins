import {
  ControllerRuntime,
  type AgentCapabilities,
  type AgentRequest,
  type AgentRuntime,
  type AgentSession,
} from "@lapismd/ai-controller/runtime";
import type { Json } from "@lapismd/ai-controller/contracts";
import { projectSkillActivationPrompt } from "../skills/activation";
import type {
  ControllerConnection,
  ControllerConnectionPool,
} from "./controller-connection";

/** Lapis supplies domain instructions and endpoint identities; the SDK owns execution. */
export class ControllerAgentRuntime implements AgentRuntime {
  readonly #runtimes = new WeakMap<ControllerConnection, ControllerRuntime>();
  #last?: ControllerRuntime;
  constructor(
    readonly id: "acp" | "codex-native",
    readonly connections: ControllerConnectionPool,
  ) {}
  capabilities(): AgentCapabilities {
    return (
      this.#last?.capabilities() ?? {
        sessions: true,
        resume: true,
        cancel: true,
        steer: false,
        modelSelection: false,
        nativeTools: true,
        mcpTools: false,
        preparesContext: true,
        approvals: {
          supported: false,
          interactive: false,
          persistentDecisions: false,
          granularPermissions: false,
          policyAmendments: false,
        },
      }
    );
  }
  async supports(request: AgentRequest): Promise<boolean> {
    try {
      return await (await this.#runtime(request)).supports(request);
    } catch {
      return false;
    }
  }
  async start(request: AgentRequest): Promise<AgentSession> {
    return (await this.#runtime(request)).start(request);
  }
  async resume(
    id: string,
    request: Omit<AgentRequest, "prompt"> = {},
  ): Promise<AgentSession> {
    return (await this.#runtime(request)).resume(id, request);
  }
  async #runtime(
    request: Omit<AgentRequest, "prompt">,
  ): Promise<ControllerRuntime> {
    const connection = await this.connections.get(request.workspace);
    let runtime = this.#runtimes.get(connection);
    if (!runtime) {
      runtime = new ControllerRuntime({
        id: this.id,
        client: connection.client,
        provider: (request) =>
          this.id === "codex-native"
            ? "codex-native"
            : request.agent ?? "codex",
        workspace: () => connection.workspace,
        prepare: async (request, threadId) => {
          const contextId = `lapis.instructions.${threadId}`;
          const bootstrap =
            typeof request.metadata?.sessionBootstrap === "string"
              ? request.metadata.sessionBootstrap
              : "";
          let activation = projectSkillActivationPrompt(
            "",
            request.skillActivations,
          ).trim();
          return {
            thread: {
              contextSources: [contextId],
              ...(request.appToolSession?.bridgeId
                ? { toolEndpoint: request.appToolSession.bridgeId }
                : {}),
              ...(request.appToolSession?.conversationId
                ? { externalRef: request.appToolSession.conversationId }
                : {}),
            },
            endpoints: [
              {
                id: contextId,
                context: true,
                required: true,
                handle: async (call) => {
                  if (call.operation === "context.authorize") return true;
                  if (call.operation !== "context.resolve")
                    throw new Error("Unsupported instruction request.");
                  const instructions = [bootstrap, activation]
                    .filter(Boolean)
                    .join("\n\n");
                  activation = "";
                  return (
                    instructions
                      ? [
                          {
                            id: contextId,
                            revision: "1",
                            kind: "instructions",
                            trust: "instructions",
                            required: true,
                            content: instructions,
                          },
                        ]
                      : []
                  ) as Json;
                },
              },
            ],
          };
        },
      });
      this.#runtimes.set(connection, runtime);
    }
    this.#last = runtime;
    return runtime;
  }
}
