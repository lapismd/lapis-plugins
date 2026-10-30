<script lang="ts">
  import { cn } from "@lapis-notes/ui";
  import { tick } from "svelte";

  let {
    value,
    multiline = false,
    class: className,
    onContentChange,
    onCommit,
    onNavigate,
  }: {
    value: string;
    multiline?: boolean;
    class?: string;
    onContentChange: (value: string) => void;
    onCommit?: () => void;
    onNavigate?: (direction: "next" | "prev" | "down" | "up") => void;
  } = $props();

  let editing = $state(false);
  let draft = $state("");
  let editingMultiline = $state(false);
  let inputEl = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const useMultiline = $derived(
    multiline || editingMultiline || draft.includes("\n"),
  );

  $effect(() => {
    if (!editing) {
      draft = value;
      editingMultiline = false;
    }
  });

  function startEditing() {
    draft = value;
    editingMultiline = multiline || value.includes("\n");
    editing = true;
    tick().then(() => inputEl?.focus());
  }

  function commit() {
    if (!editing) {
      return;
    }
    editing = false;
    editingMultiline = false;
    if (draft !== value) {
      onContentChange(draft);
    }
    onCommit?.();
  }

  function insertNewlineAtCursor(event: KeyboardEvent) {
    const target = event.currentTarget as
      | HTMLInputElement
      | HTMLTextAreaElement;
    const start = target.selectionStart ?? draft.length;
    const end = target.selectionEnd ?? draft.length;
    draft = `${draft.slice(0, start)}\n${draft.slice(end)}`;
    editingMultiline = true;
    const cursor = start + 1;
    tick().then(() => {
      inputEl?.focus();
      if (inputEl instanceof HTMLTextAreaElement) {
        inputEl.setSelectionRange(cursor, cursor);
      }
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      editing = false;
      editingMultiline = false;
      draft = value;
      (event.currentTarget as HTMLElement).blur();
      event.preventDefault();
      return;
    }

    if (event.key === "Enter" && event.shiftKey && !useMultiline) {
      event.preventDefault();
      insertNewlineAtCursor(event);
      return;
    }

    if (event.key === "Enter" && !useMultiline) {
      commit();
      onNavigate?.("down");
      event.preventDefault();
      return;
    }

    if (event.key === "Tab") {
      commit();
      onNavigate?.(event.shiftKey ? "prev" : "next");
      event.preventDefault();
    }
  }
</script>

{#if editing}
  {#if useMultiline}
    <textarea
      bind:this={inputEl}
      class={cn("csv-cell__input csv-cell__input--multiline", className)}
      bind:value={draft}
      onblur={commit}
      onkeydown={handleKeydown}
    ></textarea>
  {:else}
    <input
      bind:this={inputEl}
      class={cn("csv-cell__input", className)}
      type="text"
      bind:value={draft}
      onblur={commit}
      onkeydown={handleKeydown}
    />
  {/if}
{:else}
  <button
    type="button"
    class={cn(
      "csv-cell__display",
      multiline && "csv-cell__display--multiline",
      className,
    )}
    title={value}
    onclick={startEditing}
    ondblclick={startEditing}
  >
    {value || "\u00a0"}
  </button>
{/if}
