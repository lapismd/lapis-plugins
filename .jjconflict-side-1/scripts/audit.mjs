import { existsSync, mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const candidate = resolve(".local/validation/audit");
const useCandidate =
  process.env.LAPIS_PLUGINS_VALIDATION_WORKER === "1" &&
  existsSync(resolve(candidate, "pnpm-lock.yaml"));
// A directory below the workspace makes pnpm select the parent's restored lock.
// An isolated temporary root keeps the candidate graph authoritative for audit.
const directory = useCandidate
  ? mkdtempSync(join(tmpdir(), "lapis-plugin-audit-"))
  : process.cwd();
try {
  if (useCandidate)
    for (const name of ["package.json", "pnpm-lock.yaml"])
      copyFileSync(join(candidate, name), join(directory, name));
  console.log(
    useCandidate
      ? "Auditing the installed verified-archive graph."
      : "Auditing the registry lockfile graph.",
  );
  const result = spawnSync("pnpm", ["audit", ...process.argv.slice(2)], {
    cwd: directory,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  if (useCandidate) rmSync(directory, { recursive: true, force: true });
}
