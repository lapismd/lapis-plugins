import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { docxExportPolyfills } from "../../../scripts/lib/docx-export-polyfills.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
await build({
  root,
  configFile: false,
  base: "./",
  publicDir: false,
  plugins: [docxExportPolyfills()],
  resolve: {
    alias: {
      "@cw/shared": path.join(root, "vendor/wordcanvas/shared/src/index.ts"),
    },
  },
  worker: { format: "es", plugins: () => [docxExportPolyfills()] },
  build: {
    outDir: path.join(root, "dist/wordcanvas"),
    emptyOutDir: true,
    copyPublicDir: false,
    sourcemap: false,
    minify: false,
    target: "es2022",
    lib: {
      entry: path.join(root, "vendor/wordcanvas/frontend/src/wordcanvas.ts"),
      formats: ["es"],
      fileName: () => "wordcanvas.js",
    },
  },
  logLevel: "warn",
});

// Relocate the source-only vendor import into this package's built inventory.
const mountPath = path.join(root, "dist/lib/mount-docx.js");
const source = await readFile(mountPath, "utf8");
const vendorImport =
  /(["'])\.\.\/\.\.\/vendor\/wordcanvas\/frontend\/src\/wordcanvas\1/g;
if ([...source.matchAll(vendorImport)].length !== 1) {
  throw new Error("Expected exactly one DOCX WordCanvas import to package.");
}
await writeFile(
  mountPath,
  source.replace(vendorImport, '"../wordcanvas/wordcanvas.js"'),
);
