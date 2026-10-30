import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./csv.parser";

const csvParser = parser.configure({
  props: [
    styleTags({
      "Cell1/...": t.content,
      "Cell2/...": t.typeName,
      "Cell3/...": t.propertyName,
      "Cell4/...": t.labelName,
      "Cell5/...": t.name,
      Separator: t.separator,
      string: t.string,
      value: t.variableName,
    }),
  ],
});

export const csvLanguage = LRLanguage.define({
  name: "csv",
  parser: csvParser,
});

export function csv(): LanguageSupport {
  return new LanguageSupport(csvLanguage);
}
