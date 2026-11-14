<script lang="ts">
  import { onDestroy } from "svelte";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import KeyRound from "@lucide/svelte/icons/key-round";
  import BackupCard from "../backup/BackupCard.svelte";
  import BackupSelect from "../backup/BackupSelect.svelte";
  import type {
    RemoteCredential,
    RemotesSettingsActions,
    RemotesSettingsState,
  } from "../../controllers/remotes-settings.js";
  let {
    state: snapshot,
    actions: commands,
  }: { state: RemotesSettingsState; actions: RemotesSettingsActions } = $props();
  const id = $props.id();
  let open = $state(false);
  let replace = $state<string>();
  let label = $state("");
  let host = $state("");
  let username = $state("");
  let token = $state("");
  let provider = $state<"https" | "github" | "forgejo">("https");
  let busy = $state(false);
  const locked = $derived(snapshot.storage !== "available");
  const location = $derived(
    snapshot.host === "desktop"
      ? "this computer’s OS credential store"
      : "the server’s encrypted credential store",
  );
  onDestroy(() => {
    token = "";
  });
  function edit(credential?: RemoteCredential, selected: typeof provider = "https") {
    token = "";
    replace = credential?.id;
    label = credential?.label ?? "";
    host = credential?.host ?? (selected === "github" ? "github.com" : "");
    username = credential?.username ?? "";
    provider = selected;
    open = true;
  }
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    busy = true;
    try {
      await action();
    } catch (error) {
      commands.report(error);
    } finally {
      busy = false;
    }
  }
  async function save() {
    if (locked || !token.trim()) return;
    const input = {
      label: label.trim(),
      host: host.trim(),
      username: username.trim(),
      token,
      replace,
      provider,
    };
    token = "";
    await commands.saveCredential(input);
    open = false;
  }
</script>

<section aria-label="Credentials" aria-busy={busy}>
  <BackupCard
    title="Credentials"
    Icon={KeyRound}
    description={`Tokens are saved in ${location}. They are never included in vault backups.`}
  >
    {#if locked}<p role="status" class="guidance">
        {snapshot.storage === "locked"
          ? "Credential store is locked. Configure the server encryption key to save or use tokens."
          : "Credential storage is unavailable on this host. Local repository history remains available."}
      </p>{/if}
    {#if snapshot.credentials.length}<ul aria-label="Saved credentials">
        {#each snapshot.credentials as credential (credential.id)}<li>
            <div class="identity">
              <strong>{credential.label}</strong><span
                >{credential.username} · {credential.host}</span
              ><span
                >{credential.method === "forge" ? "Forge account" : "Personal access token"} · {credential.available &&
                !locked
                  ? "Available"
                  : "Reconnect required"}</span
              >
            </div>
            <div class="actions">
              <Badge variant="secondary"
                >{snapshot.host === "desktop" ? "OS store" : "Encrypted on server"}</Badge
              >
              <Button
                variant="outline"
                size="sm"
                disabled={busy || locked}
                aria-label={`Replace ${credential.label}`}
                onclick={() =>
                  edit(
                    credential,
                    credential.method === "forge"
                      ? credential.host === "github.com"
                        ? "github"
                        : "forgejo"
                      : "https",
                  )}>Replace</Button
              >
              <Button
                variant="ghost"
                size="sm"
                disabled={busy || locked}
                aria-label={`Forget ${credential.label}`}
                onclick={() => void perform(() => commands.forgetCredential(credential.id))}
                >Forget</Button
              >
            </div>
          </li>{/each}
      </ul>{:else if !locked}<p class="guidance">
        Add a token or sign in to a forge account. Public HTTPS remotes can fetch without
        credentials.
      </p>{/if}
    <div class="actions add-actions">
      <Button variant="outline" disabled={busy || locked} onclick={() => edit()}
        >Add access token</Button
      >
      <Button
        variant="outline"
        disabled={busy || locked || !snapshot.deviceSignInAvailable}
        onclick={() => void perform(() => commands.beginSignIn())}>Sign in to GitHub</Button
      >
      <Button variant="ghost" disabled={busy || locked} onclick={() => edit(undefined, "forgejo")}
        >Add Forgejo account</Button
      >
    </div>
    {#if !snapshot.deviceSignInAvailable}<p class="guidance">
        GitHub device sign-in is not configured on this host. You can use an access token instead.
      </p>{/if}
    <p class="guidance">
      SSH keys and passphrases stay with the {snapshot.host === "server"
        ? "server’s"
        : "computer’s"} SSH agent or default identity. Manage them on that host.
    </p>
  </BackupCard>
</section>

<Dialog.Root
  bind:open
  onOpenChange={(next) => {
    if (!next) token = "";
  }}
>
  <Dialog.Content>
    <Dialog.Header
      ><Dialog.Title>{replace ? "Replace credential" : "Add remote credential"}</Dialog.Title
      ><Dialog.Description
        >Save access in {location}. Existing secrets cannot be displayed.</Dialog.Description
      ></Dialog.Header
    >
    <form
      onsubmit={(event) => {
        event.preventDefault();
        void perform(save);
      }}
    >
      <Field.Group>
        <Field.Field
          ><Field.Label for={`${id}-provider`}>Credential type</Field.Label><BackupSelect
            id={`${id}-provider`}
            bind:value={provider}
            disabled={busy}
            options={[
              { value: "https", label: "HTTPS access token" },
              { value: "github", label: "GitHub personal access token" },
              { value: "forgejo", label: "Forgejo access token" },
            ]}
          /></Field.Field
        >
        <Field.Field
          ><Field.Label for={`${id}-label`}>Credential label</Field.Label><Input
            id={`${id}-label`}
            bind:value={label}
            required
            disabled={busy}
            placeholder="My notes backup"
            autocomplete="off"
          /></Field.Field
        >
        <Field.Field
          ><Field.Label for={`${id}-host`}>Host</Field.Label><Input
            id={`${id}-host`}
            bind:value={host}
            required
            disabled={busy}
            placeholder="github.com"
            pattern="[a-zA-Z0-9.:-]+"
            autocomplete="off"
          /><Field.Description
            >Access is scoped to this host and the approved remote.</Field.Description
          ></Field.Field
        >
        <Field.Field
          ><Field.Label for={`${id}-username`}>Username</Field.Label><Input
            id={`${id}-username`}
            bind:value={username}
            required
            disabled={busy}
            autocomplete="off"
          /></Field.Field
        >
        <Field.Field
          ><Field.Label for={`${id}-token`}>Access token</Field.Label><Input
            id={`${id}-token`}
            type="password"
            bind:value={token}
            required
            disabled={busy}
            autocomplete="new-password"
            spellcheck={false}
          /><Field.Description
            >Use a token with the repository access you need. Read-only tokens cannot push.</Field.Description
          ></Field.Field
        >
      </Field.Group>
      <Dialog.Footer style="margin-top:1rem"
        ><Button
          type="button"
          variant="outline"
          disabled={busy}
          onclick={() => {
            token = "";
            open = false;
          }}>Cancel</Button
        ><Button
          type="submit"
          disabled={busy ||
            locked ||
            !label.trim() ||
            !host.trim() ||
            !username.trim() ||
            !token.trim()}>Save credential</Button
        ></Dialog.Footer
      >
    </form>
  </Dialog.Content>
</Dialog.Root>
<Dialog.Root
  open={Boolean(snapshot.authorization)}
  onOpenChange={(next) => {
    if (!next) void perform(() => commands.cancelSignIn());
  }}
>
  <Dialog.Content>
    <Dialog.Header
      ><Dialog.Title>Sign in to GitHub</Dialog.Title><Dialog.Description
        >Enter this code on GitHub, then check the authorization here.</Dialog.Description
      ></Dialog.Header
    >
    {#if snapshot.authorization}<p class="device-code">
        <code>{snapshot.authorization.code}</code>
      </p>
      <a href={snapshot.authorization.url} target="_blank" rel="noopener noreferrer"
        >Open GitHub device sign-in</a
      >
      {#if snapshot.authorization.state === "expired"}<p role="status">
          This code has expired. Start sign-in again for a new code.
        </p>{/if}
      <Dialog.Footer
        ><Button
          variant="outline"
          disabled={busy}
          onclick={() => void perform(() => commands.cancelSignIn())}>Cancel sign-in</Button
        ><Button
          disabled={busy}
          onclick={() =>
            void perform(() =>
              snapshot.authorization?.state === "expired"
                ? commands.beginSignIn()
                : commands.checkSignIn(),
            )}
          >{snapshot.authorization.state === "expired" ? "Start again" : "Check sign-in"}</Button
        ></Dialog.Footer
      >
    {/if}
  </Dialog.Content>
</Dialog.Root>

<style>
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.85rem 0;
    border-bottom: 1px solid var(--border);
  }
  .identity {
    flex: 1;
    min-width: 10rem;
    display: grid;
    gap: 0.25rem;
    overflow-wrap: anywhere;
    font-size: 0.875rem;
  }
  .identity span,
  .guidance {
    color: var(--muted-foreground);
    font-size: 0.8rem;
  }
  .guidance {
    margin: 0.65rem 0;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .add-actions {
    margin: 1rem 0;
  }
  .device-code {
    font-size: 1.5rem;
    letter-spacing: 0.1em;
    text-align: center;
  }
</style>
