import { settingsStorage, type Settings } from '@/utils/settings';

// Manages the periodic alarm that powers "Scheduled dark mode". MV3 service
// workers can be terminated after ~30s idle, so a plain setTimeout here
// can't reliably survive until, say, 8pm — chrome.alarms is the platform's
// mechanism for a wake-up that persists across worker restarts.
const SCHEDULE_ALARM = 'noctura-schedule-check';

export default defineBackground(() => {
  async function syncScheduleAlarm(settings: Settings) {
    if (settings.scheduledDarkMode.enabled) {
      await browser.alarms.create(SCHEDULE_ALARM, { periodInMinutes: 1 });
    } else {
      await browser.alarms.clear(SCHEDULE_ALARM);
    }
  }

  browser.runtime.onStartup.addListener(async () => {
    syncScheduleAlarm(await settingsStorage.getValue());
  });

  // Keeps the alarm in sync any time the popup or settings page saves a
  // change, without either needing to know the alarms API exists.
  settingsStorage.watch((settings) => {
    void syncScheduleAlarm(settings);
  });

  // Covers the very first run too (onStartup doesn't fire on install).
  settingsStorage.getValue().then(syncScheduleAlarm);

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== SCHEDULE_ALARM) return;
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id) continue;
      browser.tabs.sendMessage(tab.id, { type: 'RECHECK_SCHEDULE' }).catch(() => {
        // Ignore tabs without our content script (chrome://, web store, etc.)
      });
    }
  });
});
