// Noctura - background service worker
// Only responsible for seeding default settings on install.
const DEFAULT_SETTINGS = {
  rememberPerSite: true,
  shortcut: { alt: true, ctrl: false, shift: false, meta: false, code: 'KeyD' }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (data) => {
    if (!data || !data.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
});
