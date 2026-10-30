// Archive-only host specifiers bind compiled components to the host's exact
// renderer ABI. Ordinary npm package imports continue to use Svelte exports.
export const rendererSourceModules = Object.freeze([
  "svelte",
  "svelte/animate",
  "svelte/attachments",
  "svelte/easing",
  "svelte/events",
  "svelte/legacy",
  "svelte/motion",
  "svelte/reactivity",
  "svelte/reactivity/window",
  "svelte/store",
  "svelte/transition",
  "svelte/internal/client",
  "svelte/internal/disclose-version",
  "svelte/internal/flags/async",
  "svelte/internal/flags/legacy",
  "svelte/internal/flags/tracing",
]);
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;
const suffixes = rendererSourceModules
  .slice(1)
  .map((specifier) => specifier.slice("svelte/".length));
export const rendererHostModulePattern = new RegExp(
  `^svelte/renderer/(\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?)(?:/(${suffixes.join("|")}))?$`,
  "u",
);

export function versionedRendererHostSpecifier(specifier, version) {
  if (!exactVersion.test(version))
    throw new Error("Renderer host ABI requires an exact compiler version.");
  if (!rendererSourceModules.includes(specifier)) return undefined;
  return `svelte/renderer/${version}${specifier.slice("svelte".length)}`;
}

export function rendererHostExternalizationPlugin(version) {
  if (!exactVersion.test(version))
    throw new Error("Renderer host ABI requires an exact compiler version.");
  return {
    name: "lapis-versioned-renderer-host",
    enforce: "pre",
    resolveId(specifier) {
      const id = versionedRendererHostSpecifier(specifier, version);
      return id ? { id, external: true } : undefined;
    },
  };
}

export function assertRendererHostVersion(specifiers, version) {
  for (const specifier of specifiers) {
    const match = specifier.match(rendererHostModulePattern);
    if (match && match[1] !== version)
      throw new Error(
        `Renderer host ABI ${match[1]} does not match locked compiler ${version}.`,
      );
  }
}
