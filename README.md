# Noctura

A small, on-demand dark mode extension for any website. By default, nothing
switches automatically — dark mode only turns on when *you* turn it on, via
the toolbar popup or a keyboard shortcut (default: `Alt/⌥ + D`, customizable
in Settings). There's one opt-in exception: a "Match system dark mode"
setting (off by default) that follows your OS's dark mode preference — see
[Match system dark mode](#match-system-dark-mode) below.

## How it works

Dark mode is generated purely with CSS, using the classic invert-filter
technique:

```css
html {
  filter: invert(1) hue-rotate(180deg);
}
img, video, iframe, picture, canvas, svg, embed, object, [style*="background-image"] {
  filter: invert(1) hue-rotate(180deg); /* inverted again = back to normal */
}
```

Inverting the whole page flips light backgrounds to dark and dark text to
light. Media elements get the same filter applied a second time, which
cancels the effect out and keeps photos, video, and icons looking normal.

**Known limitation:** this technique can't detect CSS background images
declared in stylesheets (only inline `style="background-image:..."`), so a
small number of sites with photo backgrounds set via CSS classes may look
inverted in those specific spots. This is an inherent tradeoff of the
filter-based approach (used by most lightweight dark mode extensions) and
avoids the complexity/fragility of a full per-site theming engine.

## Project structure

```
manifest.json           Chrome / Arc / Edge (Manifest V3)
manifest-firefox.json    Firefox variant (Manifest V3)
background.js            Seeds default settings on install
content.js                Applies/removes the dark styles, handles the shortcut, persists per-site state
popup.html/css/js        Toolbar popup: on/off toggle for the current site
options.html/css/js      Settings: shortcut recorder, remember-per-site toggle, clear remembered sites
icons/                    Toolbar icon (16/32/48/128px)
```

Plain HTML/CSS/JS, no build step — this keeps it portable across browsers.

## Load it locally in Arc (or Chrome)

Arc is Chromium-based and loads unpacked extensions the same way Chrome does:

1. Open `arc://extensions` (or `chrome://extensions` in Chrome).
2. Turn on **Developer Mode** (toggle, top right).
3. Click **Load unpacked**.
4. Select this folder: `/Users/lalo/Code/Personal/noctura`.
5. Pin the "Noctura" icon to the toolbar if you'd like quick access.

Test it:
- Visit any regular website (not a `chrome://` page).
- Click the extension icon and toggle it on — the page should invert while
  images/video stay normal.
- Press `Alt/⌥ + D` on the page — it should toggle the same way.
- Reload the page — dark mode should still be on for that site (per-site
  memory). Toggle it off and reload again to confirm it stays off.
- Open **Customize shortcut** from the popup to record a different key
  combination, toggle "Remember per website," or clear all remembered sites.

## Firefox

Firefox needs the manifest file to literally be named `manifest.json`, so use
a copy of the folder with the Firefox variant swapped in:

```bash
cp -R noctura noctura-firefox
cd noctura-firefox
mv manifest.json manifest-chrome.json
mv manifest-firefox.json manifest.json
```

Then in Firefox:
1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `manifest.json` inside `noctura-firefox`.

(Temporary add-ons are removed when Firefox restarts; for a persistent
install you'd package and sign it via addons.mozilla.org.)

## Safari

Safari runs Web Extensions but requires converting the project into an Xcode
project first:

```bash
xcrun safari-web-extension-converter /Users/lalo/Code/Personal/noctura
```

This opens Xcode with a generated app+extension target. Build and run the app
once, then enable the extension in Safari's **Settings → Extensions** (and,
on first run, allow unsigned extensions via **Develop → Allow Unsigned
Extensions** if you're on a non-App Store build). Requires Xcode and an Apple
Developer account for anything beyond local testing/distribution.

## Match system dark mode

Off by default. When turned on in Settings, a page defaults to dark mode if
the OS reports `prefers-color-scheme: dark` — but only for sites you haven't
already set an explicit preference for. An explicit remembered per-site
choice (from manually toggling with "remember per website" on) always takes
priority over this setting.

Pressing the shortcut (or popup toggle) on a page whose dark mode came from
this setting overrides it for that page view only — it's not written to
per-site memory, so reloading the page or revisiting the site later goes
back to following the OS preference. It's only checked once, when the page
loads; it doesn't react live if you flip the OS theme while the page stays
open.

## Notes on the keyboard shortcut

The shortcut is handled by the content script itself (not the browser's
built-in extension-commands API), so it's fully customizable from the
Settings page and works identically across Chrome, Arc, Firefox, and Safari.
It only fires while a page has focus — that's expected, since it toggles dark
mode *for that page*.
