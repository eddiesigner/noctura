// Noctura - background service worker
// Seeds default settings on install and manages the periodic alarm that
// powers "Scheduled dark mode". MV3 service workers can be terminated after
// ~30s idle, so a plain setTimeout here can't reliably survive until, say,
// 8pm — chrome.alarms is the platform's mechanism for a wake-up that
// persists across worker restarts.
if (typeof importScripts === 'function') {
  importScripts('broadcast-utils.js');
}

const DEFAULT_SETTINGS = {
  rememberPerSite: true,
  autoMatchSystemDarkMode: false,
  scheduledDarkMode: { enabled: false, from: '20:00', to: '08:00' },
  shortcut: { alt: true, ctrl: false, shift: false, meta: false, code: 'KeyD' }
};

const SCHEDULE_ALARM = 'noctura-schedule-check';

function syncScheduleAlarm(settings) {
  const scheduleOn = !!(settings && settings.scheduledDarkMode && settings.scheduledDarkMode.enabled);
  if (scheduleOn) {
    chrome.alarms.create(SCHEDULE_ALARM, { periodInMinutes: 1 });
  } else {
    chrome.alarms.clear(SCHEDULE_ALARM);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (data) => {
    if (!data || !data.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS }, () => syncScheduleAlarm(DEFAULT_SETTINGS));
    } else {
      syncScheduleAlarm(data.settings);
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('settings', (data) => {
    syncScheduleAlarm((data && data.settings) || DEFAULT_SETTINGS);
  });
});

// Keeps the alarm in sync any time the popup or settings page saves a
// change, without either of them needing to know the alarms API exists.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  syncScheduleAlarm(changes.settings.newValue);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== SCHEDULE_ALARM) return;
  chrome.storage.local.get('settings', (data) => {
    NocturaBroadcast.broadcastSettingsToAllTabs((data && data.settings) || DEFAULT_SETTINGS);
  });
});
