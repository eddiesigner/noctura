// Noctura - broadcasts a settings update to every open tab so content
// scripts can re-apply dark mode live, without needing a page reload.
(function (global) {
  'use strict';

  function broadcastSettingsToAllTabs(settings) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings }, () => {
          void chrome.runtime.lastError; // ignore tabs without our content script
        });
      }
    });
  }

  global.NocturaBroadcast = { broadcastSettingsToAllTabs };
})(typeof window !== 'undefined' ? window : this);
