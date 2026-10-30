import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function resolveSourceCommit({
  cwd,
  env = process.env,
  exec = execFileAsync,
} = {}) {
  if (env.GITHUB_SHA) return env.GITHUB_SHA;

  const jjRoot = await optionalCommand(exec, "jj", ["root"], cwd);
  if (jjRoot) {
    const workingCopyIsEmpty = await requiredCommand(
      exec,
      "jj",
      ["--no-pager", "log", "-r", "@", "--no-graph", "-T", "empty"],
      cwd
    );
    if (workingCopyIsEmpty !== "true") {
      throw new Error(
        "Plugin release preparation requires an empty Jujutsu working-copy commit. Commit the changes first."
      );
    }
    return requiredCommand(
      exec,
      "jj",
      [
        "--no-pager",
        "log",
        "-r",
        "latest(::@ & ~empty(), 1)",
        "--no-graph",
        "-T",
        "commit_id",
      ],
      cwd
    );
  }

  const gitCommit = await optionalCommand(
    exec,
    "git",
    ["rev-parse", "HEAD"],
    cwd
  );
  if (!gitCommit)
    throw new Error("Unable to resolve the plugin release source commit.");
  return gitCommit;
}

async function requiredCommand(exec, command, args, cwd) {
  const { stdout } = await exec(command, args, { cwd });
  const value = String(stdout ?? "").trim();
  if (!value)
    throw new Error(`${command} ${args.join(" ")} returned no output.`);
  return value;
}

async function optionalCommand(exec, command, args, cwd) {
  try {
    return await requiredCommand(exec, command, args, cwd);
  } catch {
    return "";
  }
}
