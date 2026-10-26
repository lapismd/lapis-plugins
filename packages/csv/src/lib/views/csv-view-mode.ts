import type { CsvTablePresentation } from "../csv-view-settings";

export type CsvViewMode = "table" | "canvas" | "source";

export function csvViewMode(
  state: Record<string, unknown>,
  fallback: CsvTablePresentation = "table",
): CsvViewMode {
  const mode = state["mode"];
  if (mode === "source" || mode === "canvas" || mode === "table") return mode;
  return fallback;
}
