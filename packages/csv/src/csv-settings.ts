export type CsvDelimiter = "," | "\t" | ";" | "|";

export type CsvDelimiterMode = "auto" | CsvDelimiter;

export type CsvPluginSettings = {
  headerRow: boolean;
  delimiter: CsvDelimiterMode;
  showRowNumbers: boolean;
};

export type CsvPluginSettingsPatch = Partial<CsvPluginSettings>;

export const DEFAULT_CSV_SETTINGS: CsvPluginSettings = {
  headerRow: true,
  delimiter: "auto",
  showRowNumbers: true,
};

export function mergeCsvSettings(
  data: Partial<CsvPluginSettings> | null | undefined,
): CsvPluginSettings {
  return {
    ...DEFAULT_CSV_SETTINGS,
    ...data,
  };
}

export function patchCsvSettings(
  current: CsvPluginSettings,
  patch: CsvPluginSettingsPatch,
): CsvPluginSettings {
  return mergeCsvSettings({ ...current, ...patch });
}

export function delimiterForExtension(extension: string): CsvDelimiter {
  switch (extension.toLowerCase()) {
    case "tsv":
      return "\t";
    default:
      return ",";
  }
}

export function resolveDelimiter(
  settings: CsvPluginSettings,
  extension: string,
): CsvDelimiter {
  if (settings.delimiter === "auto") {
    return delimiterForExtension(extension);
  }
  return settings.delimiter;
}
