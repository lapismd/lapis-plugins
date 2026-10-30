<script lang="ts">
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import type { SyncAccountState } from "../presentation/account";
  let { value }: WorkspaceCustomSettingProps<SyncAccountState> = $props();
  let copiedUrl = $state("");
  let failedUrl = $state("");
  const copied = $derived(Boolean(value.verificationUrl && copiedUrl === value.verificationUrl));
  async function copyLink(): Promise<void> {
    const url = value.verificationUrl;
    if (!url) return;
    copiedUrl = failedUrl = "";
    try {
      await navigator.clipboard.writeText(url);
      copiedUrl = url;
    } catch { failedUrl = url; }
  }
</script>

<div class="sync-account-field">
<p
  role={value.status === "error" ? "alert" : "status"}
  aria-label="Server account status"
  class="sync-account-message"
>{value.message}</p>
{#if value.verificationUrl}
  <div class="sync-account-link">
    <a href={value.verificationUrl} title={value.verificationUrl} target="_blank" rel="noopener noreferrer" aria-label="Server sign-in link">{value.verificationUrl}</a>
    <Button variant="ghost" size="icon-sm" aria-label="Copy sign-in link" title={copied ? "Copied" : "Copy sign-in link"} data-copied={copied || undefined} onclick={() => void copyLink()}>
      <WorkspaceIcon name={copied ? "check" : "copy"} />
    </Button>
  </div>
  {#if failedUrl === value.verificationUrl}
    <p role="alert" class="sync-account-message">Could not copy the link. Select and copy it manually.</p>
  {/if}
{/if}
</div>

<style>
  .sync-account-field {
    display: grid;
    gap: 0.5rem;
    width: 100%;
    min-width: 0;
  }

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

  .sync-account-link {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
    width: 100%;
  }

  .sync-account-link a {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--ui-workspace-settings-description-size, 0.75rem);
    color: var(--ui-workspace-accent, var(--primary));
  }

  .sync-account-link a:focus-visible {
    outline: 2px solid var(--ui-workspace-focus-ring, var(--ring));
    outline-offset: 2px;
  }
</style>
