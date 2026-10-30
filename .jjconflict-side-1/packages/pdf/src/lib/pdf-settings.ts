import type { App, Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { PDF_PLUGIN_ID, PDF_VIEWER_DEFAULTS } from "./ids";

export const PDF_SETTINGS_SECTION_ID = "lapis-pdf";

export const PDF_SETTING_IDS = {
  forceDarkPages: "lapis-pdf.forceDarkPages",
} as const;

const FORCE_DARK_PAGES_FIELD = {
  title: "Invert PDF pages in dark mode",
  description:
    "Apply an inversion filter to rendered PDF page images while the app is dark.",
  type: "boolean" as const,
  default: true,
};

export const PDF_CONFIGURATION_SCHEMA = {
  id: "lapis-pdf",
  title: "PDF",
  type: "object" as const,
  properties: {
    [PDF_SETTING_IDS.forceDarkPages]: FORCE_DARK_PAGES_FIELD,
  },
};

export function createPdfSettingsSection() {
  return {
    id: PDF_SETTINGS_SECTION_ID,
    title: "PDF",
    description: "PDF page appearance.",
    icon: "file-text" as const,
    order: 28,
    navigationGroupId: "core-plugins",
    sourcePluginId: PDF_PLUGIN_ID,
    fields: [
      {
        id: PDF_SETTING_IDS.forceDarkPages,
        ...FORCE_DARK_PAGES_FIELD,
      },
    ],
  };
}

type SettingsController = {
  get: (id: string) => unknown;
  on: (
    name: "change",
    listener: (event: { id?: string }) => void,
  ) => unknown;
  offref: (ref: unknown) => void;
};

export function pdfSettingsController(app: App): SettingsController | undefined {
  try {
    return getWorkspaceHostBinding(app.workspace).controller
      .settings as SettingsController;
  } catch {
    return undefined;
  }
}

export function readForceDarkPages(app: App): boolean {
  const live = pdfSettingsController(app)?.get(PDF_SETTING_IDS.forceDarkPages);
  if (typeof live === "boolean") return live;
  const stored = app.configuration
    ?.getConfiguration()
    .get(PDF_SETTING_IDS.forceDarkPages, PDF_VIEWER_DEFAULTS.forceDarkPages);
  return typeof stored === "boolean"
    ? stored
    : PDF_VIEWER_DEFAULTS.forceDarkPages;
}

export function registerPdfSettings(plugin: Plugin): void {
  const schema = plugin.app.configuration?.schema;
  if (schema) {
    schema.register(PDF_CONFIGURATION_SCHEMA);
    plugin.register(() => {
      schema.unregister(PDF_CONFIGURATION_SCHEMA);
    });
    void plugin.app.configuration.materializeSchemaDefaults?.();
  }

  const settings = pdfSettingsController(plugin.app);
  if (!settings) return;
  const dispose = getWorkspaceHostBinding(
    plugin.app.workspace,
  ).controller.registerSettingsSection(createPdfSettingsSection());
  plugin.register(dispose);
}
