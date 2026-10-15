<script lang="ts">
  import { onMount } from "svelte";
  import { createOpfsVault, createVaultSession, type VaultSession } from "@lapis-notes/api";
  import ReviewSession from "./ReviewSession.svelte";
  let session = $state<VaultSession | null>(null);
  let failure = $state("");
  onMount(() => {
    let canceled = false;
    void (async () => {
      const adapter = await createOpfsVault({ name: "Sync connection review", vaultId: "sync-connection-review" });
      const opened = await createVaultSession(adapter);
      if (canceled) await opened.close();
      else session = opened;
    })().catch(error => { console.error(error); failure = error instanceof Error ? error.message : String(error); });
    return () => { canceled = true; };
  });
</script>
{#if failure}<p role="alert">{failure}</p>{:else if session}<ReviewSession {session} />{:else}<p role="status">Opening the persistent local vault…</p>{/if}
