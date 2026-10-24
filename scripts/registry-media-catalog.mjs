import { parkedPluginPackages, pluginPackages } from "./package-catalog.mjs";

// Private UI qualification is independent of activation, packaging and release.
// Add parked previews explicitly; other parked packages remain excluded.
export const registryMediaPlugins = [
  // The transcript preview has no capture story yet, so it stays out of media checks.
  ...pluginPackages.filter((plugin) => plugin.directory !== "transcripts"),
  ...parkedPluginPackages.filter((plugin) => plugin.directory === "sync"),
];

export function registryMediaPluginBySelector(selector) {
  return registryMediaPlugins.find((plugin) =>
    [plugin.directory, plugin.packageName, plugin.pluginId].includes(selector),
  );
}
