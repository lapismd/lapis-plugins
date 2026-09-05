export const implicitRendererEsmHostModules = Object.freeze([
  "svelte",
  "svelte/internal/client",
  "svelte/internal/disclose-version",
]);

const exactVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

export function assertRendererCompilerVersion({ expected, actual }) {
  if (typeof expected !== "string" || !exactVersionPattern.test(expected)) {
    throw new Error(
      "The frozen lockfile must resolve an exact Svelte renderer version."
    );
  }
  if (actual !== expected) {
    throw new Error(
      `Installed Svelte ${
        actual ?? "is missing"
      }; expected locked renderer ${expected}. Run pnpm install --frozen-lockfile.`
    );
  }
}

export function rendererCompilerVersionFromLockfile(lockfileSource) {
  if (typeof lockfileSource === "string") {
    const rootImporter = lockfileSource.match(
      /(?:^|\n)  \.:\n(?<body>[\s\S]*?)(?=\n  [^ ]|$)/u
    )?.groups?.body;
    const devDependencies = rootImporter?.match(
      /(?:^|\n)    devDependencies:\n(?<body>[\s\S]*?)(?=\n    [^ ]|$)/u
    )?.groups?.body;
    const version = devDependencies?.match(
      /(?:^|\n)      svelte:\n(?:        [^\n]*\n)*?        version: ['"]?(?<version>[^'"\s]+)['"]?/u
    )?.groups?.version;
    if (version && exactVersionPattern.test(version)) return version;
  }
  throw new Error(
    "The frozen lockfile must resolve an exact Svelte renderer version."
  );
}

export function isImplicitRendererEsmHostModule(specifier) {
  return implicitRendererEsmHostModules.includes(specifier);
}

export function isPluginSelfReference(packageName, specifier) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}
