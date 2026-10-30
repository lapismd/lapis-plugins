import { nodePolyfills } from "vite-plugin-node-polyfills";

// pdfkit, loaded by the DOCX export worker, imports Node builtins. Vitest runs
// on real Node and must not receive these shims. Storybook's client also imports
// `node:process` stdout and stdin, so that module stays unpolyfilled there.
export function docxExportPolyfills({ process: includeProcess = true } = {}) {
  const include = ["assert", "buffer", "events", "stream", "util", "zlib"];
  if (includeProcess) include.push("process");
  return nodePolyfills({
    include,
    globals: { Buffer: false, global: false, process: false },
  });
}
