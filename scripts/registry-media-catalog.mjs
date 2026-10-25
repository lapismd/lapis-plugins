import { parkedPluginPackages, pluginPackages } from "./package-catalog.mjs";

// Private UI qualification is independent of activation, packaging and release.
// Add parked previews explicitly; other parked packages remain excluded.
export const registryMediaPlugins = [
  // CSV ships its table story before registry screenshots. LN-CSV-003 keeps
  // it out of media selection until that capture exists.
  ...pluginPackages.filter((plugin) => plugin.directory !== "csv"),
  ...parkedPluginPackages.filter((plugin) => plugin.directory === "sync"),
];

export function registryMediaPluginBySelector(selector) {
  return registryMediaPlugins.find((plugin) =>
    [plugin.directory, plugin.packageName, plugin.pluginId].includes(selector),
  );
}
