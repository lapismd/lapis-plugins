#!/usr/bin/env node
import { createHash, createPrivateKey, createPublicKey } from "node:crypto";
import { existsSync } from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import {
  init as initEsModuleLexer,
  parse as parseModule,
} from "es-module-lexer";
import { build as viteBuild } from "vite";

import {
  buildSignedPluginBundle,
  generateTestEd25519KeyPair,
  packageOfficialPlugin,
  signReleaseManifest,
} from "./plugin-release.mjs";
import {
  approvedWorkspaceHostModules,
  pluginPackageBySelector,
  pluginPackages,
} from "./package-catalog.mjs";
import { isPluginSelfReference } from "./lib/runtime-host-modules.mjs";
import { resolveWorkerLimit, runBoundedWorkers } from "./lib/concurrency.mjs";
import { preparePluginReleaseRoot } from "./lib/release-output.mjs";
import { resolveSourceCommit } from "./lib/source-commit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = parseOptions(process.argv.slice(2));
const selected = options.plugin
  ? [requiredPlugin(options.plugin)]
  : pluginPackages;
const releaseRoot = path.resolve(root, options.outDir ?? ".release/plugins");
const runtimeRoot = path.resolve(root, ".release/runtime");
const signing = await resolveSigningMaterial();
const sourceCommit =
  options.commit ?? (await resolveSourceCommit({ cwd: root }));

await preparePluginReleaseRoot({
  releaseRoot,
  clean: !options.plugin,
});
await mkdir(runtimeRoot, { recursive: true });
await writeFile(
  path.join(root, ".release/plugin-release-public.pem"),
  signing.publicKey
);

try {
  const workerLimit = resolveWorkerLimit("LAPIS_PLUGIN_BUILD_WORKERS", 2);
  const results = await runBoundedWorkers(selected, workerLimit, buildPlugin);
  for (const result of [...results].sort((left, right) =>
    left.packageName.localeCompare(right.packageName)
  )) {
    console.log(result.log);
  }
} finally {
  if (signing.temporaryDirectory) {
    await rm(signing.temporaryDirectory, { recursive: true, force: true });
  }
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
  const signedReleasePath = path.join(
    packaged.releaseDir,
    "release.signed.json"
  );
  await signReleaseManifest({
    input: packaged.releasePath,
    out: signedReleasePath,
    keyId: signing.keyId,
    privateKeyFile: signing.privateKeyFile,
  });
  const built = await buildSignedPluginBundle({
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseDir: packaged.releaseDir,
    signedReleasePath,
  });

  const reproductionPath = `${built.bundlePath}.reproduction`;
  await buildSignedPluginBundle({
    pluginId: plugin.pluginId,
    version: packageJson.version,
    releaseDir: packaged.releaseDir,
    signedReleasePath,
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
          isApprovedHostModule(specifier),
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

async function resolveSigningMaterial() {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "lapis-plugin-signing-")
  );
  const privateKeyFile = path.join(temporaryDirectory, "private.pem");
  const secret = process.env.LAPIS_PLUGIN_RELEASE_PRIVATE_KEY;
  const keyId = process.env.LAPIS_PLUGIN_RELEASE_KEY_ID;
  let privateKey;
  let publicKey;
  if (secret || keyId) {
    if (!secret || !keyId) {
      throw new Error(
        "Both LAPIS_PLUGIN_RELEASE_PRIVATE_KEY and LAPIS_PLUGIN_RELEASE_KEY_ID are required."
      );
    }
    privateKey = secret.replace(/\\n/g, "\n");
    publicKey = createPublicKey(createPrivateKey(privateKey)).export({
      type: "spki",
      format: "pem",
    });
  } else {
    const testKeys = generateTestEd25519KeyPair();
    privateKey = testKeys.privateKey;
    publicKey = testKeys.publicKey;
  }
  await writeFile(privateKeyFile, privateKey, { mode: 0o600 });
  await chmod(privateKeyFile, 0o600);
  return {
    keyId: keyId ?? "lapis-plugin-release-test-only",
    privateKeyFile,
    publicKey,
    temporaryDirectory,
  };
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
