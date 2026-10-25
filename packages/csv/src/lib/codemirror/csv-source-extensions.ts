import type { Extension } from "@codemirror/state";
import type { App } from "@lapis-notes/api";
import { markupEditor } from "@lapis-notes/api/editor/core";
import { csvLanguageExtensions } from "./csv-language-extensions";

/**
 * Lapis markup editor with the CSV language layered on top.
 * Line numbers, wrapping, indent, and the monospace face come from the host.
 */
export function csvSourceExtensions(app: App): Extension {
  return markupEditor({ language: "csv", app }, ...csvLanguageExtensions());
}
