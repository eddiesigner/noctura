// Noctura - content script
// Applies an invert-filter based dark theme to the current page, on demand only.
// Media elements (images, video, canvas, svg, iframes, background-images) are
// double-inverted back to their original colors.
(function () {
  'use strict';

  const STYLE_ID = '__noctura-style__';

  const DEFAULT_SETTINGS = {
    rememberPerSite: true,
    autoMatchSystemDarkMode: false,
    scheduledDarkMode: NocturaSchedule.DEFAULT_SCHEDULE,
    shortcut: SimpleDarkModeShortcut.DEFAULT_SHORTCUT
  };

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

  let settings = DEFAULT_SETTINGS;
  let enabled = false;
  let origin;

  try {
    origin = location.origin;
  } catch (e) {
    origin = null;
  }

  function prefersSystemDark() {
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
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }

  function persistState() {
    if (!settings.rememberPerSite || !origin) return;
    chrome.storage.local.get('sites', (data) => {
      const sites = (data && data.sites) || {};
      if (enabled) {
        sites[origin] = true;
      } else {
        delete sites[origin];
      }
      chrome.storage.local.set({ sites });
    });
  }

  function setEnabled(next, persist) {
    enabled = next;
    if (enabled) {
      applyStyle();
    } else {
      removeStyle();
    }
    if (persist !== false) persistState();
  }

  function autoModeActive() {
    const schedule = NocturaSchedule.normalizeSchedule(settings.scheduledDarkMode);
    return settings.autoMatchSystemDarkMode || schedule.enabled;
  }

  // While either automatic mode is on, it's the sole authority over this
  // page's dark mode — manual toggling (shortcut or popup) is a no-op so
  // the page always reflects that mode, with no per-page override.
  function toggle() {
    if (autoModeActive()) return enabled;
    setEnabled(!enabled);
    return enabled;
  }

  // Recomputes and (re)applies dark mode from the current settings, live —
  // used whenever settings change while the page is already open, so
  // turning an automatic mode on/off (or editing the schedule) takes effect
  // immediately without a reload. Scheduled mode takes priority since the
  // UI keeps it mutually exclusive with auto-match, but both can't be on.
  function applyState() {
    const schedule = NocturaSchedule.normalizeSchedule(settings.scheduledDarkMode);
    if (schedule.enabled) {
      setEnabled(NocturaSchedule.isWithinSchedule(schedule), false);
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
    chrome.storage.local.get('sites', (data) => {
      const sites = (data && data.sites) || {};
      setEnabled(!!sites[origin], false);
    });
  }

  document.addEventListener(
    'keydown',
    (e) => {
      if (SimpleDarkModeShortcut.matchesShortcut(e, settings.shortcut)) {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    },
    true
  );

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg) return;
    switch (msg.type) {
      case 'TOGGLE':
        toggle();
        sendResponse({ enabled });
        break;
      case 'GET_STATE':
        sendResponse({ enabled });
        break;
      case 'SETTINGS_UPDATED':
        settings = Object.assign({}, DEFAULT_SETTINGS, msg.settings);
        applyState();
        break;
      default:
        break;
    }
    return true;
  });

  // Initialize from stored settings, then defer to applyState() for the
  // same priority logic used on every later live update.
  chrome.storage.local.get('settings', (data) => {
    settings = Object.assign({}, DEFAULT_SETTINGS, data && data.settings);
    applyState();
  });
})();
