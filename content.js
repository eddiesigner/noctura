// Noctura - content script
// Applies an invert-filter based dark theme to the current page, on demand only.
// Media elements (images, video, canvas, svg, iframes, background-images) are
// double-inverted back to their original colors.
(function () {
  'use strict';

  const STYLE_ID = '__noctura-style__';

  const DEFAULT_SETTINGS = {
    rememberPerSite: true,
    shortcut: SimpleDarkModeShortcut.DEFAULT_SHORTCUT
  };

  const DARK_MODE_CSS = `
    html {
      filter: invert(1) hue-rotate(180deg) !important;
      background-color: #fff !important;
    }
    img, video, iframe, picture, canvas, svg, embed, object,
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

  function toggle() {
    setEnabled(!enabled);
    return enabled;
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
        break;
      default:
        break;
    }
    return true;
  });

  // Initialize from stored settings + remembered per-site choice.
  chrome.storage.local.get(['settings', 'sites'], (data) => {
    settings = Object.assign({}, DEFAULT_SETTINGS, data && data.settings);
    const sites = (data && data.sites) || {};
    if (settings.rememberPerSite && origin && sites[origin]) {
      setEnabled(true, false);
    }
  });
})();
