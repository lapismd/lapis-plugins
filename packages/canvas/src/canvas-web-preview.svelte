<script lang="ts">
  import { describeCanvasWebsite } from "./lib/canvas-web-card";
  import { canvasWebUrl } from "./lib/canvas-web-url";
  let { url }: { url: string } = $props();
  const address = $derived(canvasWebUrl(url));
  const website = $derived(describeCanvasWebsite(url));
  const host = $derived(address ? new URL(address).host : "");
  let preview = $state(false);
  let loaded = $state(false);
  let failed = $state(false);
  $effect(() => { void url; preview = false; loaded = false; failed = false; });
  function mountFrame(container: HTMLDivElement, source: string) {
    const frame = container.ownerDocument.createElement("iframe");
    // Establish the ephemeral context before insertion can start navigation.
    frame.setAttribute("credentialless", "");
    frame.setAttribute("sandbox", "allow-scripts allow-forms allow-popups");
    frame.referrerPolicy = "no-referrer";
    frame.loading = "lazy";
    frame.allow = "camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; payment 'none'; usb 'none'";
    frame.title = `Web preview: ${new URL(source).host}`;
    frame.onload = () => { loaded = true; };
    frame.onerror = () => { failed = true; };
    frame.src = source;
    container.appendChild(frame);
    return { destroy() { frame.onload = null; frame.onerror = null; frame.remove(); } };
  }
</script>

<div class="canvas-web-card nodrag nopan nowheel" data-canvas-web-card>
  {#if address}
    <p class="canvas-web-title">{website?.title ?? host}</p>
    <p class="canvas-web-host">{host}</p>
    <div class="canvas-web-actions">
      <a href={address} target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" aria-label="Open link" title={`Open ${host}`}>{url}</a>
      <button type="button" aria-expanded={preview} onclick={() => { preview = !preview; loaded = false; failed = false; }}>{preview ? "Close preview" : "Load web preview"}</button>
    </div>
    {#if preview}
      {#if !failed}
        {#key address}
          <div class="canvas-web-frame" use:mountFrame={address}></div>
        {/key}
      {/if}
      <p class="canvas-web-fallback" role="status">{failed ? "The preview could not load. Open the link to visit the site." : loaded ? "If the site blocks previews, open the link to visit it." : "Loading preview. You can also open the link to visit the site."}</p>
    {:else}
      <p>Load a preview to connect to this website.</p>
    {/if}
  {:else}
    <p class="canvas-web-invalid" role="note">Use an absolute HTTP or HTTPS web address.</p>
    <span class="canvas-web-address">{url}</span>
  {/if}
</div>

<style>
  .canvas-web-card { width: 100%; min-width: 0; font-size: 12px; color: inherit; }
  .canvas-web-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  a { color: inherit; text-decoration: underline; overflow-wrap: anywhere; }
  button { min-height: 36px; padding: 6px 8px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 5px; background: var(--canvas-readable-surface, var(--background-primary)); color: var(--canvas-readable-text, var(--text-normal)); font: inherit; cursor: pointer; }
  :is(button, a):focus-visible { outline: 2px solid var(--canvas-readable-indicator, var(--interactive-accent)); outline-offset: 2px; }
  .canvas-web-frame :global(iframe) { display: block; width: 100%; min-height: 160px; margin-top: 8px; border: 1px solid var(--canvas-readable-indicator, var(--background-modifier-border)); border-radius: 5px; background: white; }
  .canvas-web-title { font-size: 1rem; font-weight: 600; }
  .canvas-web-host { font-size: 12px; }
  p { margin: 6px 0 0; line-height: 1.4; }
  .canvas-web-address { display: block; margin-top: 6px; overflow-wrap: anywhere; }
  @media (pointer: coarse) { button, a { min-height: 44px; } a { display: inline-flex; align-items: center; } }
</style>
