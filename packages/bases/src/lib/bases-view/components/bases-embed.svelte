<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import BasesComponent from "../view.svelte";
  import type { BasesDocument } from "../models";
  import type { BasesViewRegistration } from "../bases.svelte";

  let {
    app,
    document,
    registrations,
    fileName,
  }: {
    app: App;
    document: BasesDocument;
    registrations: ReadonlyMap<string, BasesViewRegistration>;
    fileName?: string;
  } = $props();
</script>

<div class="bases-embed">
  <BasesComponent {app} {document} {registrations} readOnly showHeader />
  {#if fileName}
    <Badge variant="secondary" class="bases-embed__file-chip">
      <span class="bases-embed__file-name">{fileName}</span>
    </Badge>
  {/if}
</div>
