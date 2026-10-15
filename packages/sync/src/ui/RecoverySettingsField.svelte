<script lang="ts">
  import { Input } from "@lapismd/design-core/shadcn/input";
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import type { RecoverySettingsValue } from "../settings/field-values";
  import "./controlled-settings-fields.css";

  let {
    value,
    id,
    field,
    setValue,
    disabled = false,
    readOnly = false,
    busy = false,
    error,
  }: WorkspaceCustomSettingProps<RecoverySettingsValue> = $props();

  async function selectFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    await setValue({
      ...value,
      selectedFile: input.files?.[0] ?? null,
      error: null,
    });
  }

  async function choose(
    conflictId: string,
    choice: "remote" | "local" | "keep-both",
  ) {
    await setValue({
      ...value,
      choices: { ...value.choices, [conflictId]: choice },
    });
  }
</script>

<div class="sync-controlled-field" aria-busy={busy}>
  <Input
    {id}
    aria-label={field.title}
    type="file"
    accept=".lapis-recovery,application/octet-stream"
    disabled={disabled || readOnly || busy}
    onchange={selectFile}
  />
  {#if value.selectedFile}
    <p>Selected: {value.selectedFile.name}</p>
  {/if}
  {#if value.status}<p role="status">{value.status}</p>{/if}

  {#if value.preview}
    <div class="sync-recovery-preview">
      <strong>Rebind preview</strong>
      <p>
        {value.preview.automatic.length} automatic matches,
        {value.preview.conflicts.length} choices, and
        {value.preview.localOnly.length} local-only files.
      </p>
      {#each value.preview.conflicts as conflict (conflict.id)}
        <fieldset>
          <legend>{conflict.remotePath}</legend>
          <p>{conflict.kind.replaceAll("-", " ")}</p>
          {#each ["remote", "local", "keep-both"] as choice}
            <label>
              <input
                type="radio"
                name={conflict.id}
                value={choice}
                checked={value.choices[conflict.id] === choice}
                disabled={disabled || readOnly || busy}
                onchange={() =>
                  void choose(
                    conflict.id,
                    choice as "remote" | "local" | "keep-both",
                  )}
              />
              {choice.replaceAll("-", " ")}
            </label>
          {/each}
        </fieldset>
      {/each}
    </div>
  {/if}

  {#if error || value.error}
    <p class="sync-controlled-field__error" role="alert">
      {error ?? value.error}
    </p>
  {/if}
</div>
