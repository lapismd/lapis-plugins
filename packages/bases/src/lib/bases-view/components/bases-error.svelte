<script lang="ts">
  import * as Alert from "@lapismd/design-core/shadcn/alert";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";

  let { message }: { message: string } = $props();
</script>

<div class="bases-view-error-container">
  <Alert.Root variant="destructive" class="bases-view-error">
    <CircleAlert aria-hidden="true" />
    <Alert.Title>Unable to render base</Alert.Title>
    <Alert.Description>
      <p class="bases-view-error__message">{message}</p>
    </Alert.Description>
  </Alert.Root>
</div>

<style>
  .bases-view-error-container {
    margin: 1rem;
  }
  .bases-view-error__message {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
