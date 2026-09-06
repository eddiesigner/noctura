import { matchesShortcut } from '@/utils/shortcut';
import { isWithinSchedule, normalizeSchedule } from '@/utils/schedule';
import { settingsStorage, sitesStorage, type Settings } from '@/utils/settings';
import { getThemeFilter, REVERSIBLE_FILTER, type ThemeId } from '@/utils/theme';

const STYLE_ID = '__noctura-style__';

// Applies a filter-based dark theme, on demand only. Photo/video-like
// elements get the reversible part of the filter applied a second time,
// canceling it back out (see utils/theme.ts for why only that part is
// reversible — grayscale/sepia themes still tint media, by design).
// Inline <svg> is intentionally left out: most inline SVGs are flat icons,
// which look right flipping with the page like text does. <picture> is also
// left out: it's a non-rendering wrapper around <img>/<source>, and matching
// both it and its child would cancel the un-invert back out to inverted.
function buildDarkModeCss(theme: ThemeId | undefined): string {
  return `
    html {
      filter: ${getThemeFilter(theme)} !important;
      background-color: #fff !important;
    }
    img, video, iframe, canvas, embed, object,
    video source,
    [style*="background-image"] {
      filter: ${REVERSIBLE_FILTER} !important;
    }
  `;
}

type RuntimeMessage =
  | { type: 'TOGGLE' }
  | { type: 'GET_STATE' }
  | { type: 'CLEAR_OVERRIDE' }
  | { type: 'RECHECK_SCHEDULE' };

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  matchAboutBlank: true,
  runAt: 'document_start',
  async main() {
    let settings: Settings = await settingsStorage.getValue();
    let enabled = false;

    let origin: string | null;
    try {
      origin = location.origin;
    } catch {
      origin = null;
    }

    function prefersSystemDark(): boolean {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function applyStyle() {
      let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(style);
      }
      // Always refresh (not just on creation) so switching themes while
      // dark mode is already on takes effect immediately.
      style.textContent = buildDarkModeCss(settings.theme);
    }

    function removeStyle() {
      document.getElementById(STYLE_ID)?.remove();
    }

    function autoModeActive(): boolean {
      const schedule = normalizeSchedule(settings.scheduledDarkMode);
      return settings.autoMatchSystemDarkMode || schedule.enabled;
    }

    // An automatic mode governs every site by default, but a manual toggle
    // for one particular site always wins over it — that per-site choice is
    // what's stored here, keyed by origin. Outside of an automatic mode this
    // map instead holds the "remember per website" preference, so a manual
    // toggle only persists there when that setting is on.
    async function isOverridden(): Promise<boolean> {
      if (!origin || !autoModeActive()) return false;
      const sites = await sitesStorage.getValue();
      return origin in sites;
    }

    async function persistState() {
      if (!origin) return;
      const sites = await sitesStorage.getValue();
      if (autoModeActive()) {
        // Override must be storable as explicit false too, so an
        // "automatic says dark, but I want this site light" choice sticks —
        // a deleted entry would just mean "no override" and fall back to
        // the automatic mode again.
        sites[origin] = enabled;
      } else if (settings.rememberPerSite) {
        if (enabled) {
          sites[origin] = true;
        } else {
          delete sites[origin];
        }
      } else {
        return;
      }
      await sitesStorage.setValue(sites);
    }

    function setEnabled(next: boolean, persist = true) {
      enabled = next;
      if (enabled) {
        applyStyle();
      } else {
        removeStyle();
      }
      return persist ? persistState() : Promise.resolve();
    }

    // Manual toggling (shortcut or popup) always applies, even while an
    // automatic mode is on — it just creates or updates a sticky per-site
    // override (see persistState) rather than changing the automatic mode
    // itself, which keeps governing every other site.
    async function toggle(): Promise<boolean> {
      await setEnabled(!enabled);
      return enabled;
    }

    // Recomputes and (re)applies dark mode from the current settings —
    // used on load, whenever settings change, and on the periodic schedule
    // recheck, so every trigger takes effect immediately without a reload.
    // A per-site override, if any, wins over the automatic modes; scheduled
    // mode then takes priority over auto-match since the UI keeps them
    // mutually exclusive.
    async function applyState() {
      if (autoModeActive() && origin) {
        const sites = await sitesStorage.getValue();
        if (origin in sites) {
          setEnabled(!!sites[origin], false);
          return;
        }
      }
      const schedule = normalizeSchedule(settings.scheduledDarkMode);
      if (schedule.enabled) {
        setEnabled(isWithinSchedule(schedule), false);
        return;
      }
      if (settings.autoMatchSystemDarkMode) {
        setEnabled(prefersSystemDark(), false);
        return;
      }
      if (!settings.rememberPerSite || !origin) {
        setEnabled(false, false);
        return;
      }
      const sites = await sitesStorage.getValue();
      setEnabled(!!sites[origin], false);
    }

    async function clearOverride() {
      if (origin) {
        const sites = await sitesStorage.getValue();
        delete sites[origin];
        await sitesStorage.setValue(sites);
      }
      await applyState();
    }

    document.addEventListener(
      'keydown',
      (e) => {
        if (matchesShortcut(e, settings.shortcut)) {
          e.preventDefault();
          e.stopPropagation();
          void toggle();
        }
      },
      true,
    );

    browser.runtime.onMessage.addListener((msg: RuntimeMessage) => {
      switch (msg?.type) {
        case 'TOGGLE':
          return (async () => {
            await toggle();
            return { enabled, overridden: await isOverridden() };
          })();
        case 'GET_STATE':
          return (async () => ({ enabled, overridden: await isOverridden() }))();
        case 'CLEAR_OVERRIDE':
          return (async () => {
            await clearOverride();
            return { enabled, overridden: await isOverridden() };
          })();
        case 'RECHECK_SCHEDULE':
          void applyState();
          return;
        default:
          return;
      }
    });

    settingsStorage.watch((next) => {
      settings = next;
      void applyState();
    });

    await applyState();
  },
});
