<script lang="ts">
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import type { SyncAccountState } from "../presentation/account";
  let { value }: WorkspaceCustomSettingProps<SyncAccountState> = $props();
</script>

<p
  role={value.status === "error" ? "alert" : "status"}
  aria-label="Server account status"
  class="sync-account-message"
>{value.message}</p>

<style>
  .sync-account-message {
    margin: 0;
    width: 100%;
    text-align: start;
    font-size: var(--ui-workspace-settings-description-size, 0.75rem);
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    overflow-wrap: anywhere;
  }

  .sync-account-message[role="alert"] {
    color: var(--destructive);
  }
</style>
