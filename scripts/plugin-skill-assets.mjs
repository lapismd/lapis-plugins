import {
  lstat,
  realpath,
  readdir,
  readFile,
  mkdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
export async function readPackagedSkills(packageRoot, manifest) {
  const bundles = [];
  for (const skill of manifest.lapis?.contributes?.agentSkills ?? []) {
    if (
      !/^[a-z][a-z0-9_-]{0,63}$/.test(skill.name) ||
      typeof skill.directory !== "string" ||
      skill.directory.includes("\\") ||
      skill.directory.split("/").some((p) => ["", ".", ".."].includes(p))
    )
      throw Error("Invalid skill contribution");
    const directoryRoot = path.resolve(packageRoot, skill.directory);
    if ((await realpath(directoryRoot)) !== directoryRoot)
      throw Error("Skill symlink path is unavailable");
    const files = {};
    async function walk(directory, prefix = "") {
      if ((await lstat(directory)).isSymbolicLink())
        throw Error("Skill symlinks are unavailable");
      for (const entry of (
        await readdir(directory, { withFileTypes: true })
      ).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
        const relative = prefix + entry.name;
        if (entry.isSymbolicLink())
          throw Error("Skill symlinks are unavailable");
        if (entry.isDirectory())
          await walk(path.join(directory, entry.name), relative + "/");
        else if (entry.isFile())
          files[relative] = await readFile(
            path.join(directory, entry.name),
            "utf8",
          );
        else throw Error("Unsupported skill asset");
      }
    }
    await walk(path.join(packageRoot, skill.directory));
    if (!files["SKILL.md"]) throw Error(`Skill ${skill.name} has no SKILL.md`);
    bundles.push({
      name: skill.name,
      source: manifest.id,
      version: manifest.version,
      files,
    });
  }
  return bundles;
}
export async function stagePackagedSkills(packageRoot, runtimeRoot, manifest) {
  const bundles = await readPackagedSkills(packageRoot, manifest);
  for (const skill of manifest.lapis?.contributes?.agentSkills ?? []) {
    for (const [file, body] of Object.entries(
      bundles.find((b) => b.name === skill.name).files,
    )) {
      const target = path.join(runtimeRoot, skill.directory, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
    }
  }
}
