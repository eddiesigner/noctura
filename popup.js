(function () {
  'use strict';

  const toggleBtn = document.getElementById('toggleBtn');
  const toggleText = document.getElementById('toggleText');
  const siteHost = document.getElementById('siteHost');
  const statusMsg = document.getElementById('statusMsg');
  const shortcutHint = document.getElementById('shortcutHint');
  const optionsBtn = document.getElementById('optionsBtn');

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  function setUnavailable(message) {
    toggleBtn.disabled = true;
    toggleBtn.setAttribute('aria-pressed', 'false');
    toggleText.textContent = 'Off';
    statusMsg.textContent = message;
    statusMsg.hidden = false;
  }

  function setPressed(pressed) {
    toggleBtn.setAttribute('aria-pressed', String(pressed));
    toggleText.textContent = pressed ? 'On' : 'Off';
  }

  chrome.storage.local.get('settings', (data) => {
    const shortcut = (data && data.settings && data.settings.shortcut) || SimpleDarkModeShortcut.DEFAULT_SHORTCUT;
    shortcutHint.textContent = SimpleDarkModeShortcut.formatShortcut(shortcut, isMac);
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) {
      setUnavailable('No active tab.');
      return;
    }

    let hostname = '';
    try {
      hostname = new URL(tab.url).hostname;
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
      setPressed(!!response.enabled);
    });

    toggleBtn.addEventListener('click', () => {
      toggleBtn.disabled = true;
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE' }, (response) => {
        toggleBtn.disabled = false;
        if (chrome.runtime.lastError || !response) return;
        setPressed(!!response.enabled);
      });
    });
  });

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
})();
