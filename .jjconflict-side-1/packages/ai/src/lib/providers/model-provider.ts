import type { ModelRef } from "../core/types";

export type ProviderAuthStatus = {
  authenticated: boolean;
  label?: string;
  detail?: string;
};

export interface ModelProvider {
  readonly id: string;
  listModels(): Promise<ModelRef[]>;
  authStatus(): Promise<ProviderAuthStatus>;
}

export interface AgentModelCatalog {
  listModels(provider: string, runtime?: string): Promise<ModelRef[]>;
}

export function modelCatalogProviderId(
  provider: string,
  runtime?: string,
): string {
  if (provider === "codex" && runtime === "codex-native") return "codex-native";
  if (provider === "opencode" && runtime === "opencode-native")
    return "opencode-native";
  return provider;
}

export class ModelProviderRegistry implements AgentModelCatalog {
  readonly #providers = new Map<string, ModelProvider>();

  constructor(providers: ModelProvider[] = []) {
    for (const provider of providers)
      this.#providers.set(provider.id, provider);
  }

  async listModels(provider: string, runtime?: string): Promise<ModelRef[]> {
    if (runtime === "fake") return [];
    const id = modelCatalogProviderId(provider, runtime);
    const models = (await this.#providers.get(id)?.listModels()) ?? [];
    return id === provider
      ? models
      : models.map((model) => ({ ...model, provider }));
  }
}

export class StaticModelProvider implements ModelProvider {
  readonly id: string;
  readonly #models: ModelRef[];
  readonly #auth: ProviderAuthStatus;

  constructor(
    id: string,
    models: ModelRef[],
    auth: ProviderAuthStatus = { authenticated: true, label: "Local" },
  ) {
    this.id = id;
    this.#models = models;
    this.#auth = auth;
  }

  async listModels(): Promise<ModelRef[]> {
    return [...this.#models];
  }

  async authStatus(): Promise<ProviderAuthStatus> {
    return { ...this.#auth };
  }
}
