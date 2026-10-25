import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const csvHighlightStyle = HighlightStyle.define([
  { tag: tags.content, class: "cm-csv-cell1" },
  { tag: tags.typeName, class: "cm-csv-cell2" },
  { tag: tags.propertyName, class: "cm-csv-cell3" },
  { tag: tags.labelName, class: "cm-csv-cell4" },
  { tag: tags.name, class: "cm-csv-cell5" },
  { tag: tags.string, class: "cm-csv-string" },
  { tag: tags.variableName, class: "cm-csv-value" },
  { tag: tags.separator, class: "cm-csv-separator" },
]);

export function csvRainbowTheme() {
  return syntaxHighlighting(csvHighlightStyle);
}
