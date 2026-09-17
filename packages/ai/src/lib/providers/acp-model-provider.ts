import { hasNativeDesktopCapability } from "@lapis-notes/api/desktop-native";
import type { ControllerConnection } from "../host/controller-connection";
import type { ModelRef } from "../core/types";
import type { ModelProvider, ProviderAuthStatus } from "./model-provider";

type AcpModelEntry = {
  id: string;
  label: string;
  badges?: string[];
};

type AcpModelCatalog = {
  agent: string;
  currentModel?: string;
  models?: string[];
  entries?: AcpModelEntry[];
};

export class AcpModelProvider implements ModelProvider {
  readonly id: string;
  constructor(
    id: string,
    readonly options: { connection(): Promise<ControllerConnection> }
  ) {
    this.id = id;
  }

  async listModels(): Promise<ModelRef[]> {
    if (!hasNativeDesktopCapability("agent-runtime")) return [];
    const connection = await this.options.connection();
    const catalog = await connection.client.request<AcpModelCatalog>(
      "providers.models",
      { provider: this.id, workspace: connection.workspace }
    );
    const current = catalog.currentModel?.trim();
    const entries = new Map(
      (catalog.entries ?? []).map((entry) => [entry.id, entry])
    );
    return [...new Set(catalog.models ?? [])]
      .map((model) => model.trim())
      .filter(Boolean)
      .map((model) => {
        const entry = entries.get(model);
        return {
          provider: this.id,
          model,
          ...(entry?.label ? { displayName: entry.label } : {}),
          ...(entry?.badges?.length ? { badges: entry.badges } : {}),
          isDefault: model === current,
        };
      });
  }

  async authStatus(): Promise<ProviderAuthStatus> {
    if (!hasNativeDesktopCapability("agent-runtime")) {
      return {
        authenticated: false,
        label: this.id,
        detail:
          "Live model listing requires the desktop agent-runtime capability.",
      };
    }
    try {
      const models = await this.listModels();
      return models.length > 0
        ? { authenticated: true, label: this.id }
        : {
            authenticated: false,
            label: this.id,
            detail: `${this.id} did not return a model catalog.`,
          };
    } catch (error) {
      return {
        authenticated: false,
        label: this.id,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
