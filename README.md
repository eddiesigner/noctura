# Noctura

A small, on-demand dark mode extension for any website. By default, nothing
switches automatically — dark mode only turns on when *you* turn it on, via
the toolbar popup or a keyboard shortcut (default: `Alt/⌥ + D`, customizable
in Settings). There are two opt-in exceptions, both off by default and
mutually exclusive with each other: [Match system dark
mode](#match-system-dark-mode), which follows the OS preference, and
[Scheduled dark mode](#scheduled-dark-mode), which follows a daily time
range you set.

## How it works

Dark mode is generated purely with CSS, using the classic invert-filter
technique:

```css
html {
  filter: invert(1) hue-rotate(180deg);
}
img, video, iframe, canvas, embed, object, [style*="background-image"] {
  filter: invert(1) hue-rotate(180deg); /* inverted again = back to normal */
}
```

Inverting the whole page flips light backgrounds to dark and dark text to
light. Photo/video-like elements get the same filter applied a second time,
which cancels the effect out and keeps them looking normal. Inline `<svg>`
is deliberately left inverting along with the page instead — most inline
SVGs on the web are simple, flat-colored icons and logos (not photos), and
those look right when they flip along with the surrounding text, the same
way a black icon should turn white on a dark background. `<img src="x.svg">`
and SVGs used via a CSS `background-image` still count as photo-like and
stay un-inverted, since only the bare `svg` tag was excluded.

**Known limitations:**
- This technique can't detect CSS background images declared in
  stylesheets (only inline `style="background-image:..."`), so a small
  number of sites with photo backgrounds set via CSS classes may look
  inverted in those specific spots.
- If one of the un-inverted tags is nested inside another one from that
  same list, the filter applies twice and cancels back out to inverted.
  `<picture>` is deliberately left out of the list for exactly this reason
  (it's a non-rendering wrapper around an `<img>`/`<source>`, which are
  already covered on their own). The same could theoretically happen with
  `<object>`/`<embed>` fallback content nesting another listed tag, though
  that's rare in practice.
- A colorful/photographic inline `<svg>` (rare, but it happens — e.g. a
  detailed illustration or a flag) will invert along with the page instead
  of staying color-accurate, since inline SVGs are treated as icon-like by
  default. There's no reliable way to tell "icon" and "photographic SVG"
  apart from CSS alone.

Both are inherent tradeoffs of the filter-based approach (used by most
lightweight dark mode extensions) and avoid the complexity/fragility of a
full per-site theming engine.

## Project structure

Built with [WXT](https://wxt.dev/) (Vite-based) + Vue 3 + TypeScript. WXT
generates the right manifest per browser target from one codebase — no more
hand-maintained `manifest.json`/`manifest-firefox.json` pair.

```
wxt.config.ts               Manifest fields, srcDir/outDir (name, permissions, Firefox gecko id, ...)
src/
  entrypoints/
    background.ts            Manages the chrome.alarms-based schedule check
    content.ts                Applies/removes the dark styles, handles the shortcut/messages
    popup/                    Toolbar popup (Vue): on/off toggle + the automatic-mode switches + theme picker
    options/                  Settings page (Vue): shortcut recorder, remembered sites, automatic-mode switches
  composables/
    useAutoModes.ts            Remember/Match-system/Scheduled state + their mutual exclusion (shared by popup & options)
    usePageToggle.ts           Popup's per-tab on/off toggle (live state, lock handling)
    useShortcutRecorder.ts     Options' shortcut-recording UI
    useRememberedSites.ts      Options' remembered-sites list
    useTheme.ts                Theme selection (shared by popup & options)
  utils/
    settings.ts                Settings type + typed storage items (wxt/storage)
    schedule.ts                 "Is now within the scheduled range" logic
    shortcut.ts                 Keyboard shortcut matching/formatting
    theme.ts                    Theme presets (Classic/Grayscale/Sepia) and their filter recipes
  components/                 Shared presentational Vue components (switch, time-range fields, theme swatch)
  assets/                      Shared CSS (theme variables, base styles)
public/icon/                  Toolbar icon (16/32/48/128px), copied as-is into every build (not under src/ —
                               WXT always resolves publicDir from the project root, regardless of srcDir)
```

Settings changes propagate via `wxt/storage`'s `.watch()`, which fires in
every context (content script, popup, options, background) whenever the
value changes — regardless of who changed it. There's no manual
"broadcast to every tab" step for that; the one place a message is still
sent proactively is the background alarm nudging tabs to recheck the
schedule, since that's a time passing, not a settings change.

## Local development

```bash
npm install
npm run dev            # Chrome/Arc-compatible dev build, auto-reloading
npm run dev:firefox    # Same, targeting Firefox
npm run compile        # Type-check only (vue-tsc), no build output
```

`wxt` in dev mode can auto-launch a dedicated test browser profile with the
extension already loaded (see [WXT's browser startup
docs](https://wxt.dev/guide/essentials/config/browser-startup.html) to point
it at a specific Chrome/Chromium binary). For loading into **Arc**
specifically — not something WXT can auto-launch — build once and load it
unpacked instead:

```bash
npm run build
```

1. Open `arc://extensions` (or `chrome://extensions` in Chrome).
2. Turn on **Developer Mode** (toggle, top right).
3. Click **Load unpacked**.
4. Select the `output/chrome-mv3` folder produced by the build (not the
   project root — that's the compiled extension WXT generates).
5. Pin the "Noctura" icon to the toolbar if you'd like quick access.

For active development, use `npm run dev` instead of `npm run build` — it
outputs to `output/chrome-mv3-dev` (a separate folder from the production
`chrome-mv3` build, so load that one in step 4 above instead). Its build
has a WebSocket client baked into the background script that connects back
to the dev server, so after loading it into Arc once, most code changes
auto-reload the extension by themselves — no need to keep re-clicking
"Load unpacked". A manual reload is still occasionally needed for changes
the extension can't apply to itself, like editing `wxt.config.ts`'s
`permissions`.

Test it:
- Visit any regular website (not a `chrome://` page).
- Click the extension icon and toggle it on — the page should invert while
  images/video stay normal.
- Press `Alt/⌥ + D` on the page — it should toggle the same way.
- Reload the page — dark mode should still be on for that site (per-site
  memory). Toggle it off and reload again to confirm it stays off.
- Open **Settings** from the popup to record a different key combination,
  toggle "Remember per website," "Match system dark mode," or "Scheduled
  dark mode," or clear all remembered sites.
- Turn on "Scheduled dark mode" with a range that includes the current
  time — the page should go dark immediately, no reload.

## Firefox

```bash
npm run build:firefox
npm run zip:firefox   # produces output/noctura-<version>-firefox.zip
```

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `manifest.json` inside `output/firefox-mv2`.

(Temporary add-ons are removed when Firefox restarts. For a persistent
install, submit the zip from `npm run zip:firefox` to
addons.mozilla.org — signed builds can then be installed permanently.)

## Preparing for the stores

```bash
npm run zip            # output/noctura-<version>-chrome.zip, for the Chrome Web Store
npm run zip:firefox    # output/noctura-<version>-firefox.zip, for addons.mozilla.org
```

Bump `version` in `package.json` before each release — WXT reads it
directly into the generated manifest.

## Match system dark mode

Off by default, in Settings or the popup. When it's on, it's the sole
authority over every page's dark mode: a page is dark whenever the OS
reports `prefers-color-scheme: dark`, and light otherwise. The shortcut and
the popup's "Dark mode" toggle are disabled while this is on — there's no
per-page override, and any previously remembered per-site choices are
ignored until you turn it back off.

Turning the setting on or off applies immediately to every open page — no
reload needed. It doesn't react live to the OS theme changing while a page
stays open with the setting already on; that's only checked at the moment
the page loads or the setting itself changes.

## Scheduled dark mode

Off by default. Pick a daily "From" and "To" time (defaults: 8:00 PM to
8:00 AM) and any page is dark during that range, light outside it — same
"sole authority, no per-page override" behavior as Match system dark mode,
and the two are mutually exclusive (turning one on turns the other off and
disables its switch). "Remember per website" is locked while either
automatic mode is on, since there's nothing to manually remember.

Ranges that cross midnight (e.g. 8pm→8am) work as expected. An identical
From/To time is treated as "always on" (24h) rather than "always off." The
time is always your system's local time — it's read straight from the OS
clock, so it already accounts for timezone and DST with no extra setup, and
self-corrects if you change either.

Applying the setting or editing the times updates open tabs immediately.
Beyond that, since MV3 background pages don't stay alive for hours waiting
for 8pm, the actual boundary crossing is caught by a `chrome.alarms` check
that runs once a minute while this is on — so there can be up to about a
minute of lag between the clock hitting your chosen time and the page
actually flipping, and a tab that's been discarded/backgrounded will just
catch up next time it's focused or reloaded.

## Theme

Settings has a "Theme" picker (Classic / Grayscale / Sepia) with a live
preview swatch per option — each swatch has the actual theme's CSS `filter`
applied to a small mock page (text lines, an accent color, a photo square),
so it shows exactly how that theme renders, not just a label. This choice
is orthogonal to how dark mode gets turned on — it only changes the color
recipe used whenever dark mode is active, regardless of trigger.

Classic keeps photos/videos untouched, same as always. Grayscale and Sepia
add `grayscale()`/`sepia()` on top of the same base — and since those
aren't reversible the way invert+hue-rotate is, media elements can't cancel
them back out, so photos and videos pick up the same tint as the rest of
the page in those two themes. That matches how similar modes work in most
other dark mode extensions.

## Notes on the keyboard shortcut

The shortcut is handled by the content script itself (not the browser's
built-in extension-commands API), so it's fully customizable from the
Settings page and works identically across Chrome, Arc, and Firefox.
It only fires while a page has focus — that's expected, since it toggles dark
mode *for that page*.
