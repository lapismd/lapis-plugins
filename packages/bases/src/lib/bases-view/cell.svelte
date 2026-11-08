<script lang="ts">
  import { DateTime } from "luxon";
  import { type DType } from "peaql";
  import type { HTMLAttributes } from "svelte/elements";
  import DatetimeWidget from "./components/datetime.svelte";
  import { cn, TFile, type App, type MetadataType } from "@lapis-notes/api";
  import { normalizeMetadataValue } from "@lapis-notes/api/metadata-value";
  import { TagList } from "@lapismd/design-core/shadcn/tag-list";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import Pencil from "@lucide/svelte/icons/pencil";
  import { collectMetadataSuggestions } from "./cell-editor-options";
  import CellEditor from "./cell-editor.svelte";
  import { set, unset } from "lodash-es";
  import { tick, untrack } from "svelte";
  import { Icon } from "./functions";
  import { Icon as IconComponent } from "@lapis-notes/api/icon";
  import File from "./components/file.svelte";
  import Tag from "./components/tag-chip.svelte";
  import type { Value } from "@lapis-notes/api";
  let {
    app,
    file,
    type,
    name,
    value: cellValue,
    readOnly = false,
    editOnActivation = false,
    label = name.startsWith("note.") ? name.slice(5) : name,
    class: className,
    meta,
    ...rest
  }: HTMLAttributes<HTMLDivElement> & {
    name: string;
    app: App;
    type: string | DType;
    value: Value | null | unknown;
    file: TFile;
    readOnly?: boolean;
    editOnActivation?: boolean;
    label?: string;
    meta?: unknown;
  } = $props();

  let displayType = $derived(String(type ?? ""));
  let value = $derived(
    cellValue instanceof Object && "value" in cellValue
      ? (cellValue as Value).value
      : (cellValue ?? ""),
  );

  const descriptionId = $props.id();
  let editing = $state(false);
  let cancelled = false;
  let cellElement = $state<HTMLDivElement>();
  let activateButton = $state<HTMLButtonElement>();
  const writable = $derived(
    !readOnly &&
      !(
        name.startsWith("file.") ||
        name.startsWith("formula.") ||
        name === "file"
      ),
  );

  const tagItems = $derived(
    collectMetadataSuggestions([value], true).map((tag) => ({
      id: tag,
      label: tag.startsWith("#") ? tag : `#${tag}`,
      tone: "accent" as const,
      onClick: writable
        ? () => {
            void activate();
          }
        : undefined,
    })),
  );

  async function activate() {
    cancelled = false;
    editing = true;
    await tick();
    const input = cellElement?.querySelector<HTMLInputElement>(
      'input, textarea, [contenteditable="true"]',
    );
    input?.focus();
    if (input?.type === "text") input.select();
  }

  function cancelDraft(event: KeyboardEvent) {
    if (!editOnActivation || !editing || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    cancelled = true;
    editing = false;
    void tick().then(() => activateButton?.focus());
  }

  function finishEditing(event: FocusEvent) {
    if (!editOnActivation || !editing) return;
    // Replacing the focused activation button is not an editor dismissal.
    if (
      !(event.target instanceof Element) ||
      !event.target.closest('[data-ui-component="bases-cell-editor"]')
    )
      return;
    const next = event.relatedTarget;
    if (
      next instanceof Element &&
      (cellElement?.contains(next) ||
        next.closest('[role="listbox"], [role="option"]'))
    )
      return;
    // Child blur handlers keep their existing per-type commit semantics.
    queueMicrotask(() => {
      editing = false;
    });
  }

  function displayValue() {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ") || "—";
    return String(value);
  }
  function focusElement(evt: Event) {
    const target = evt.target;
    if (!(target instanceof HTMLElement) || target.closest("button")) return;
    const cell = evt.currentTarget;
    if (!(cell instanceof HTMLElement)) return;
    cell.querySelector("input")?.focus();
  }

  function metadataTypeFromDisplayType(displayType: string): MetadataType {
    switch (displayType.toLowerCase()) {
      case "boolean":
      case "checkbox":
        return "checkbox";
      case "number":
        return "number";
      case "date":
        return "date";
      case "datetime":
      case "timestamp":
        return "datetime";
      case "multitext":
        return "multitext";
      case "tags":
        return "tags";
      case "aliases":
        return "aliases";
      case "array":
        return "array";
      case "object":
        return "object";
      default:
        return "text";
    }
  }

  function onValueChange(name: string, value: any) {
    if (editOnActivation && cancelled) return;
    if (name.startsWith("file.") || name.startsWith("formula.")) return;
    untrack(() => {
      if (file) {
        const id = name.startsWith("note.") ? name.substring(5) : name;
        const declaredType =
          app.metadataTypeManager.types[id]?.type ??
          metadataTypeFromDisplayType(displayType);
        const normalized = normalizeMetadataValue(declaredType, value);
        const existing =
          cellValue instanceof Object && "value" in cellValue
            ? (cellValue as Value).value
            : "";
        if (existing === normalized) return;
        app.fileManager.processFrontMatter(file, (data) => {
          if (normalized === null || normalized === undefined) {
            unset(data, id);
          } else {
            set(data, id, normalized);
          }
        });
      }
    });
  }
</script>

{#snippet renderedValue()}
  {#if file && name === "file.name"}
    <File {app} {file} />
  {:else if name === "file.tags"}
    <div
      class="markdown-rendered bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-gap-2-77a2a2"
    >
      {#each Array.isArray(value) ? value : [] as tag}
        <Tag name={tag} />
      {/each}
    </div>
  {:else if value instanceof TFile}
    <File {app} file={value} />
  {:else if value instanceof DateTime}
    <DatetimeWidget {value} />
  {:else if value instanceof Icon}
    <IconComponent name={[value.name, "circle-question-mark"]} />
  {:else}
    <div
      class={cn(
        "bases-style-h-full-668b21 bases-style-w-full-6da6a3",
        editOnActivation && "bases-cell__display",
      )}
    >
      {editOnActivation ? displayValue() : value}
    </div>
  {/if}
{/snippet}

<div
  {...rest}
  bind:this={cellElement}
  onkeydowncapture={cancelDraft}
  onfocusout={finishEditing}
  class={cn("bases-style-h-full-668b21 bases-style-w-full-6da6a3", className)}
  onclick={(evt) => focusElement(evt)}
  data-ui-component="bases-cell"
  data-ui-part="root"
  data-type={displayType}
  data-property={name}
>
  {#if writable && (!editOnActivation || editing)}
    <CellEditor {app} {onValueChange} {value} {name} type={displayType} />
  {:else if editOnActivation && (displayType === "tags" || name === "file.tags")}
    <div class="bases-cell__tags">
      <TagList tags={tagItems} {label} class="bases-cell__tag-list" />
      {#if writable}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Edit ${label}`}
          onclick={activate}><Pencil aria-hidden="true" /></Button
        >
      {/if}
    </div>
  {:else if writable && editOnActivation}
    <button
      bind:this={activateButton}
      type="button"
      class="bases-cell__activate"
      aria-label={`Edit ${label}`}
      aria-describedby={descriptionId}
      title={displayValue()}
      onclick={activate}
    >
      <span class="bases-cell__display"
        >{value instanceof DateTime
          ? value.toLocaleString(DateTime.DATE_MED)
          : displayValue()}</span
      >
    </button>
    <span id={descriptionId} hidden>{displayValue()}</span>
  {:else}
    {@render renderedValue()}
  {/if}
</div>
