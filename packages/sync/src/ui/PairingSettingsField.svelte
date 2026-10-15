<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import type { IScannerControls } from "@zxing/browser";
  import CameraIcon from "@lucide/svelte/icons/camera";
  import CameraOffIcon from "@lucide/svelte/icons/camera-off";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import { pairingQrDataUrl, scanPairingQr } from "../pairing-qr";
  import type { PairingSettingsValue } from "../settings/field-values";
  import "./controlled-settings-fields.css";

  let {
    value,
    setValue,
    disabled = false,
    readOnly = false,
    busy = false,
    error,
  }: WorkspaceCustomSettingProps<PairingSettingsValue> = $props();

  let qrDataUrl = $state("");
  let video = $state<HTMLVideoElement | null>(null);
  let scanner: IScannerControls | null = null;
  let destroyed = false;
  let scanGeneration = 0;
  let qrError = $state<string | null>(null);

  $effect(() => {
    const invitation = value.invitationUri;
    qrDataUrl = "";
    qrError = null;
    if (!invitation) return;
    let cancelled = false;
    void pairingQrDataUrl(invitation)
      .then((url) => {
        if (!cancelled) qrDataUrl = url;
      })
      .catch((caught) => {
        if (!cancelled)
          qrError =
            caught instanceof Error
              ? caught.message
              : "Unable to create pairing QR code.";
      });
    return () => {
      cancelled = true;
    };
  });

  onDestroy(() => {
    destroyed = true;
    scanGeneration++;
    scanner?.stop();
  });

  async function patch(next: Partial<PairingSettingsValue>) {
    if (!destroyed) await setValue({ ...value, ...next });
  }

  async function startCamera() {
    const generation = ++scanGeneration;
    await patch({ cameraActive: true, error: null, stage: "scan" });
    await tick();
    if (destroyed || generation !== scanGeneration) return;
    if (!video) {
      await patch({
        cameraActive: false,
        error: "Camera preview is unavailable",
      });
      return;
    }
    scanner?.stop();
    try {
      let found = false;
      const controls = await scanPairingQr(
        video,
        (invitationInput) => {
          if (destroyed || generation !== scanGeneration) return;
          found = true;
          scanner?.stop();
          scanner = null;
          void patch({ invitationInput, cameraActive: false, error: null });
        },
        (scanError) => {
          if (!destroyed && generation === scanGeneration)
            void patch({ error: scanError.message });
        },
      );
      if (found || destroyed || generation !== scanGeneration) controls.stop();
      else scanner = controls;
    } catch (caught) {
      if (destroyed || generation !== scanGeneration) return;
      await patch({
        cameraActive: false,
        error:
          caught instanceof Error
            ? `Camera unavailable: ${caught.message}`
            : "Camera access was denied",
      });
    }
  }

  async function stopCamera() {
    scanGeneration++;
    scanner?.stop();
    scanner = null;
    await patch({ cameraActive: false });
  }
</script>

<div class="sync-controlled-field" data-stage={value.stage} aria-busy={busy}>
  {#if value.invitationUri}
    <div class="sync-pairing-qr">
      {#if qrDataUrl}
        <img src={qrDataUrl} alt="QR code for this pairing invitation" />
      {:else}
        <div class="sync-pairing-qr__placeholder">Preparing QR code…</div>
      {/if}
      <Textarea
        aria-label="Pairing invitation"
        value={value.invitationUri}
        readonly
        rows={3}
      />
    </div>
  {/if}

  {#if value.session?.sas}
    <output class="sync-pairing-sas" aria-label="Pairing security code">
      {value.session.sas}
    </output>
    <p>
      Confirm this six-digit code on both devices before transferring access.
    </p>
  {/if}

  <label>
    <span>Invitation URL</span>
    <Textarea
      value={value.invitationInput}
      disabled={disabled || readOnly}
      placeholder="Paste a lapis://sync-pair invitation"
      rows={3}
      oninput={(event) =>
        void patch({ invitationInput: event.currentTarget.value })}
    />
  </label>

  <div class="sync-controlled-field__actions">
    {#if value.cameraActive}
      <Button variant="outline" onclick={() => void stopCamera()}>
        <CameraOffIcon data-icon="inline-start" />
        Stop camera
      </Button>
    {:else}
      <Button
        variant="outline"
        disabled={disabled || readOnly || busy}
        onclick={() => void startCamera()}
      >
        <CameraIcon data-icon="inline-start" />
        Scan QR code</Button
      >
    {/if}
  </div>

  {#if value.cameraActive}
    <video bind:this={video} class="sync-pairing-camera" muted playsinline>
      <track kind="captions" />
    </video>
  {/if}

  {#if error || value.error || qrError}
    <p class="sync-controlled-field__error" role="alert">
      {error ?? value.error ?? qrError}
    </p>
  {/if}
</div>
