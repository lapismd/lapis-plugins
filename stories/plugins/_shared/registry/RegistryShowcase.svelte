<script lang="ts">
  import type { RegistryShowcaseModel } from "./registry-showcases";

  let { model }: { model: RegistryShowcaseModel } = $props();

  const navigation = ["Notes", "Projects", "References", "Archive"];
  const listRows = ["Daily notes", "Project atlas", "Reading queue", "Ideas"];
  const searchRows = [
    ["Welcome to Lapis", "Notes/Welcome.md"],
    ["Project atlas", "Projects/Atlas.md"],
    ["Registry design", "Notes/Registry.md"],
  ];
</script>

<div
  class="registry-showcase"
  style={`--showcase-accent: ${model.accent}`}
  data-registry-showcase
  data-plugin-id={model.pluginId}
>
  <div class="ambient ambient--one"></div>
  <div class="ambient ambient--two"></div>

  <header class="showcase-header">
    <div class="showcase-brand"><span>L</span><strong>Lapis</strong></div>
    <div class="showcase-location">Plugin Registry&nbsp; / &nbsp;{model.name}</div>
    <div class="showcase-status"><i></i> Official plugin</div>
  </header>

  <main class="showcase-main">
    <section class="app-window" aria-label={`${model.name} preview`}>
      <div class="window-bar">
        <div class="window-dots"><i></i><i></i><i></i></div>
        <div class="window-title">{model.previewTitle}</div>
        <div class="window-actions"><span></span><span></span></div>
      </div>
      <div class="window-body">
        <aside class="window-sidebar">
          <div class="sidebar-search"></div>
          {#each navigation as item, index}
            <div class:active={index === 1} class="sidebar-row">
              <i></i><span>{item}</span>
            </div>
          {/each}
          <div class="sidebar-footer"><i></i><i></i><i></i></div>
        </aside>

        <div class="preview-surface">
          <div class="preview-toolbar">
            <strong>{model.previewTitle}</strong>
            <div><span></span><span></span><span></span></div>
          </div>

          {#if model.kind === "chat"}
            <div class="chat-preview">
              <div class="chat-message chat-message--user">Summarise the decisions in my project notes.</div>
              <div class="chat-message chat-message--assistant">
                <b>Three decisions found</b>
                <p>The registry will mirror signed media, keep icon fallbacks, and use governed previews.</p>
                <div class="tool-pill">✓ Searched 18 notes</div>
              </div>
              <div class="chat-composer">Ask your workspace… <span>↑</span></div>
            </div>
          {:else if model.kind === "table"}
            <div class="table-preview">
              <div class="table-filter">Status is <b>Active</b><span>＋ Filter</span></div>
              <div class="table-grid table-grid--head"><b>Project</b><b>Status</b><b>Owner</b><b>Updated</b></div>
              {#each ["Registry", "Desktop", "Knowledge base", "Design system"] as row, index}
                <div class="table-grid"><span>{row}</span><em>{index === 2 ? "Review" : "Active"}</em><span>{index % 2 ? "Mira" : "Lapis"}</span><small>{index + 2}d</small></div>
              {/each}
            </div>
          {:else if model.kind === "graph"}
            <div class="graph-preview">
              <svg viewBox="0 0 620 430" aria-hidden="true">
                <g class="edges"><path d="M110 238 236 128 345 225 486 112M236 128 282 340 345 225 514 318M110 238 282 340M486 112 514 318"></path></g>
                <g class="nodes"><circle cx="110" cy="238" r="25"></circle><circle cx="236" cy="128" r="33"></circle><circle cx="345" cy="225" r="43" class="primary"></circle><circle cx="486" cy="112" r="24"></circle><circle cx="282" cy="340" r="28"></circle><circle cx="514" cy="318" r="30"></circle></g>
                <g class="labels"><text x="316" y="229">Registry</text><text x="210" y="83">Plugins</text><text x="462" y="72">Notes</text><text x="254" y="392">Specs</text><text x="491" y="373">Media</text></g>
              </svg>
              <div class="graph-legend"><span>Notes 42</span><span>Links 87</span><span>Tags 16</span></div>
            </div>
          {:else if model.kind === "history"}
            <div class="history-preview">
              <div class="revision-list">
                <b>Today</b>
                {#each ["17:42", "16:18", "14:03", "09:27"] as time, index}
                  <div class:active={index === 1}><i></i><span>{time}<small>{index ? "Autosave" : "Current"}</small></span></div>
                {/each}
              </div>
              <div class="diff-preview"><div class="diff-title">Revision comparison</div><p>Build a signed plugin registry with</p><p class="removed">- category-only placeholders</p><p class="added">+ distinct plugin identities</p><p class="added">+ governed showcase images</p><p>and verified source metadata.</p></div>
            </div>
          {:else if model.kind === "search"}
            <div class="search-preview">
              <div class="search-box">plugin registry <kbd>⌘ K</kbd></div>
              <div class="facet-row"><span>Markdown</span><span>Modified this month</span><span>3 results</span></div>
              {#each searchRows as row, index}
                <div class:active={index === 1} class="search-result"><i></i><div><b>{row[0]}</b><small>{row[1]}</small><p>…signed <mark>plugin registry</mark> metadata and assets…</p></div></div>
              {/each}
            </div>
          {:else if model.kind === "diagnostics"}
            <div class="diagnostics-preview">
              <div class="editor-lines">
                <span>01</span><p># A clearer writing workflow</p><span>02</span><p></p><span>03</span><p>Keep every <u>plugin</u> focused and easy to discover.</p><span>04</span><p>Use helpful metadata, <u class="warn">previews</u>, and trusted releases.</p><span>05</span><p></p><span>06</span><p>Ship changes with confidence.</p>
              </div>
              <div class="problems"><b>Problems <em>2</em></b><div><i></i><span>Consider a more specific phrase<small>Line 3 · style</small></span></div><div><i></i><span>Preview wording can be clearer<small>Line 4 · suggestion</small></span></div></div>
            </div>
          {:else if model.kind === "writing"}
            <div class="writing-preview">
              <article><h2>A calm place for connected work</h2><p>Lapis keeps notes, tasks, and ideas close without hiding the files that make them yours.</p><p>Write in Markdown, shape focused workflows, and extend the workspace with trusted plugins.</p><blockquote>Make the useful path the obvious path.</blockquote></article>
              <div class="writing-stats"><div><strong>248</strong><span>words</span></div><div><strong>1,462</strong><span>characters</span></div><div><strong>2 min</strong><span>reading time</span></div></div>
            </div>
          {:else if model.kind === "editor"}
            <div class="editor-preview">
              <div class="editor-gutter">{#each Array(12) as _, index}<span>{String(index + 1).padStart(2, "0")}</span>{/each}</div>
              <div class="editor-code"><p><b>{model.pluginId.includes("source") ? "{" : "# Welcome to Lapis"}</b></p><p class="muted">{model.pluginId.includes("source") ? '  "registry": {' : ""}</p><p><i>{model.pluginId.includes("source") ? '    "signed": true,' : "A workspace for connected thinking."}</i></p><p><i>{model.pluginId.includes("source") ? '    "media": "verified"' : ""}</i></p><p class="muted">{model.pluginId.includes("source") ? "  }" : "## Plugin registry"}</p><p>{model.pluginId.includes("source") ? "}" : "Discover trusted tools with clear identities and useful previews."}</p><div class="editor-caret"></div></div>
              <div class="editor-minimap"></div>
            </div>
          {:else}
            <div class="list-preview">
              <div class="list-heading"><b>{model.previewTitle}</b><span>＋</span></div>
              {#each listRows as row, index}<div class:active={index === 1} class="list-row"><i></i><span>{row}<small>{index % 2 ? "Saved search" : "Note"}</small></span><b>⋯</b></div>{/each}
            </div>
          {/if}
        </div>
      </div>
    </section>

    <aside class="showcase-copy">
      <div class="identity-mark">{model.mark}</div>
      <p class="showcase-eyebrow">First-party Lapis plugin</p>
      <h1>{model.name}</h1>
      <p class="showcase-description">{model.description}</p>
      <div class="feature-list">
        {#each model.features as feature, index}
          <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{feature}</strong></div>
        {/each}
      </div>
      <div class="showcase-signature"><i></i> Signed metadata · Web and desktop</div>
    </aside>
  </main>
</div>

<style>
  :global(html:has([data-registry-showcase])), :global(body:has([data-registry-showcase])) { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #111113; }
  :global(body.sb-main-fullscreen:has([data-registry-showcase]) #storybook-root) { width: 100vw; height: 100vh; padding: 0 !important; }
  :global(*) { box-sizing: border-box; }
  .registry-showcase { position: relative; width: 100%; height: 100%; min-width: 1000px; min-height: 667px; overflow: hidden; padding: 28px 38px 36px; background: radial-gradient(circle at 10% 5%, color-mix(in srgb, var(--showcase-accent) 24%, transparent), transparent 34%), linear-gradient(145deg, #121214 0%, #18171d 56%, #101012 100%); color: #f7f7f8; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .ambient { position: absolute; border-radius: 999px; filter: blur(70px); opacity: .14; background: var(--showcase-accent); }
  .ambient--one { width: 360px; height: 360px; right: -110px; top: 100px; }
  .ambient--two { width: 260px; height: 260px; left: 44%; bottom: -190px; }
  .showcase-header { position: relative; z-index: 1; display: grid; grid-template-columns: 170px 1fr auto; align-items: center; height: 36px; color: #96939e; font-size: 12px; letter-spacing: .01em; }
  .showcase-brand { display: flex; align-items: center; gap: 9px; color: #f4f3f7; font-size: 15px; }
  .showcase-brand > span { display: grid; width: 27px; height: 27px; place-items: center; border: 1px solid color-mix(in srgb, var(--showcase-accent) 64%, #fff); border-radius: 8px; background: color-mix(in srgb, var(--showcase-accent) 22%, #1a191f); color: #fff; font-size: 13px; }
  .showcase-location { text-align: center; }
  .showcase-status { display: flex; align-items: center; gap: 7px; }
  .showcase-status i, .showcase-signature i { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 14px rgba(74,222,128,.5); }
  .showcase-main { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.62fr) minmax(270px, .78fr); gap: 42px; align-items: center; height: calc(100% - 36px); padding-top: 24px; }
  .app-window { height: min(620px, 100%); overflow: hidden; border: 1px solid rgba(255,255,255,.11); border-radius: 18px; background: #1b1a1f; box-shadow: 0 34px 90px rgba(0,0,0,.48), inset 0 1px rgba(255,255,255,.06); transform: perspective(1600px) rotateY(1.2deg); transform-origin: left center; }
  .window-bar { display: grid; grid-template-columns: 80px 1fr 80px; align-items: center; height: 44px; border-bottom: 1px solid #2d2b32; padding: 0 14px; background: #211f25; }
  .window-dots { display: flex; gap: 6px; }.window-dots i { width: 8px; height: 8px; border-radius: 50%; background: #4a4750; }.window-dots i:first-child { background: color-mix(in srgb, var(--showcase-accent) 68%, #fff); }
  .window-title { overflow: hidden; color: #aaa7b0; font-size: 11px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
  .window-actions { display: flex; justify-content: end; gap: 7px; }.window-actions span { width: 18px; height: 18px; border: 1px solid #3b3841; border-radius: 5px; }
  .window-body { display: grid; grid-template-columns: 142px minmax(0,1fr); height: calc(100% - 44px); }
  .window-sidebar { position: relative; padding: 15px 10px; border-right: 1px solid #2c2a31; background: #18171b; }
  .sidebar-search { height: 25px; margin: 0 2px 15px; border: 1px solid #34313a; border-radius: 7px; background: #211f25; }
  .sidebar-row { display: flex; align-items: center; gap: 8px; height: 31px; border-radius: 6px; padding: 0 8px; color: #96929c; font-size: 11px; }.sidebar-row i { width: 9px; height: 9px; border: 1px solid currentColor; border-radius: 3px; }.sidebar-row.active { background: color-mix(in srgb, var(--showcase-accent) 16%, #242229); color: #dbd9df; }.sidebar-row.active i { border-color: var(--showcase-accent); background: color-mix(in srgb, var(--showcase-accent) 38%, transparent); }
  .sidebar-footer { position: absolute; right: 12px; bottom: 13px; left: 12px; display: flex; gap: 7px; }.sidebar-footer i { width: 18px; height: 18px; border-radius: 5px; background: #242229; }
  .preview-surface { min-width: 0; overflow: hidden; background: #1d1c21; }
  .preview-toolbar { display: flex; justify-content: space-between; align-items: center; height: 43px; border-bottom: 1px solid #2c2a31; padding: 0 15px; color: #d8d6dc; font-size: 11px; }.preview-toolbar div { display: flex; gap: 6px; }.preview-toolbar span { width: 19px; height: 19px; border: 1px solid #37343d; border-radius: 5px; }
  .showcase-copy { padding-right: 10px; }
  .identity-mark { display: grid; width: 74px; height: 74px; place-items: center; border: 1px solid color-mix(in srgb, var(--showcase-accent) 55%, #47434e); border-radius: 20px; background: radial-gradient(circle at 28% 18%, color-mix(in srgb, var(--showcase-accent) 50%, transparent), transparent 68%), #211f25; color: #fff; box-shadow: inset 0 1px rgba(255,255,255,.1), 0 16px 38px color-mix(in srgb, var(--showcase-accent) 16%, transparent); font-size: 25px; font-weight: 720; letter-spacing: -.04em; text-transform: uppercase; }
  .showcase-eyebrow { margin: 24px 0 7px; color: var(--showcase-accent); font-size: 11px; font-weight: 700; letter-spacing: .11em; text-transform: uppercase; }
  h1 { margin: 0; color: #fff; font-size: clamp(42px, 4.2vw, 62px); font-weight: 680; line-height: .98; letter-spacing: -.055em; }
  .showcase-description { max-width: 330px; margin: 18px 0 0; color: #aaa7b0; font-size: 17px; line-height: 1.46; }
  .feature-list { display: grid; margin-top: 28px; border-top: 1px solid #34313a; }.feature-list > div { display: grid; grid-template-columns: 34px 1fr; align-items: center; min-height: 43px; border-bottom: 1px solid #302e35; }.feature-list span { color: #96929c; font: 10px ui-monospace, monospace; }.feature-list strong { color: #d7d5db; font-size: 12px; font-weight: 560; }
  .showcase-signature { display: flex; align-items: center; gap: 8px; margin-top: 24px; color: #96929c; font-size: 10px; }
  .chat-preview { position: relative; display: grid; align-content: start; gap: 12px; height: calc(100% - 43px); padding: 28px 24px 66px; }.chat-message { max-width: 76%; border: 1px solid #36333c; border-radius: 13px; padding: 12px 14px; color: #b9b6bf; font-size: 11px; line-height: 1.5; }.chat-message--user { justify-self: end; background: color-mix(in srgb, var(--showcase-accent) 13%, #242229); }.chat-message--assistant { background: #242229; }.chat-message b { color: #ecebf0; }.chat-message p { margin: 7px 0 10px; }.tool-pill { display: inline-flex; border-radius: 999px; padding: 4px 8px; background: #1b2c23; color: #70d89c; font-size: 9px; }.chat-composer { position: absolute; right: 20px; bottom: 17px; left: 20px; height: 39px; border: 1px solid #3b3841; border-radius: 11px; padding: 11px 13px; color: #aaa7b0; background: #242229; font-size: 10px; }.chat-composer span { float: right; display: grid; width: 19px; height: 19px; margin-top: -2px; place-items: center; border-radius: 6px; background: var(--showcase-accent); color: #fff; }
  .table-preview { padding: 15px; font-size: 10px; }.table-filter { display: flex; align-items: center; gap: 5px; height: 36px; color: #8c8993; }.table-filter b { border-radius: 999px; padding: 3px 8px; background: color-mix(in srgb, var(--showcase-accent) 18%, #28262d); color: #d7d5db; }.table-filter span { margin-left: auto; color: var(--showcase-accent); }.table-grid { display: grid; grid-template-columns: 1.4fr .8fr .8fr .5fr; min-height: 42px; align-items: center; border-right: 1px solid #323038; border-bottom: 1px solid #323038; border-left: 1px solid #323038; color: #aaa7b0; }.table-grid > * { height: 100%; display: flex; align-items: center; padding: 0 9px; border-right: 1px solid #323038; font-style: normal; }.table-grid > *:last-child { border-right: 0; }.table-grid--head { min-height: 33px; border-top: 1px solid #323038; border-radius: 7px 7px 0 0; background: #242229; color: #aaa7b0; }.table-grid em { color: #6ee7a0; }
  .graph-preview { position: relative; height: calc(100% - 43px); }.graph-preview svg { width: 100%; height: 100%; }.edges path { fill: none; stroke: #4b4753; stroke-width: 1.3; }.nodes circle { fill: #302d36; stroke: #706a79; stroke-width: 2; }.nodes .primary { fill: color-mix(in srgb, var(--showcase-accent) 40%, #28252e); stroke: var(--showcase-accent); }.labels { fill: #b9b6bf; font: 11px ui-sans-serif, system-ui; text-anchor: middle; }.graph-legend { position: absolute; right: 14px; bottom: 14px; display: flex; gap: 6px; }.graph-legend span { border: 1px solid #3b3841; border-radius: 999px; padding: 4px 7px; background: rgba(24,23,27,.8); color: #89858f; font-size: 8px; }
  .history-preview { display: grid; grid-template-columns: 125px 1fr; height: calc(100% - 43px); }.revision-list { padding: 14px 10px; border-right: 1px solid #302e35; color: #a9a5af; font-size: 9px; }.revision-list > b { display: block; margin: 0 7px 8px; color: #9d99a3; }.revision-list > div { display: flex; gap: 8px; align-items: center; min-height: 45px; border-radius: 7px; padding: 5px 7px; }.revision-list > div.active { background: color-mix(in srgb, var(--showcase-accent) 16%, #242229); }.revision-list i { width: 8px; height: 8px; border: 2px solid var(--showcase-accent); border-radius: 50%; }.revision-list span { display: grid; }.revision-list small { margin-top: 2px; color: #a29ea8; font-size: 8px; }.diff-preview { padding: 22px; color: #a9a6af; font: 10px ui-monospace, monospace; }.diff-title { margin-bottom: 24px; color: #dddbe1; font: 600 11px ui-sans-serif, system-ui; }.diff-preview p { margin: 0; padding: 7px 9px; }.diff-preview .removed { background: rgba(248,113,113,.1); color: #e69292; }.diff-preview .added { background: rgba(74,222,128,.1); color: #80d8a2; }
  .search-preview { padding: 17px; }.search-box { height: 37px; border: 1px solid color-mix(in srgb, var(--showcase-accent) 42%, #3b3841); border-radius: 9px; padding: 10px 12px; background: #242229; color: #d8d6dc; font-size: 11px; }.search-box kbd { float: right; color: #aaa7b0; font-size: 9px; }.facet-row { display: flex; gap: 6px; padding: 11px 0; }.facet-row span { border: 1px solid #39363f; border-radius: 999px; padding: 3px 7px; color: #aaa7b0; font-size: 8px; }.facet-row span:last-child { margin-left: auto; border: 0; }.search-result { display: grid; grid-template-columns: 18px 1fr; gap: 8px; min-height: 75px; border-radius: 8px; padding: 10px; color: #aaa7b0; }.search-result.active { background: color-mix(in srgb, var(--showcase-accent) 11%, #242229); }.search-result > i { width: 13px; height: 16px; border: 1px solid #5d5865; border-radius: 3px; }.search-result div { display: grid; }.search-result b { color: #d8d6dc; font-size: 10px; }.search-result small { margin-top: 2px; color: #aaa7b0; font-size: 8px; }.search-result p { margin: 7px 0 0; font-size: 9px; }.search-result mark { border-radius: 3px; padding: 0 2px; background: color-mix(in srgb, var(--showcase-accent) 25%, transparent); color: #ecebf0; }
  .diagnostics-preview { display: grid; grid-template-rows: 1fr 125px; height: calc(100% - 43px); }.editor-lines { display: grid; grid-template-columns: 28px 1fr; align-content: start; padding: 19px 17px; color: #9d99a3; font: 10px/1.9 ui-monospace, monospace; }.editor-lines span { color: #96929c; user-select: none; }.editor-lines p { min-height: 19px; margin: 0; color: #b3b0b8; }.editor-lines p:first-of-type { color: #e1dfe4; font-weight: 700; }.editor-lines u { text-decoration: underline wavy #f87171 1px; text-underline-offset: 3px; }.editor-lines u.warn { text-decoration-color: #fbbf24; }.problems { border-top: 1px solid #302e35; padding: 10px 15px; color: #c9c6ce; font-size: 9px; }.problems > b { display: block; margin-bottom: 7px; }.problems em { border-radius: 999px; padding: 1px 5px; background: #39363f; color: #c4c0c8; font-style: normal; }.problems > div { display: flex; gap: 8px; padding: 5px 0; }.problems i { width: 7px; height: 7px; margin-top: 3px; border-radius: 50%; background: #fbbf24; }.problems span { display: grid; }.problems small { color: #aaa7b0; font-size: 8px; }
  .writing-preview { display: grid; grid-template-rows: 1fr 82px; height: calc(100% - 43px); }.writing-preview article { max-width: 410px; padding: 26px 34px; }.writing-preview h2 { margin: 0 0 17px; color: #e9e7eb; font: 650 19px/1.2 ui-sans-serif, system-ui; }.writing-preview p, .writing-preview blockquote { color: #9c98a3; font: 11px/1.65 ui-sans-serif, system-ui; }.writing-preview blockquote { margin: 18px 0; border-left: 2px solid var(--showcase-accent); padding-left: 12px; color: #c4c1c8; }.writing-stats { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #302e35; background: #1a191e; }.writing-stats div { display: grid; place-content: center; border-right: 1px solid #302e35; text-align: center; }.writing-stats strong { color: #e3e1e6; font-size: 15px; }.writing-stats span { color: #aaa7b0; font-size: 8px; }
  .editor-preview { display: grid; grid-template-columns: 34px 1fr 28px; height: calc(100% - 43px); padding: 18px 8px; color: #aaa7b0; font: 11px/1.9 ui-monospace, monospace; }.editor-gutter { display: grid; align-content: start; color: #96929c; text-align: right; }.editor-gutter span { height: 21px; }.editor-code { position: relative; padding-left: 15px; }.editor-code p { height: 21px; margin: 0; }.editor-code b { color: #d8d6dc; }.editor-code i { color: color-mix(in srgb, var(--showcase-accent) 74%, #fff); font-style: normal; }.editor-code .muted { color: #aaa7b0; }.editor-caret { position: absolute; top: 105px; left: 15px; width: 1px; height: 16px; background: var(--showcase-accent); }.editor-minimap { border-left: 1px solid #302e35; background: repeating-linear-gradient(to bottom, transparent 0 4px, #3a3740 4px 5px); opacity: .5; }
  .list-preview { padding: 17px; }.list-heading { display: flex; justify-content: space-between; margin-bottom: 10px; color: #d7d5db; font-size: 11px; }.list-heading span { color: var(--showcase-accent); }.list-row { display: grid; grid-template-columns: 22px 1fr 20px; align-items: center; min-height: 55px; border-radius: 8px; padding: 7px 9px; color: #aaa7b0; font-size: 10px; }.list-row.active { background: color-mix(in srgb, var(--showcase-accent) 13%, #242229); }.list-row > i { width: 13px; height: 16px; border: 1px solid #8f8a96; border-radius: 3px; }.list-row > span { display: grid; }.list-row small { margin-top: 3px; color: #aaa7b0; font-size: 8px; }.list-row > b { color: #aaa7b0; letter-spacing: 2px; }
</style>
