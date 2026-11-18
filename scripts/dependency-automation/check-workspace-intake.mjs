import { existsSync, readFileSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { intakeFacts, verifyIntake } from "./workspace-intake.mjs";

export function checkWorkspaceIntake(root = process.cwd()) {
  const read = (path) => {
    const target = resolve(root, path);
    if (realpathSync(target) !== target)
      throw Error("Non-regular intake source");
    return readFileSync(target, "utf8");
  };
  const policyPath = ".github/dependency-automation/canonical-intake.json",
    policyBytes = read(policyPath),
    policy = JSON.parse(policyBytes);
  const inputs = ["pnpm-workspace.yaml", "pnpm-lock.yaml", ...policy.manifests],
    documents = Object.fromEntries(policy.chapters.map((p) => [p, read(p)]));
  const run = (command, args) =>
    execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 3 * 1024 * 1024,
    });
  const jj = existsSync(resolve(root, ".jj"));
  const parent = (
    jj
      ? run("jj", [
          "--ignore-working-copy",
          "log",
          "-r",
          "@",
          "--no-graph",
          "-T",
          'parents.map(|p| p.commit_id()).join("\\n")',
        ])
      : run("git", ["rev-parse", "HEAD^1"])
  )
    .trim()
    .split("\n")[0];
  if (!/^[a-f0-9]{40}$/.test(parent))
    throw Error("Intake source ancestry unavailable");
  const previous = (p) =>
    jj
      ? run("jj", [
          "--ignore-working-copy",
          "file",
          "show",
          "-r",
          parent,
          "--",
          p,
        ])
      : run("git", ["show", `${parent}:${p}`]);
  const before = Object.fromEntries(inputs.map((p) => [p, previous(p)])),
    files = Object.fromEntries(inputs.map((p) => [p, read(p)]));
  const changedFiles = (
    jj
      ? run("jj", [
          "--no-pager",
          "diff",
          "--from",
          parent,
          "--to",
          "@",
          "--name-only",
        ])
      : run("git", ["diff", "--name-only", parent, "HEAD"])
  )
    .trim()
    .split("\n")
    .filter(Boolean);
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
