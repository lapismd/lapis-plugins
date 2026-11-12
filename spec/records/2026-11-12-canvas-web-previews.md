# Canvas web card qualification

LN-CANVAS-054/055 implement URL admission and explicit web previews under
LN-CANVAS-021. Ten URL tests initially failed to import the missing helper
(one suite, no cases); all ten pass. Only absolute HTTP(S) addresses become
navigation targets. Presentation normalization never rewrites stored Canvas
URLs. Malformed and imported javascript/data/file/mail addresses stay inert.

Views and note embeds use one web-card component. It has a native external
anchor with noopener/noreferrer and no-referrer, and no frame or remote request
until Load web preview is selected. Close destroys the frame without changing
data. Frames omit same-origin and top-navigation permissions, deny sensitive
capabilities, and retain a visible external-link fallback when sites refuse
framing. The three focused interaction/axe stories pass.

The original Link story selected the first button and expected Open link.
Its one failure identified the changed native-anchor presentation. The repaired
exact story checks the Open link role, HTTP(S) href, isolation attributes,
explicit load button and absent frame. It passes without an exclusion. The
complete cold catalog then passes 69 families / 319 cases / 57 existing skips
with zero failures (cedb7c03-1195-4c66-a583-ea73d5c6c7d9). Root check/test,
specification, all 203 release-tool cases and all 17 npm packs pass.

Two initial native cases pass actual opaque-origin frame loading, denied parent
and storage access, explicit close, framing rejection, external popup isolation
and byte-for-byte source retention. Installed Web acceptance passes the ten
existing cases but fails the new frame case: the real host's COEP isolation
blocks an ordinary framed document. No host security header is relaxed.

Supporting browsers now use credentialless frames, with sandbox, referrer and
capability restrictions set before DOM insertion can navigate. The component
owns frame creation, event handlers and disposal. This also avoids relying on
experimental attribute support in Svelte's element type declarations.

Native cross-origin-isolation qualification serves COEP on host documents and
metadata workers, matching the real host. An initial document-only fixture
could not boot its worker. The final fixture checks actual HTTP request headers
at a dedicated server instead of relying on intercepted request metadata.
Chromium's documented per-endpoint address-space override classifies only that
local fixture as a public website, as Chromium/WPT do; COEP, sandbox, credentials
and cookie assertions remain active. This is necessary because opaque frames
otherwise correctly fail localhost Local Network Access checks. The parent has
an ambient cookie, the server receives a request without it, and the host stays
cross-origin isolated. The exact native case passes.

Reference: https://developer.chrome.com/blog/iframe-credentialless

Fixture protocol: https://chromium.googlesource.com/chromium/src/+/HEAD/services/network/public/cpp/ip_address_space_overrides_test_utils.h

Final registry qualification uses Mira 0.1.5 and Design Core 0.12.4 without
temporary archives. Root check/test/spec and 203 release-tool cases pass. The
complete cold catalog passes 69 families, 319 cases, 57 existing skips and zero
failures (50474fb8-51b5-43d4-ba4e-e36ee73583d6). All 17 local npm packs pass.

The deterministic runtime and test-signed registry fixture from
6cfedad74d7008adbca964c8ffd9570f74fa7425 pass verification. Its installed Web
case passes with the host still cross-origin isolated, actual frame rendering,
denied parent access, explicit close and byte-for-byte source retention. The
subsequent combined candidate also passes all 22 native browser cases.

Stories remain visual-pending; no baseline or publication is approved by these
qualification artifacts. Installed Desktop release acceptance remains separate.
