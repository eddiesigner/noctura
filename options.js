(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    rememberPerSite: true,
    shortcut: SimpleDarkModeShortcut.DEFAULT_SHORTCUT
  };

  const shortcutInput = document.getElementById('shortcutInput');
  const shortcutError = document.getElementById('shortcutError');
  const rememberToggle = document.getElementById('rememberToggle');
  const clearSitesBtn = document.getElementById('clearSitesBtn');
  const siteCount = document.getElementById('siteCount');
  const savedMsg = document.getElementById('savedMsg');

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  let settings = DEFAULT_SETTINGS;
  let recording = false;

  function renderShortcut() {
    shortcutInput.textContent = SimpleDarkModeShortcut.formatShortcut(settings.shortcut, isMac);
  }

  function showSaved() {
    savedMsg.hidden = false;
    savedMsg.classList.add('visible');
    clearTimeout(showSaved._t);
    showSaved._t = setTimeout(() => savedMsg.classList.remove('visible'), 1200);
  }

  function saveSettings() {
    chrome.storage.local.set({ settings }, () => {
      showSaved();
      broadcastSettings();
    });
  }

  function broadcastSettings() {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings }, () => {
          void chrome.runtime.lastError; // ignore tabs without our content script
        });
      }
    });
  }

  function refreshSiteCount() {
    chrome.storage.local.get('sites', (data) => {
      const count = data && data.sites ? Object.keys(data.sites).length : 0;
      siteCount.textContent = count === 1 ? '1 site currently remembered.' : `${count} sites currently remembered.`;
    });
  }

  chrome.storage.local.get('settings', (data) => {
    settings = Object.assign({}, DEFAULT_SETTINGS, data && data.settings);
    renderShortcut();
    rememberToggle.checked = !!settings.rememberPerSite;
  });
  refreshSiteCount();

  const IGNORED_CODES = new Set([
    'ControlLeft', 'ControlRight',
    'AltLeft', 'AltRight',
    'ShiftLeft', 'ShiftRight',
    'MetaLeft', 'MetaRight',
    'Escape', 'Tab'
  ]);

  function startRecording() {
    recording = true;
    shortcutInput.classList.add('recording');
    shortcutInput.textContent = 'Press a key combination…';
    shortcutError.hidden = true;
  }

  function stopRecording() {
    recording = false;
    shortcutInput.classList.remove('recording');
    renderShortcut();
  }

  shortcutInput.addEventListener('click', () => {
    if (!recording) startRecording();
  });

  shortcutInput.addEventListener('blur', () => {
    if (recording) stopRecording();
  });

  document.addEventListener('keydown', (e) => {
    if (!recording) return;
    e.preventDefault();

    if (e.code === 'Escape') {
      stopRecording();
      return;
    }

    if (IGNORED_CODES.has(e.code)) return; // wait for a real key

    const hasModifier = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
    if (!hasModifier) {
      shortcutError.textContent = 'Include at least one modifier key (Alt, Ctrl, Shift, or Cmd) to avoid clashing with normal typing.';
      shortcutError.hidden = false;
      return;
    }

    const shortcut = {
      alt: e.altKey,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      meta: e.metaKey,
      code: e.code
    };

    settings = Object.assign({}, settings, { shortcut });
    shortcutError.hidden = true;
    stopRecording();
    saveSettings();
  });

  rememberToggle.addEventListener('change', () => {
    settings = Object.assign({}, settings, { rememberPerSite: rememberToggle.checked });
    saveSettings();
  });

  clearSitesBtn.addEventListener('click', () => {
    chrome.storage.local.set({ sites: {} }, () => {
      refreshSiteCount();
      showSaved();
    });
  });
})();
