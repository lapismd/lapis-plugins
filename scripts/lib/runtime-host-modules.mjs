export const implicitRendererEsmHostModules = Object.freeze([
  "svelte",
  "svelte/internal/client",
  "svelte/internal/disclose-version",
]);

export function isImplicitRendererEsmHostModule(specifier) {
  return implicitRendererEsmHostModules.includes(specifier);
}

export function isPluginSelfReference(packageName, specifier) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}
