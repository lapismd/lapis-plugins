import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const importSpecifierPattern =
  /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g;

export async function verifyBuiltImportBoundaries(packageRoot, packageName) {
  const normalizedPackageRoot = path.resolve(packageRoot);
  const distRoot = path.join(normalizedPackageRoot, "dist");

  for (const filePath of await listJavaScriptFiles(distRoot)) {
    const source = await readFile(filePath, "utf8");
    for (const match of source.matchAll(importSpecifierPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) continue;

      const resolvedImport = path.resolve(path.dirname(filePath), specifier);
      const relativeImport = path.relative(normalizedPackageRoot, resolvedImport);
      if (
        relativeImport === ".." ||
        relativeImport.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeImport)
      ) {
        const relativeFile = path.relative(normalizedPackageRoot, filePath);
        throw new Error(
          `${packageName} built import escapes the installed package: ` +
            `${relativeFile} -> ${specifier}`,
        );
      }
    }
  }
}

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJavaScriptFiles(entryPath)));
    } else if (/\.(?:c|m)?js$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files.sort();
}
