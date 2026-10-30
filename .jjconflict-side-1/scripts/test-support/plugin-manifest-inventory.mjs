import { readdir, readFile } from "node:fs/promises";

// Independent test oracle: declared package/runtime identities, not package-catalog.
export async function activePluginManifests(packages) {
  const plugins = [];
  for (const entry of await readdir(packages, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = new URL(`${entry.name}/`, packages);
    let manifest;
    try {
      manifest = JSON.parse(
        await readFile(new URL("manifest.json", directory))
      );
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    const pkg = JSON.parse(await readFile(new URL("package.json", directory)));
    if (pkg.private === true) continue;
    plugins.push({
      directory: entry.name,
      packageName: pkg.name,
      pluginId: manifest.id,
    });
  }
  return plugins.sort((left, right) =>
    left.packageName.localeCompare(right.packageName)
  );
}
