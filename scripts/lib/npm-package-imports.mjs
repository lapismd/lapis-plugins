import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { init, parse } from "es-module-lexer";

await init;

export async function verifyBuiltImportBoundaries(
  packageRoot,
  packageName,
  packedFiles,
) {
  const normalizedPackageRoot = path.resolve(packageRoot);
  const distRoot = path.join(normalizedPackageRoot, "dist");
  const inventory = packedFiles && new Set(packedFiles);

  const files =
    packedFiles === undefined
      ? await listJavaScriptFiles(distRoot)
      : packedFiles
          .filter((file) => /\.(?:c|m)?js$/.test(file))
          .map((file) => path.resolve(normalizedPackageRoot, file));
  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const [imports] = parse(source, filePath);
    for (const { n: specifier } of imports) {
      if (!specifier?.startsWith(".")) continue;

      const resolvedImport = path.resolve(
        path.dirname(filePath),
        specifier.split(/[?#]/)[0],
      );
      const relativeImport = path.relative(
        normalizedPackageRoot,
        resolvedImport,
      );
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
      const candidates = [resolvedImport];
      // Bundlers also append extensions to virtual suffixes such as
      // state.svelte -> state.svelte.js and csv.parser -> csv.parser.js.
      for (const extension of [".js", ".mjs", ".cjs", ".json"]) {
        candidates.push(
          `${resolvedImport}${extension}`,
          path.join(resolvedImport, `index${extension}`),
        );
      }
      const found = inventory
        ? candidates.some((candidate) =>
            inventory.has(
              path
                .relative(normalizedPackageRoot, candidate)
                .split(path.sep)
                .join("/"),
            ),
          )
        : (
            await Promise.all(
              candidates.map(async (candidate) => {
                try {
                  return (await stat(candidate)).isFile();
                } catch (error) {
                  if (error.code === "ENOENT" || error.code === "ENOTDIR")
                    return false;
                  throw error;
                }
              }),
            )
          ).some(Boolean);
      if (!found)
        throw new Error(
          `${packageName} built import is missing from the npm package: ${path.relative(normalizedPackageRoot, filePath)} -> ${specifier}`,
        );
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
