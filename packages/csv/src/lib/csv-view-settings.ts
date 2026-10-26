import type { App, Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { CSV_PLUGIN_ID } from "./ids";

export type CsvTablePresentation = "table" | "canvas";

export const CSV_SETTINGS_SECTION_ID = "lapis-csv";

export const CSV_SETTING_IDS = {
  defaultView: "lapis-csv.defaultView",
} as const;

const DEFAULT_VIEW_FIELD = {
  title: "Default table view",
  description: "Open a CSV or TSV as the table or the canvas sheet.",
  type: "string" as const,
  default: "canvas",
  enum: ["table", "canvas"],
};

export const CSV_CONFIGURATION_SCHEMA = {
  id: "lapis-csv",
  title: "CSV",
  type: "object" as const,
  properties: {
    [CSV_SETTING_IDS.defaultView]: DEFAULT_VIEW_FIELD,
  },
};

type SettingsController = {
  get: (id: string) => unknown;
  on: (
    name: "change",
    listener: (event: { id?: string }) => void,
  ) => unknown;
  offref: (ref: unknown) => void;
};

function settingsController(app: App): SettingsController | undefined {
  try {
    return getWorkspaceHostBinding(app.workspace).controller
      .settings as SettingsController;
  } catch {
    return undefined;
  }
}

export function isCsvTablePresentation(
  value: unknown,
): value is CsvTablePresentation {
  return value === "table" || value === "canvas";
}

export function readDefaultCsvView(app: App): CsvTablePresentation {
  const live = settingsController(app)?.get(CSV_SETTING_IDS.defaultView);
  if (isCsvTablePresentation(live)) return live;
  const stored = app.configuration
    ?.getConfiguration()
    .get(CSV_SETTING_IDS.defaultView, "canvas");
  return isCsvTablePresentation(stored) ? stored : "canvas";
}

export function createCsvSettingsSection() {
  return {
    id: CSV_SETTINGS_SECTION_ID,
    title: "CSV",
    description: "How CSV and TSV files open.",
    icon: "table" as const,
    order: 29,
    navigationGroupId: "core-plugins",
    sourcePluginId: CSV_PLUGIN_ID,
    fields: [
      {
        id: CSV_SETTING_IDS.defaultView,
        title: DEFAULT_VIEW_FIELD.title,
        description: DEFAULT_VIEW_FIELD.description,
        type: "enum" as const,
        default: "canvas" as const,
        options: [
          { value: "table", label: "Table" },
          { value: "canvas", label: "Canvas" },
        ],
      },
    ],
  };
}

export function registerCsvViewSettings(plugin: Plugin): void {
  const schema = plugin.app.configuration?.schema;
  if (schema) {
    schema.register(CSV_CONFIGURATION_SCHEMA);
    plugin.register(() => {
      schema.unregister(CSV_CONFIGURATION_SCHEMA);
    });
    void plugin.app.configuration?.materializeSchemaDefaults?.();
  }
  const settings = settingsController(plugin.app);
  if (!settings) return;
  try {
    const dispose = getWorkspaceHostBinding(
      plugin.app.workspace,
    ).controller.registerSettingsSection(createCsvSettingsSection());
    plugin.register(dispose);
  } catch {
    return;
  }
}
