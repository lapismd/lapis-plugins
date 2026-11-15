<script lang="ts">
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import type { WorkspaceCustomSetting } from "@lapis-notes/api";
  import RepositoryRemotesSettings from "../../../../packages/history/src/lib/repository/components/remotes/RepositoryRemotesSettings.svelte";
  import type { RemotesFixture } from "./model.svelte";
  let { section }: WorkspaceSettingsPageProps = $props();
  const field = $derived(
    section.fields![0] as WorkspaceCustomSetting & { fixture: RemotesFixture },
  );
</script>

<RepositoryRemotesSettings state={field.fixture.state} actions={field.fixture.actions} />
