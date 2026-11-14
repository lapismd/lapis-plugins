<script lang="ts">
  import { untrack } from "svelte";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import Cloud from "@lucide/svelte/icons/cloud";
  import GitBranch from "@lucide/svelte/icons/git-branch";
  import BackupCard from "../backup/BackupCard.svelte";
  import BackupSelect from "../backup/BackupSelect.svelte";
  import RepositoryRemoteActions from "./RepositoryRemoteActions.svelte";
  import RemotePushReview from "./RemotePushReview.svelte";
  import {
    remoteDisplayUrl,
    credentialMatchesRemote,
    remoteTargetLabel,
    validRemoteDraft,
    type RemoteAuthentication,
    type RemoteConnectionDraft,
    type RemoteTargetSettings,
    type RemotesSettingsActions,
    type RemotesSettingsState,
  } from "../../controllers/remotes-settings.js";
  let {
    target,
    state: snapshot,
    actions: commands,
  }: {
    target: RemoteTargetSettings;
    state: RemotesSettingsState;
    actions: RemotesSettingsActions;
  } = $props();
  const id = $props.id();
  let draft = $state<RemoteConnectionDraft>(
    untrack(() => ({
      name: target.target === "backup" ? "backup" : "origin",
      url: "",
      branch: "main",
      bookmark: target.bookmarks[0] ?? "",
      authentication: "anonymous",
      credential: "",
      ...target.connection,
    })),
  );
  let saved = untrack(() => target.connection);
  $effect(() => {
    const connection = target.connection;
    untrack(() => {
      if (connection && connection !== saved) {
        saved = connection;
        draft = { ...connection };
      }
    });
  });
  let pending = $state(false);
  const label = $derived(remoteTargetLabel(target.target));
  const busy = $derived(pending || Boolean(target.busy));
  const dirty = $derived(JSON.stringify(draft) !== JSON.stringify(target.connection));
  const needsCredential = $derived(
    draft.authentication === "token" || draft.authentication === "forge",
  );
  const eligible = $derived(
    snapshot.credentials.filter(
      (credential) =>
        credential.method === draft.authentication &&
        credentialMatchesRemote(credential, draft.url),
    ),
  );
  const valid = $derived(
    validRemoteDraft(draft) &&
      (!needsCredential ||
        eligible.some((item) => item.id === draft.credential && item.available)) &&
      (target.target !== "original" || target.bookmarks.includes(draft.bookmark)),
  );
  const authentication: { value: RemoteAuthentication; label: string }[] = [
    { value: "anonymous", label: "No credentials (public HTTPS)" },
    { value: "token", label: "HTTPS personal access token" },
    { value: "forge", label: "GitHub or Forgejo account" },
    { value: "ssh-agent", label: "SSH agent on this host" },
    { value: "ssh-default", label: "SSH default host identity" },
  ];
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    pending = true;
    try {
      await action();
    } catch (error) {
      commands.report(error);
    } finally {
      pending = false;
    }
  }
  const status = {
    disconnected: "Not connected",
    connected: "Connected",
    "read-only": "Read-only access",
    "credentials-required": "Credentials required",
  };
</script>

<section aria-label={label} aria-busy={busy} class="remote-target-settings">
  <BackupCard
    title={label}
    Icon={target.target === "backup" ? Cloud : GitBranch}
    padded={false}
    description={target.target === "backup"
      ? "Publish recoverable vault checkpoints to a separate remote backup."
      : "Fetch and publish selected bookmarks from this vault’s Git-backed JJ repository."}
  >
    {#snippet actions()}<Badge variant="secondary">{status[target.status]}</Badge>{/snippet}
    <form
      onsubmit={(event) => {
        event.preventDefault();
        if (valid && target.publication?.outcome !== "unknown")
          void perform(() => commands.save(target.target, { ...draft }));
      }}
    >
      <Field.Group class="connection-fields">
        <Field.Field
          ><Field.Label for={`${id}-name`}>Remote name</Field.Label><Input
            id={`${id}-name`}
            bind:value={draft.name}
            disabled={busy}
            required
            autocomplete="off"
          /></Field.Field
        >
        <Field.Field
          ><Field.Label for={`${id}-branch`}>Remote branch</Field.Label><Input
            id={`${id}-branch`}
            bind:value={draft.branch}
            disabled={busy}
            required
            autocomplete="off"
          /></Field.Field
        >
        <Field.Field class="wide"
          ><Field.Label for={`${id}-url`}>Remote URL</Field.Label><Input
            id={`${id}-url`}
            bind:value={draft.url}
            disabled={busy}
            required
            placeholder="https://github.com/you/notes.git"
            autocomplete="off"
            spellcheck={false}
          />
          <Field.Description
            >HTTPS or SSH address. Keep passwords and tokens in credentials.</Field.Description
          ></Field.Field
        >
        {#if target.target === "original"}<Field.Field class="wide"
            ><Field.Label for={`${id}-bookmark`}>Local bookmark to publish</Field.Label
            ><BackupSelect
              id={`${id}-bookmark`}
              bind:value={draft.bookmark}
              disabled={busy}
              options={target.bookmarks.map((value) => ({ value, label: value }))}
            />
            <Field.Description
              >Only the selected committed bookmark is published. Current file edits stay local.</Field.Description
            ></Field.Field
          >{/if}
        <Field.Field class="wide"
          ><Field.Label for={`${id}-authentication`}>Authentication</Field.Label><BackupSelect
            id={`${id}-authentication`}
            bind:value={draft.authentication}
            disabled={busy}
            options={authentication}
            onValueChange={() => {
              draft.credential = "";
            }}
          /></Field.Field
        >
        {#if needsCredential}<Field.Field class="wide"
            ><Field.Label for={`${id}-credential`}>Saved credential</Field.Label><BackupSelect
              id={`${id}-credential`}
              bind:value={draft.credential}
              disabled={busy || snapshot.storage !== "available"}
              options={[
                { value: "", label: "Choose a credential below" },
                ...eligible.map((item) => ({
                  value: item.id,
                  label: `${item.label} · ${item.host}`,
                  disabled: !item.available,
                })),
              ]}
            />
            <Field.Description
              >Manage accounts and access tokens in Credentials below.</Field.Description
            ></Field.Field
          >{/if}
        {#if draft.authentication.startsWith("ssh-")}<p class="wide guidance">
            {snapshot.sshAvailable
              ? `SSH uses the agent or identity configured on ${snapshot.host === "server" ? "the server" : "this computer"}. Host-key verification stays enabled.`
              : "SSH is unavailable on this host. Configure an agent or identity on the host, then try again."}
          </p>{/if}
      </Field.Group>
      <div class="form-actions">
        <span class="guidance"
          >{target.publication?.outcome === "unknown"
            ? "Check the pending push before changing this connection."
            : dirty
              ? "Save before testing, fetching or pushing."
              : "Saving does not fetch or push."}</span
        >
        <Button
          type="submit"
          disabled={busy ||
            !valid ||
            !dirty ||
            target.publication?.outcome === "unknown" ||
            (draft.authentication.startsWith("ssh-") && !snapshot.sshAvailable)}
          >Save connection</Button
        >
        <Button
          type="button"
          variant="outline"
          disabled={busy || dirty || !target.connection}
          onclick={() => void perform(() => commands.test(target.target))}>Test connection</Button
        >
      </div>
    </form>
    {#if target.connection}<div class="saved-connection">
        <p class="endpoint" title={remoteDisplayUrl(target.connection.url)}>
          {remoteDisplayUrl(target.connection.url)}
        </p>
        <RepositoryRemoteActions
          {target}
          disabled={busy || dirty}
          onFetch={() => void perform(() => commands.fetch(target.target))}
          onPush={() => void perform(() => commands.reviewPush(target.target))}
        />
        <p class="guidance" role="status">
          {target.busy === "fetching"
            ? "Fetching remote history… Current files and the selected history pin stay unchanged."
            : target.busy === "testing"
              ? "Checking the saved connection…"
              : target.busy === "pushing"
                ? "Publishing the reviewed commit…"
                : target.observation
                  ? `${target.observation.incoming} incoming · ${target.observation.outgoing} outgoing · Last fetched ${target.observation.fetchedAt}`
                  : "Commit counts appear after a fetch. Fetch does not change current files."}
        </p>
        {#if target.status === "credentials-required"}<p class="guidance">
            Choose an available credential to reconnect. Local history remains available.
          </p>{/if}
      </div>{/if}
    {#if target.publication}<div class="publication" role="status">
        <strong
          >{target.publication.outcome === "unknown"
            ? "Push outcome needs review"
            : "Publication stopped"}</strong
        >
        <p>
          Request <code>{target.publication.id}</code> · <code>{target.publication.commit}</code>
        </p>
        <p class="guidance">
          Check the original request before publishing again. Stopping tracking cannot undo a push
          the remote accepted.
        </p>
        {#if target.publication.outcome === "unknown"}<div class="recovery-actions">
            <Button
              variant="outline"
              disabled={busy}
              onclick={() =>
                void perform(() => commands.observe(target.target, target.publication!.id))}
              >Check push outcome</Button
            >
            <Button
              variant="ghost"
              disabled={busy}
              onclick={() =>
                void perform(() => commands.stop(target.target, target.publication!.id))}
              >Stop tracking this push</Button
            >
          </div>{/if}
      </div>{/if}
  </BackupCard>
</section>
<RemotePushReview
  {target}
  {busy}
  onClose={() => commands.dismissReview(target.target)}
  onPush={(reviewId) => void perform(() => commands.push(target.target, reviewId))}
/>

<style>
  .remote-target-settings {
    min-width: 0;
  }
  :global(.connection-fields) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  :global(.connection-fields .wide) {
    grid-column: 1 / -1;
  }
  .form-actions,
  .recovery-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0 1rem 1rem;
  }
  .form-actions > span {
    flex: 1;
  }
  .saved-connection,
  .publication {
    padding: 1rem;
    border-top: 1px solid var(--border);
  }
  .saved-connection {
    display: grid;
    gap: 0.8rem;
  }
  p {
    margin: 0;
    font-size: 0.8rem;
  }
  .guidance {
    color: var(--muted-foreground);
    font-size: 0.8rem;
  }
  .endpoint,
  .publication p {
    overflow-wrap: anywhere;
  }
  .endpoint {
    font-family: var(--font-mono, monospace);
  }
  .publication {
    display: grid;
    gap: 0.65rem;
    font-size: 0.875rem;
  }
  .recovery-actions {
    justify-content: flex-start;
    padding: 0;
  }
  @container remotes-settings (max-width: 28rem) {
    :global(.connection-fields) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
