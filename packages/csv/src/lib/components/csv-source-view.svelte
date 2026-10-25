<script lang="ts">
  import { EditorState } from "@codemirror/state";
  import { EditorView } from "@codemirror/view";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { App, TFile } from "@lapis-notes/api";
  import TableIcon from "@lucide/svelte/icons/table";
  import type { Attachment } from "svelte/attachments";
  import { csvSourceExtensions } from "../codemirror/csv-source-extensions";

  let {
    app,
    file,
    onShowTable,
  }: {
    app: App;
    file: TFile;
    onShowTable: () => void;
  } = $props();

  const mountEditor: Attachment<HTMLDivElement> = (parent) => {
    let view: EditorView | null = null;
    let disposed = false;
    let writing = false;
    void app.vault.cachedRead(file).then((text) => {
      if (disposed) return;
      view = new EditorView({
        parent,
        state: EditorState.create({
          doc: text,
          extensions: [
            ...csvSourceExtensions(),
            EditorView.updateListener.of((update) => {
              if (!update.docChanged || writing) return;
              writing = true;
              const next = update.state.doc.toString();
              void app.vault.modify(file, next).finally(() => {
                writing = false;
              });
            }),
          ],
        }),
      });
    });
    return () => {
      disposed = true;
      view?.destroy();
    };
  };
</script>

<div class="csv-source-pane" data-testid="csv-source" data-csv-role="source">
  <div class="csv-source-pane__toolbar">
    <Button
      variant="ghost"
      size="icon"
      class="csv-source-pane__table"
      aria-label="View CSV table"
      onclick={onShowTable}
    >
      <TableIcon />
    </Button>
  </div>
  <div class="csv-source-pane__editor" {@attach mountEditor}></div>
</div>
