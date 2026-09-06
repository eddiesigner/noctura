import { matchesShortcut } from '@/utils/shortcut';
import { isWithinSchedule, normalizeSchedule } from '@/utils/schedule';
import { settingsStorage, sitesStorage, type Settings } from '@/utils/settings';

const STYLE_ID = '__noctura-style__';

// Applies an invert-filter based dark theme, on demand only. Photo/video-like
// elements get the same filter applied a second time, canceling it back out.
// Inline <svg> is intentionally left out: most inline SVGs are flat icons,
// which look right flipping with the page like text does. <picture> is also
// left out: it's a non-rendering wrapper around <img>/<source>, and matching
// both it and its child would cancel the un-invert back out to inverted.
const DARK_MODE_CSS = `
  html {
    filter: invert(1) hue-rotate(180deg) !important;
    background-color: #fff !important;
  }
  img, video, iframe, canvas, embed, object,
  video source,
  [style*="background-image"] {
    filter: invert(1) hue-rotate(180deg) !important;
  }
`;

type RuntimeMessage =
  | { type: 'TOGGLE' }
  | { type: 'GET_STATE' }
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
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = DARK_MODE_CSS;
      (document.head || document.documentElement).appendChild(style);
    }

    function removeStyle() {
      document.getElementById(STYLE_ID)?.remove();
    }

    async function persistState() {
      if (!settings.rememberPerSite || !origin) return;
      const sites = await sitesStorage.getValue();
      if (enabled) {
        sites[origin] = true;
      } else {
        delete sites[origin];
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
      if (persist) void persistState();
    }

    function autoModeActive(): boolean {
      const schedule = normalizeSchedule(settings.scheduledDarkMode);
      return settings.autoMatchSystemDarkMode || schedule.enabled;
    }

    // While either automatic mode is on, it's the sole authority over this
    // page's dark mode — manual toggling (shortcut or popup) is a no-op so
    // the page always reflects that mode, with no per-page override.
    function toggle(): boolean {
      if (autoModeActive()) return enabled;
      setEnabled(!enabled);
      return enabled;
    }

    // Recomputes and (re)applies dark mode from the current settings —
    // used on load, whenever settings change, and on the periodic schedule
    // recheck, so every trigger takes effect immediately without a reload.
    // Scheduled mode takes priority since the UI keeps it mutually
    // exclusive with auto-match, but both can't be on at once.
    async function applyState() {
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

    document.addEventListener(
      'keydown',
      (e) => {
        if (matchesShortcut(e, settings.shortcut)) {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }
      },
      true,
    );

    browser.runtime.onMessage.addListener((msg: RuntimeMessage) => {
      switch (msg?.type) {
        case 'TOGGLE':
          return Promise.resolve({ enabled: toggle() });
        case 'GET_STATE':
          return Promise.resolve({ enabled });
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
