<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import { setSearchQuery } from "@codemirror/search";
  import type { EditorView } from "@codemirror/view";
  import { cn } from "@lapis-notes/ui";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import CaseSensitive from "@lucide/svelte/icons/case-sensitive";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Regex from "@lucide/svelte/icons/regex";
  import Replace from "@lucide/svelte/icons/replace";
  import ReplaceAll from "@lucide/svelte/icons/replace-all";
  import SearchIcon from "@lucide/svelte/icons/search";
  import WholeWord from "@lucide/svelte/icons/whole-word";
  import X from "@lucide/svelte/icons/x";
  import {
    csvCellMatches,
    csvDocumentMatches,
    csvSearchQuery,
    replaceCellText,
    searchReplacement,
    type CsvCellMatch,
  } from "../model/csv-search";
  import "../../styles/csv-find.css";

  type CellEdit = { row: number; col: number; value: string };

  let {
    open = $bindable(false),
    searchRequest = 0,
    rows = [],
    editor = null,
    revision = 0,
    searchValue = $bindable(""),
    replaceValue = $bindable(""),
    caseSensitive = $bindable(false),
    wholeWord = $bindable(false),
    regexp = $bindable(false),
    active = $bindable(0),
    onReplaceCells,
  }: {
    open?: boolean;
    searchRequest?: number;
    rows?: readonly (readonly string[])[];
    editor?: EditorView | null;
    revision?: number;
    searchValue?: string;
    replaceValue?: string;
    caseSensitive?: boolean;
    wholeWord?: boolean;
    regexp?: boolean;
    active?: number;
    onReplaceCells?: (edits: CellEdit[]) => void;
  } = $props();

  let replaceOpen = $state(false);

  const canReplace = $derived(editor != null || onReplaceCells != null);

  function readQuery() {
    return csvSearchQuery({
      search: searchValue,
      replace: replaceValue,
      caseSensitive,
      wholeWord,
      regexp,
    });
  }

  const tableMatches = $derived.by(() => {
    if (editor) return [];
    return csvCellMatches(rows, readQuery());
  });
  const sourceMatches = $derived.by(() => {
    if (!editor) return [];
    void revision;
    return csvDocumentMatches(editor.state.doc, readQuery());
  });
  const matchCount = $derived(
    editor ? sourceMatches.length : tableMatches.length,
  );
  const currentIndex = $derived(
    matchCount === 0 ? 0 : Math.min(active, matchCount - 1),
  );
  const noMatches = $derived(
    Boolean(searchValue) && (!readQuery().valid || matchCount === 0),
  );
  const status = $derived(
    !searchValue
      ? ""
      : noMatches
        ? "No matches"
        : `${currentIndex + 1} of ${matchCount}`,
  );

  function close() {
    open = false;
  }

  function move(delta: number) {
    if (matchCount === 0) return;
    active = (currentIndex + delta + matchCount) % matchCount;
  }

  function replaceTable(list: readonly CsvCellMatch[]) {
    if (!onReplaceCells || list.length === 0) return;
    const query = readQuery();
    const groups: Record<string, CsvCellMatch[]> = {};
    for (const match of list) {
      const key = `${match.row}:${match.col}`;
      const group = groups[key] ?? [];
      group.push(match);
      groups[key] = group;
    }
    const edits: CellEdit[] = [];
    for (const group of Object.values(groups)) {
      const first = group[0];
      if (!first) continue;
      const cell = rows[first.row]?.[first.col] ?? "";
      edits.push({
        row: first.row,
        col: first.col,
        value: replaceCellText(cell, group, query),
      });
    }
    onReplaceCells(edits);
  }

  function replaceSource(list: readonly { from: number; to: number }[]) {
    const view = editor;
    if (!view || list.length === 0) return;
    const query = readQuery();
    view.dispatch({
      changes: [...list]
        .sort((left, right) => right.from - left.from)
        .map((match) => ({
          from: match.from,
          to: match.to,
          insert: searchReplacement(
            query,
            view.state.sliceDoc(match.from, match.to),
          ),
        })),
    });
  }

  function replaceCurrent() {
    if (editor) {
      const match = sourceMatches[currentIndex];
      if (match) replaceSource([match]);
      return;
    }
    const match = tableMatches[currentIndex];
    if (match) replaceTable([match]);
  }

  function replaceAll() {
    if (editor) {
      replaceSource(sourceMatches);
      return;
    }
    replaceTable(tableMatches);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    move(event.shiftKey ? -1 : 1);
  }

  const sourcePaintKey = $derived(
    editor
      ? [
          revision,
          open ? 1 : 0,
          searchValue,
          replaceValue,
          caseSensitive ? 1 : 0,
          wholeWord ? 1 : 0,
          regexp ? 1 : 0,
          active,
        ].join("\u0000")
      : "table",
  );

  const paintSource: Attachment<HTMLElement> = () => {
    const view = editor;
    if (!view) return;
    const query = readQuery();
    const shown = open;
    const index = currentIndex;
    view.dispatch({
      effects: setSearchQuery.of(shown ? query : csvSearchQuery({ search: "" })),
    });
    if (!shown) return;
    const list = csvDocumentMatches(view.state.doc, query);
    const match = list[index];
    if (!match) return;
    const selection = view.state.selection.main;
    if (selection.from === match.from && selection.to === match.to) return;
    view.dispatch({
      selection: { anchor: match.from, head: match.to },
      scrollIntoView: true,
    });
  };

  const focusSearchField: Attachment<HTMLInputElement> = (node) => {
    node.focus();
    node.select();
  };
</script>

{#key sourcePaintKey}
  <span hidden {@attach paintSource}></span>
{/key}

{#if open}
  <search class="ui-transcript-search" data-csv-find>
    <div class="ui-transcript-search__body">
      {#if canReplace}
        <button
          type="button"
          class="ui-transcript-search__button"
          aria-label="Toggle replace"
          aria-expanded={replaceOpen}
          title="Toggle replace"
          onclick={() => (replaceOpen = !replaceOpen)}
        >
          {#if replaceOpen}
            <ChevronDown size={16} aria-hidden="true" />
          {:else}
            <ChevronRight size={16} aria-hidden="true" />
          {/if}
        </button>
      {/if}
      <div class="ui-transcript-search__fields">
        <div class="ui-transcript-search__row">
          <div
            class={cn("ui-transcript-search__field", {
              "ui-transcript-search__field--invalid": noMatches,
            })}
          >
            <span class="ui-transcript-search__find-icon">
              <SearchIcon size={16} aria-hidden="true" />
            </span>
            {#key searchRequest}
              <input
                {@attach focusSearchField}
                class="ui-transcript-search__input"
                type="text"
                placeholder="Find"
                aria-label="Find"
                aria-invalid={noMatches}
                value={searchValue}
                onkeydown={onKeydown}
                oninput={(event) => {
                  searchValue = event.currentTarget.value;
                  active = 0;
                }}
              />
            {/key}
            {#if status}
              <span class="ui-transcript-search__count">{status}</span>
            {/if}
            <div
              class="ui-transcript-search__options"
              role="group"
              aria-label="Search options"
            >
              <button
                type="button"
                class={cn(
                  "ui-transcript-search__button ui-transcript-search__toggle",
                  { "ui-transcript-search__button--active": caseSensitive },
                )}
                aria-label="Case sensitive"
                aria-pressed={caseSensitive}
                title="Case sensitive"
                onclick={() => (caseSensitive = !caseSensitive)}
              >
                <CaseSensitive size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                class={cn(
                  "ui-transcript-search__button ui-transcript-search__toggle",
                  { "ui-transcript-search__button--active": wholeWord },
                )}
                aria-label="Match whole word"
                aria-pressed={wholeWord}
                title="Match whole word"
                onclick={() => (wholeWord = !wholeWord)}
              >
                <WholeWord size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                class={cn(
                  "ui-transcript-search__button ui-transcript-search__toggle",
                  { "ui-transcript-search__button--active": regexp },
                )}
                aria-label="Use regular expression"
                aria-pressed={regexp}
                title="Use regular expression"
                onclick={() => (regexp = !regexp)}
              >
                <Regex size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <button
            type="button"
            class="ui-transcript-search__button"
            aria-label="Previous match"
            title="Previous match"
            onclick={() => move(-1)}
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            class="ui-transcript-search__button"
            aria-label="Next match"
            title="Next match"
            onclick={() => move(1)}
          >
            <ArrowDown size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            class="ui-transcript-search__button"
            aria-label="Close search"
            title="Close search"
            onclick={close}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {#if replaceOpen && canReplace}
          <div
            class="ui-transcript-search__row ui-transcript-search__replace-row"
          >
            <input
              class="ui-transcript-search__input ui-transcript-search__replace-input"
              type="text"
              placeholder="Replace"
              aria-label="Replace"
              value={replaceValue}
              onkeydown={onKeydown}
              oninput={(event) => (replaceValue = event.currentTarget.value)}
            />
            <button
              type="button"
              class="ui-transcript-search__button"
              aria-label="Replace match"
              title="Replace match"
              onclick={replaceCurrent}
            >
              <Replace size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              class="ui-transcript-search__button"
              aria-label="Replace all matches"
              title="Replace all"
              onclick={replaceAll}
            >
              <ReplaceAll size={16} aria-hidden="true" />
            </button>
          </div>
        {/if}
      </div>
    </div>
    <span class="ui-transcript-search__status" role="status">{status}</span>
  </search>
{/if}
