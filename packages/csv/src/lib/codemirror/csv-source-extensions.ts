import { EditorView } from "@codemirror/view";
import { csv } from "./csv-language";
import { csvRainbowTheme } from "./csv-rainbow-theme";

export function csvSourceExtensions() {
  return [
    csv(),
    csvRainbowTheme(),
    EditorView.lineWrapping,
    EditorView.editorAttributes.of({ class: "csv-source-view" }),
  ];
}
