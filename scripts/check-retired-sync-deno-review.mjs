import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

const retiredFiles = [
  "dev/sync/native-playwright.config.ts",
  "dev/sync/native-sign-in.spec.ts",
];

const implementationFiles = [
  "dev/sync/main.ts",
  "dev/sync/Review.svelte",
  "dev/sync/playwright.config.ts",
  "dev/sync/sign-in.spec.ts",
  "dev/sync/vite.config.mjs",
];

const currentAuthorityFiles = [
  "spec/src/distribution.md",
  "spec/src/spec-governance.md",
  "spec/src/plugins/sync/index.md",
  "spec/src/verification.md",
];

const implementationReference =
  /VITE_SYNC_NATIVE_REVIEW|LAPIS_SYNC_NATIVE_(?:HOST_DRIVER|REVIEW_CLIENT)|runtime:\s*["']deno-desktop["']|Deno desktop window|real Deno|spawn\(\s*["']deno["']|native-(?:playwright|sign-in)/u;

const staleAuthorityReference =
  /Preserve separately invoked private Sync native-review acceptance|Private Sync native-review commands retain|operator-provided Deno runtime|explicitly supplied external Deno runtime|real Deno (?:protocol|journey|selection\/reload acceptance)|private-app\/Deno acceptance|real-server\/Keychain UI journey/u;

function inspectFile(directory, relative, pattern, message, errors) {
  const absolute = path.join(directory, relative);
  if (!existsSync(absolute)) return;
  const lines = readFileSync(absolute, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (pattern.test(line)) errors.push(`${relative}:${index + 1}: ${message}`);
  });
}

export function auditRetiredSyncDenoReview(directory = root) {
  const errors = [];
  for (const relative of retiredFiles)
    if (existsSync(path.join(directory, relative)))
      errors.push(`${relative}: retired live-Deno Sync review entrypoint`);
  for (const relative of implementationFiles)
    inspectFile(
      directory,
      relative,
      implementationReference,
      "retired live-Deno Sync review implementation",
      errors,
    );
  for (const relative of currentAuthorityFiles)
    inspectFile(
      directory,
      relative,
      staleAuthorityReference,
      "stale live-Deno Sync review authority",
      errors,
    );
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const errors = auditRetiredSyncDenoReview();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else console.log("Retired live-Deno Sync review boundaries pass.");
}
