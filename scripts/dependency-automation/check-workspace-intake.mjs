import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { sourceIntakeReader } from "./source-intake-reader.mjs";
import { intakeFacts, verifyIntake } from "./workspace-intake.mjs";

export function checkWorkspaceIntake(
  root = process.cwd(),
  sourceReader = sourceIntakeReader,
) {
  const read = (path) => {
    const target = resolve(root, path);
    if (realpathSync(target) !== target || !lstatSync(target).isFile())
      throw Error("Non-regular intake source");
    return readFileSync(target, "utf8");
  };
  const policyPath = ".github/dependency-automation/canonical-intake.json",
    policyBytes = read(policyPath),
    policy = JSON.parse(policyBytes);
  const inputs = ["pnpm-workspace.yaml", "pnpm-lock.yaml", ...policy.manifests],
    documents = Object.fromEntries(policy.chapters.map((p) => [p, read(p)]));
  const previous = sourceReader(root);
  const before = Object.fromEntries(inputs.map((p) => [p, previous(p)])),
    files = Object.fromEntries(inputs.map((p) => [p, read(p)]));
  const changedFiles = previous.changedFiles();
  let basePolicyBytes, baseDocuments;
  if (
    !isDeepStrictEqual(intakeFacts(policy, before), intakeFacts(policy, files))
  ) {
    basePolicyBytes = previous(policyPath);
    baseDocuments = Object.fromEntries(
      policy.chapters.map((p) => [p, previous(p)]),
    );
  }
  for (const path of changedFiles)
    if (path.startsWith(".changeset/") && existsSync(resolve(root, path)))
      files[path] = read(path);
  return verifyIntake({
    policyBytes,
    files,
    documents,
    before,
    basePolicyBytes,
    baseDocuments,
    changedFiles,
    sourceSha: previous.sourceSha,
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  checkWorkspaceIntake();
  console.log(
    "Plugins workspace dependency intake matches source-owned registry facts.",
  );
}
