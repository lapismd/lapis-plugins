#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import {
  init as initEsModuleLexer,
  parse as parseModule,
} from "es-module-lexer";
import { build as viteBuild } from "vite";

import {
  buildPluginPayload,
  packageOfficialPlugin,
} from "./plugin-release.mjs";
import {
  approvedWorkspaceHostModules,
  pluginPackageBySelector,
  pluginPackages,
} from "./package-catalog.mjs";
import {
  assertRendererCompilerVersion,
  isImplicitRendererEsmHostModule,
  isPluginSelfReference,
  pluginRuntimeViteBase,
  rendererCompilerVersionFromLockfile,
} from "./lib/runtime-host-modules.mjs";
import { resolveWorkerLimit, runBoundedWorkers } from "./lib/concurrency.mjs";
import { preparePluginReleaseRoot } from "./lib/release-output.mjs";
import { resolveSourceCommit } from "./lib/source-commit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedRendererVersion = rendererCompilerVersionFromLockfile(
  await readFile(path.join(root, "pnpm-lock.yaml"), "utf8")
);
const installedRenderer = JSON.parse(
  await readFile(
    path.join(root, "node_modules", "svelte", "package.json"),
    "utf8"
  )
);
assertRendererCompilerVersion({
  expected: expectedRendererVersion,
  actual: installedRenderer.version,
});
const options = parseOptions(process.argv.slice(2));
const selected = options.plugin
  ? [requiredPlugin(options.plugin)]
  : pluginPackages;
const releaseRoot = path.resolve(root, options.outDir ?? ".release/plugins");
const runtimeRoot = path.resolve(root, ".release/runtime");
const sourceCommit =
  options.commit ?? (await resolveSourceCommit({ cwd: root }));

await preparePluginReleaseRoot({
  releaseRoot,
  clean: !options.plugin,
});
await mkdir(runtimeRoot, { recursive: true });
const workerLimit = resolveWorkerLimit("LAPIS_PLUGIN_BUILD_WORKERS", 2);
const results = await runBoundedWorkers(selected, workerLimit, buildPlugin);
for (const result of [...results].sort((left, right) =>
  left.packageName.localeCompare(right.packageName)
)) {
  console.log(result.log);
}

async function buildPlugin(plugin) {
  const packageRoot = path.join(root, "packages", plugin.directory);
  const packageJson = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8")
  );
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, "manifest.json"), "utf8")
  );
  if (
    packageJson.version !== manifest.version ||
    manifest.id !== plugin.pluginId
  ) {
    throw new Error(
      `${plugin.packageName} package and runtime metadata differ.`
    );
  }

  const runtimeDir = path.join(
    runtimeRoot,
    `${plugin.pluginId}-${packageJson.version}`
  );
  await rm(runtimeDir, { recursive: true, force: true });
  await buildRuntime(plugin, packageRoot, runtimeDir);
  await copyFile(
    path.join(packageRoot, "manifest.json"),
    path.join(runtimeDir, "manifest.json")
  );
  const stylesPath = path.join(runtimeDir, "styles.css");
  if (!existsSync(stylesPath)) await writeFile(stylesPath, "");

  const packaged = await packageOfficialPlugin({
    pluginId: plugin.pluginId,
    version: packageJson.version,
    inputDir: runtimeDir,
    outDir: releaseRoot,
    packageName: plugin.packageName,
    commit: sourceCommit,
  });
  const built = await buildPluginPayload({
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseDir: packaged.releaseDir,
  });

  const reproductionPath = `${built.bundlePath}.reproduction`;
  await buildPluginPayload({
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseDir: packaged.releaseDir,
    out: reproductionPath,
  });
  const [first, second] = await Promise.all([
    readFile(built.bundlePath),
    readFile(reproductionPath),
  ]);
  await rm(reproductionPath, { force: true });
  if (!first.equals(second)) {
    throw new Error(
      `${plugin.pluginId} bundle reproduction was not deterministic.`
    );
  }
  const checksum = createHash("sha256").update(first).digest("hex");
  await writeFile(
    `${built.bundlePath}.sha256`,
    `${checksum}  ${path.basename(built.bundlePath)}\n`
  );
  return {
    packageName: plugin.packageName,
    log: `${plugin.packageName}@${packageJson.version}: ${path.relative(
      root,
      built.bundlePath
    )} ${checksum}`,
  };
}

async function buildRuntime(plugin, packageRoot, outDir) {
  const sourceEntry = existsSync(path.join(packageRoot, "src/lib/index.ts"))
    ? path.join(packageRoot, "src/lib/index.ts")
    : path.join(packageRoot, "src/index.ts");
  await viteBuild({
    root: packageRoot,
    base: pluginRuntimeViteBase,
    configFile: false,
    publicDir: false,
    plugins: [
      svelte({
        preprocess: vitePreprocess(),
        compilerOptions: { runes: undefined },
      }),
    ],
    resolve: {
      alias: [
        {
          find: /^\$lib(?:\/(.*))?$/,
          replacement: `${path.join(packageRoot, "src/lib")}/$1`,
        },
      ],
      dedupe: ["svelte"],
    },
    worker: { format: "es" },
    build: {
      outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      minify: false,
      target: "es2022",
      lib: {
        entry: sourceEntry,
        formats: ["es"],
        fileName: () => "main.mjs",
        cssFileName: "styles",
      },
      rollupOptions: {
        external: (specifier) =>
          !isPluginSelfReference(plugin.packageName, specifier) &&
          (isApprovedHostModule(specifier) ||
            isImplicitRendererEsmHostModule(specifier)),
        output: {
          entryFileNames: "main.mjs",
          chunkFileNames: "assets/[name]-[hash].mjs",
          assetFileNames: (asset) =>
            asset.name?.endsWith(".css")
              ? "styles.css"
              : "assets/[name]-[hash][extname]",
        },
      },
    },
    logLevel: "warn",
  });

  const mainPath = path.join(outDir, "main.mjs");
  if (!existsSync(mainPath)) {
    const candidate = (await readdir(outDir)).find((file) =>
      file.endsWith(".mjs")
    );
    if (!candidate)
      throw new Error(`${plugin.packageName} did not emit an ESM entry.`);
    await rename(path.join(outDir, candidate), mainPath);
  }
  const bareImports = await scanBareImports(await readFile(mainPath, "utf8"));
  const declared = new Set(
    JSON.parse(
      await readFile(path.join(packageRoot, "manifest.json"), "utf8")
    ).lapis.runtime.entries.workspace.sharedDependencies
  );
  for (const specifier of bareImports) {
    if (isImplicitRendererEsmHostModule(specifier)) {
      continue;
    }
    if (!isApprovedHostModule(specifier)) {
      throw new Error(
        `${plugin.packageName} left non-host dependency ${specifier} external.`
      );
    }
    if (!declared.has(specifier)) {
      throw new Error(
        `${plugin.packageName} did not declare host module ${specifier}.`
      );
    }
  }
}

function isApprovedHostModule(specifier) {
  return approvedWorkspaceHostModules.some((pattern) =>
    pattern.test(specifier)
  );
}

async function scanBareImports(source) {
  await initEsModuleLexer;
  const imports = new Set();
  const [entries] = parseModule(source);
  for (const entry of entries) {
    const specifier = entry.n;
    if (typeof specifier !== "string") continue;
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
      imports.add(specifier);
    }
  }
  return [...imports].sort();
}

function requiredPlugin(selector) {
  const plugin = pluginPackageBySelector(selector);
  if (!plugin) throw new Error(`Unknown plugin selector: ${selector}`);
  return plugin;
}

function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg
      .slice(2)
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    options[key] = args[index + 1];
    index += 1;
  }
  return options;
}
