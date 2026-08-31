import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../../workspace/docs-parameters";

export function pluginWorkspaceSource(
  packageName: string,
  pluginClass: string,
  commandId?: string
): string {
  return `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { ${pluginClass} } from "${packageName}";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  let { app }: { app: App } = $props();

  app.plugins.registerCorePlugins([
    { plugin: ${pluginClass}, required: false, enabledByDefault: true },
  ]);
${
  commandId
    ? `
  void app.commands.executeCommandById("${commandId}");`
    : ""
}
</script>

<WorkspaceShell {app} />`;
}

export function registryStoryParameters(source: string, description: string) {
  return {
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: { story: description },
      source: { code: source, language: "tsx", type: "code" },
    },
  };
}
