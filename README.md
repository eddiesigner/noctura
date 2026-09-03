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
background.js            Seeds default settings; manages the schedule alarm
content.js                Applies/removes the dark styles, handles the shortcut, persists per-site state
popup.html/css/js        Toolbar popup: on/off toggle for the current site, plus the automatic-mode switches
options.html/css/js      Settings: shortcut recorder, remembered sites, the automatic-mode switches
shortcut-utils.js         Shared: keyboard shortcut matching/formatting
schedule-utils.js         Shared: "is now within the scheduled range" logic
broadcast-utils.js        Shared: live-apply a settings change to every open tab
auto-modes-ui.js          Shared: wires up Remember/Match-system/Scheduled and their mutual exclusion
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
- Open **Settings** from the popup to record a different key combination,
  toggle "Remember per website," "Match system dark mode," or "Scheduled
  dark mode," or clear all remembered sites.
- Turn on "Scheduled dark mode" with a range that includes the current
  time — the page should go dark immediately, no reload.

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

## Notes on the keyboard shortcut

The shortcut is handled by the content script itself (not the browser's
built-in extension-commands API), so it's fully customizable from the
Settings page and works identically across Chrome, Arc, Firefox, and Safari.
It only fires while a page has focus — that's expected, since it toggles dark
mode *for that page*.
