import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const changesetDir = path.join(root, ".changeset");

// Bases and History are approved for the next governed public release.
// Retain explicit hold support without silently excluding either package.
export const heldPackageNames = [];

export function partitionChangeset(source, held = heldPackageNames) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const heldNames = new Set(held);
  const entries = [];
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parsed = line.match(/^"([^"]+)":\s*(patch|minor|major)\s*$/);
    if (!parsed) throw new Error(`Unrecognized changeset line: ${line}`);
    entries.push({ name: parsed[1], bump: parsed[2] });
  }
  const body = match[2];
  return {
    body,
    held: entries.filter((entry) => heldNames.has(entry.name)),
    rest: entries.filter((entry) => !heldNames.has(entry.name)),
  };
}

export function renderChangeset(entries, body) {
  const lines = entries.map((entry) => `"${entry.name}": ${entry.bump}`);
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

export function changesetIsReleasable(source, held = heldPackageNames) {
  const parsed = partitionChangeset(source, held);
  if (!parsed) return false;
  if (parsed.held.length === 0) return true;
  return parsed.rest.length > 0;
}

function changesetFiles() {
  return readdirSync(changesetDir).filter(
    (name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md",
  );
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.`);
  }
}

export function versionPublicPackages() {
  const holdDir = mkdtempSync(path.join(tmpdir(), "lapis-held-changesets-"));
  const snapshots = new Map();
  let versioned = false;
  let restoreSnapshots = false;
  try {
    let releasable = false;
    for (const name of changesetFiles()) {
      const file = path.join(changesetDir, name);
      const source = readFileSync(file, "utf8");
      const parsed = partitionChangeset(source);
      if (!parsed || parsed.held.length === 0) {
        releasable ||= changesetIsReleasable(source);
        continue;
      }
      snapshots.set(name, source);
      if (parsed.rest.length === 0) {
        writeFileSync(
          path.join(holdDir, name),
          renderChangeset(parsed.held, parsed.body),
        );
        rmSync(file);
        continue;
      }
      releasable = true;
      writeFileSync(file, renderChangeset(parsed.rest, parsed.body));
      writeFileSync(
        path.join(holdDir, name),
        renderChangeset(parsed.held, parsed.body),
      );
    }
    if (releasable) {
      run("pnpm", ["exec", "changeset", "version"]);
      versioned = true;
      run("pnpm", ["packages:sync"]);
    }
  } catch (error) {
    restoreSnapshots = !versioned;
    if (restoreSnapshots) {
      for (const [name, source] of snapshots) {
        writeFileSync(path.join(changesetDir, name), source);
      }
    }
    throw error;
  } finally {
    if (!restoreSnapshots) {
      for (const name of readdirSync(holdDir)) {
        copyFileSync(path.join(holdDir, name), path.join(changesetDir, name));
      }
    }
    rmSync(holdDir, { recursive: true, force: true });
  }
}

function reportReleasable(releasable) {
  const value = releasable ? "true" : "false";
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `releasable=${value}\n`, {
      flag: "a",
    });
  }
  console.log(
    releasable
      ? "A pending changeset can bump a published package."
      : "No pending changeset can bump a published package.",
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.includes("--check")) {
    const releasable = changesetFiles().some((name) =>
      changesetIsReleasable(
        readFileSync(path.join(changesetDir, name), "utf8"),
      ),
    );
    reportReleasable(releasable);
  } else {
    versionPublicPackages();
  }
}
