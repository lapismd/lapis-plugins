import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const parseMetadataSource = readFileSync(
  fileURLToPath(new URL("./parse-metadata.ts", import.meta.url)),
  "utf8",
);

describe("parse-metadata worker construction", () => {
  it("uses the standard module-worker URL form in packaged consumers", () => {
    expect(parseMetadataSource).toContain(
      'new URL("./metadata-worker.js", import.meta.url)',
    );
    expect(parseMetadataSource).toContain('{ type: "module" }');
    expect(parseMetadataSource).not.toContain("?worker");
  });
});
