import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  init as initEsModuleLexer,
  parse as parseModule,
} from "es-module-lexer";

export async function scanBareImports(source) {
  await initEsModuleLexer;
  const imports = new Set();
  const [entries] = parseModule(source);
  for (const entry of entries) {
    const specifier = entry.n;
    if (typeof specifier !== "string") continue;
    if (isBrowserBareSpecifier(specifier)) {
      imports.add(specifier);
    }
  }
  return [...imports].sort();
}

export async function scanRuntimeBareImports(outDir) {
  const importsByFile = new Map();
  for await (const file of walk(outDir)) {
    if (!/\.(?:js|mjs)$/u.test(file)) continue;
    const imports = await scanBareImports(await readFile(file, "utf8"));
    if (imports.length) {
      importsByFile.set(path.relative(outDir, file), imports);
    }
  }
  return importsByFile;
}

function isBrowserBareSpecifier(specifier) {
  return (
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !/^[a-zA-Z][a-zA-Z\d+.-]*:/u.test(specifier)
  );
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(file);
      continue;
    }
    if (entry.isFile()) {
      yield file;
    }
  }
}
