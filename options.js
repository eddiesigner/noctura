(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    rememberPerSite: true,
    autoMatchSystemDarkMode: false,
    scheduledDarkMode: NocturaSchedule.DEFAULT_SCHEDULE,
    shortcut: SimpleDarkModeShortcut.DEFAULT_SHORTCUT
  };

  const shortcutInput = document.getElementById('shortcutInput');
  const shortcutError = document.getElementById('shortcutError');
  const rememberToggle = document.getElementById('rememberToggle');
  const autoMatchToggle = document.getElementById('autoMatchToggle');
  const scheduleToggle = document.getElementById('scheduleToggle');
  const scheduleFrom = document.getElementById('scheduleFrom');
  const scheduleTo = document.getElementById('scheduleTo');
  const scheduleFields = document.getElementById('scheduleFields');
  const clearSitesBtn = document.getElementById('clearSitesBtn');
  const toggleSitesBtn = document.getElementById('toggleSitesBtn');
  const siteList = document.getElementById('siteList');
  const siteCount = document.getElementById('siteCount');
  const savedMsg = document.getElementById('savedMsg');

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  let settings = DEFAULT_SETTINGS;
  let recording = false;
  let sitesVisible = false;

  function renderShortcut() {
    shortcutInput.textContent = SimpleDarkModeShortcut.formatShortcut(settings.shortcut, isMac);
  }

  function showSaved() {
    savedMsg.hidden = false;
    savedMsg.classList.add('visible');
    clearTimeout(showSaved._t);
    showSaved._t = setTimeout(() => savedMsg.classList.remove('visible'), 1200);
  }

  // Always merges onto the latest storage state (not the possibly-stale
  // local `settings` snapshot), so this can't clobber a change made by
  // auto-modes-ui.js's own independent read-modify-write cycle.
  function saveShortcut(shortcut) {
    chrome.storage.local.get('settings', (data) => {
      const next = Object.assign({}, data && data.settings, { shortcut });
      chrome.storage.local.set({ settings: next }, () => {
        settings = next;
        showSaved();
        NocturaBroadcast.broadcastSettingsToAllTabs(next);
      });
    });
  }

  function refreshSiteCount() {
    chrome.storage.local.get('sites', (data) => {
      const origins = Object.keys((data && data.sites) || {});
      const hasSites = origins.length > 0;

      siteCount.textContent = origins.length === 1
        ? '1 site currently remembered.'
        : `${origins.length} sites currently remembered.`;

      toggleSitesBtn.hidden = !hasSites;
      clearSitesBtn.hidden = !hasSites;

      if (!hasSites) {
        sitesVisible = false;
        siteList.hidden = true;
        toggleSitesBtn.textContent = 'Show sites';
      }

      siteList.innerHTML = '';
      for (const origin of origins.sort()) {
        const li = document.createElement('li');
        li.className = 'site-list-item';

        const label = document.createElement('span');
        label.className = 'site-list-origin';
        label.textContent = origin;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'site-delete-btn';
        deleteBtn.dataset.origin = origin;
        deleteBtn.title = `Forget ${origin}`;
        deleteBtn.setAttribute('aria-label', `Forget ${origin}`);
        deleteBtn.textContent = '×';

        li.appendChild(label);
        li.appendChild(deleteBtn);
        siteList.appendChild(li);
      }
    });
  }

  function deleteSite(origin) {
    chrome.storage.local.get('sites', (data) => {
      const sites = (data && data.sites) || {};
      delete sites[origin];
      chrome.storage.local.set({ sites }, () => {
        refreshSiteCount();
        showSaved();
      });
    });
  }

  chrome.storage.local.get('settings', (data) => {
    settings = Object.assign({}, DEFAULT_SETTINGS, data && data.settings);
    renderShortcut();
  });
  refreshSiteCount();

  NocturaAutoModesUI.wireAutoModes({
    autoMatchToggle,
    scheduleToggle,
    scheduleFrom,
    scheduleTo,
    scheduleFields,
    rememberToggle
  });

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
    saveShortcut(shortcut);
  });

  toggleSitesBtn.addEventListener('click', () => {
    sitesVisible = !sitesVisible;
    siteList.hidden = !sitesVisible;
    toggleSitesBtn.textContent = sitesVisible ? 'Hide sites' : 'Show sites';
  });

  siteList.addEventListener('click', (e) => {
    const btn = e.target.closest('.site-delete-btn');
    if (!btn) return;
    deleteSite(btn.dataset.origin);
  });

  clearSitesBtn.addEventListener('click', () => {
    chrome.storage.local.set({ sites: {} }, () => {
      refreshSiteCount();
      showSaved();
    });
  });
})();
