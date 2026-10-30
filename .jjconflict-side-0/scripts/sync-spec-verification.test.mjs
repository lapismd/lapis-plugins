import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

for (const withNativeVerification of [false, true]) {
  test(`ordinary verification leaves native requirements with their owner (native table: ${withNativeVerification})`, () => {
    const directory = mkdtempSync(join(tmpdir(), "lapis-native-verification-"));
    try {
      mkdirSync(join(directory, "scripts"));
      mkdirSync(join(directory, "spec/src"), { recursive: true });
      const script = join(directory, "scripts/sync-spec-verification.mjs");
      copyFileSync(
        new URL("./sync-spec-verification.mjs", import.meta.url),
        script
      );
      const write = (file, source) =>
        writeFileSync(join(directory, "spec/src", file), source);
      write(
        "markdown.md",
        "# Markdown\n\n| ID | Requirement |\n| --- | --- |\n| LN-MD-001 | Retain metadata. |\n"
      );
      write(
        "native-services.md",
        "# Native services\n\n| ID | Requirement |\n| --- | --- |\n| LN-NATIVE-001 | Retain metadata natively. |\n"
      );
      const native =
        "# Native verification\n\n| ID | Chapter | Status | Evidence |\n| --- | --- | --- | --- |\n| LN-NATIVE-001 | native-services | In progress | Native source proof. |\n";
      if (withNativeVerification) write("native-verification.md", native);
      write(
        "verification.md",
        "# Verification\n\n| ID | Chapter | Status | Evidence |\n| --- | --- | --- | --- |\n| LN-MD-001 | markdown | In progress | Retained evidence. |\n"
      );
      const result = spawnSync(process.execPath, [script], {
        encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
      const output = readFileSync(
        join(directory, "spec/src/verification.md"),
        "utf8"
      );
      assert.match(
        output,
        /LN-MD-001 \| markdown \| In progress \| Retained evidence\./u
      );
      assert.doesNotMatch(output, /LN-NATIVE-001/u);
      if (withNativeVerification)
        assert.equal(
          readFileSync(
            join(directory, "spec/src/native-verification.md"),
            "utf8"
          ),
          native
        );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
