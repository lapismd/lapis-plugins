import { expect, it } from "vitest";
import { ModelProviderRegistry, StaticModelProvider } from "./model-provider";

it("uses separate native and ACP catalogs while retaining canonical agent identity", async () => {
  const registry = new ModelProviderRegistry([
    new StaticModelProvider("codex", [
      { provider: "codex", model: "acp-model" },
    ]),
    new StaticModelProvider("codex-native", [
      { provider: "codex-native", model: "native-model" },
    ]),
  ]);
  expect(await registry.listModels("codex", "codex-native")).toEqual([
    { provider: "codex", model: "native-model" },
  ]);
  expect(await registry.listModels("codex", "acp")).toEqual([
    { provider: "codex", model: "acp-model" },
  ]);
});

it("does not discover live models for the fake runtime", async () => {
  const registry = new ModelProviderRegistry([
    new StaticModelProvider("codex", [
      { provider: "codex", model: "live-model" },
    ]),
  ]);
  expect(await registry.listModels("codex", "fake")).toEqual([]);
});
