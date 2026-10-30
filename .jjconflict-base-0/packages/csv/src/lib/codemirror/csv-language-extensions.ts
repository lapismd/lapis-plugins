import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { csv } from "./csv-language";
import { csvRainbowTheme } from "./csv-rainbow-theme";

/** CSV language and column colours, without the Lapis editor shell. */
export function csvLanguageExtensions(): Extension[] {
  return [
    csv(),
    csvRainbowTheme(),
    EditorView.editorAttributes.of({ class: "csv-source-view" }),
  ];
}
