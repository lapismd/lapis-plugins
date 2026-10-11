export {
  rendererSourceModules,
  versionedRendererHostSpecifier,
  rendererHostExternalizationPlugin,
  assertRendererHostVersion,
} from "./svelte-runtime-contract.mjs";

import { approvedWorkspaceHostModules } from "../package-catalog.mjs";

// Plugin runtimes are mounted beneath a host-owned, fingerprinted URL. Keep
// Vite-emitted workers and assets relative to the importing chunk instead of
// resolving them from the application origin.
export const pluginRuntimeViteBase = "./";

// Vite library mode preserves this development branch unless the browser
// archive producer fixes it explicitly. Never provide a browser process shim.
export const pluginRuntimeBrowserDefines = Object.freeze({
  "process.env.NODE_ENV": JSON.stringify("production"),
});

export function pluginRuntimeEntryBuildOptions(entry) {
  return {
    lib: {
      entry,
      formats: ["es"],
      fileName: () => "main.mjs",
      cssFileName: "styles",
    },
  };
}

const exactVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

export function assertRendererCompilerVersion({ expected, actual }) {
  if (typeof expected !== "string" || !exactVersionPattern.test(expected)) {
    throw new Error(
      "The frozen lockfile must resolve an exact Svelte renderer version.",
    );
  }
  if (actual !== expected) {
    throw new Error(
      `Installed Svelte ${
        actual ?? "is missing"
      }; expected locked renderer ${expected}. Run pnpm install --frozen-lockfile.`,
    );
  }
}

export function rendererCompilerVersionFromLockfile(lockfileSource) {
  if (typeof lockfileSource === "string") {
    const rootImporter = lockfileSource.match(
      /(?:^|\n)  \.:\n(?<body>[\s\S]*?)(?=\n  [^ ]|$)/u,
    )?.groups?.body;
    const devDependencies = rootImporter?.match(
      /(?:^|\n)    devDependencies:\n(?<body>[\s\S]*?)(?=\n    [^ ]|$)/u,
    )?.groups?.body;
    const version = devDependencies?.match(
      /(?:^|\n)      svelte:\n(?:        [^\n]*\n)*?        version: ['"]?(?<version>[^'"\s]+)['"]?/u,
    )?.groups?.version;
    if (version && exactVersionPattern.test(version)) return version;
  }
  throw new Error(
    "The frozen lockfile must resolve an exact Svelte renderer version.",
  );
}

export function isPluginSelfReference(packageName, specifier) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}

export function assertWorkspaceHostDependencies(
  packageJson,
  sharedDependencies,
) {
  for (const specifier of sharedDependencies) {
    if (
      !approvedWorkspaceHostModules.some((pattern) => pattern.test(specifier))
    )
      throw new Error(
        `Runtime module ${specifier} is not an approved host contract.`,
      );
    const packageName = specifier.startsWith("@")
      ? specifier.split("/").slice(0, 2).join("/")
      : specifier.split("/")[0];
    if (!packageJson.peerDependencies?.[packageName])
      throw new Error(
        `Runtime host module ${specifier} requires peerDependencies.${packageName}.`,
      );
  }
}
