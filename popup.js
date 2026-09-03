(function () {
  'use strict';

  const toggleBtn = document.getElementById('toggleBtn');
  const toggleText = document.getElementById('toggleText');
  const siteHost = document.getElementById('siteHost');
  const statusMsg = document.getElementById('statusMsg');
  const shortcutHint = document.getElementById('shortcutHint');
  const optionsBtn = document.getElementById('optionsBtn');
  const autoMatchToggle = document.getElementById('autoMatchToggle');
  const scheduleToggle = document.getElementById('scheduleToggle');
  const scheduleFrom = document.getElementById('scheduleFrom');
  const scheduleTo = document.getElementById('scheduleTo');
  const scheduleFields = document.getElementById('scheduleFields');

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const LOCKED_MSG = 'Dark mode is controlled automatically by one of the settings below.';

  let pageAvailable = false;
  let locked = false;
  let tabOrigin = null;

  function refreshLockUI() {
    if (!pageAvailable) return;
    toggleBtn.disabled = locked;
    statusMsg.textContent = locked ? LOCKED_MSG : '';
    statusMsg.hidden = !locked;
  }

  function setUnavailable(message) {
    toggleBtn.disabled = true;
    toggleBtn.setAttribute('aria-pressed', 'false');
    toggleText.textContent = 'Dark mode off';
    statusMsg.textContent = message;
    statusMsg.hidden = false;
  }

  function setPressed(pressed) {
    toggleBtn.setAttribute('aria-pressed', String(pressed));
    toggleText.textContent = pressed ? 'Dark mode on' : 'Dark mode off';
  }

  function applyLock(settings) {
    const schedule = NocturaSchedule.normalizeSchedule(settings.scheduledDarkMode);
    locked = !!settings.autoMatchSystemDarkMode || schedule.enabled;
    refreshLockUI();
  }

  // Reacts to settings changes (from this popup or the Settings page) while
  // the popup stays open, so the toggle's lock state and its on/off preview
  // update instantly instead of only on next popup open.
  function previewFromSettings(settings) {
    applyLock(settings);
    if (!pageAvailable) return; // let the initial GET_STATE own the first paint

    const schedule = NocturaSchedule.normalizeSchedule(settings.scheduledDarkMode);
    if (!locked) {
      if (tabOrigin) {
        chrome.storage.local.get('sites', (data) => {
          const sites = (data && data.sites) || {};
          setPressed(!!(settings.rememberPerSite && sites[tabOrigin]));
        });
      }
      return;
    }

    if (schedule.enabled) {
      setPressed(NocturaSchedule.isWithinSchedule(schedule));
    } else {
      setPressed(!!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
    }
  }

  chrome.storage.local.get('settings', (data) => {
    const settings = (data && data.settings) || {};
    const shortcut = settings.shortcut || SimpleDarkModeShortcut.DEFAULT_SHORTCUT;
    shortcutHint.textContent = SimpleDarkModeShortcut.formatShortcut(shortcut, isMac);
    applyLock(settings);
  });

  NocturaAutoModesUI.wireAutoModes({
    autoMatchToggle,
    scheduleToggle,
    scheduleFrom,
    scheduleTo,
    scheduleFields
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    previewFromSettings(changes.settings.newValue || {});
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) {
      setUnavailable('No active tab.');
      return;
    }

    let hostname = '';
    try {
      const url = new URL(tab.url);
      hostname = url.hostname;
      tabOrigin = url.origin;
    } catch (e) {
      hostname = tab.url || '';
    }
    siteHost.textContent = hostname || '—';

    if (!/^https?:/i.test(tab.url || '')) {
      setUnavailable('Not available on this page.');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setUnavailable('Reload the page to use Noctura here.');
        return;
      }
      pageAvailable = true;
      setPressed(!!response.enabled);
      refreshLockUI();
    });

    toggleBtn.addEventListener('click', () => {
      if (locked) return;
      toggleBtn.disabled = true;
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE' }, (response) => {
        toggleBtn.disabled = locked;
        if (chrome.runtime.lastError || !response) return;
        setPressed(!!response.enabled);
      });
    });
  });

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
})();
