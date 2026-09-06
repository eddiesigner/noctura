import { ref, onMounted } from 'vue';
import { settingsStorage, sitesStorage, type Settings } from '@/utils/settings';
import { normalizeSchedule, isWithinSchedule } from '@/utils/schedule';

const LOCKED_MSG = 'Dark mode is controlled automatically by one of the settings below.';

// Drives the popup's main on/off toggle for the active tab: fetches its
// live state from the content script, locks it out while an automatic mode
// owns the page, and keeps an instant local preview in sync with settings
// changes made in this popup or the Settings page.
export function usePageToggle() {
  const hostname = ref('');
  const enabled = ref(false);
  const locked = ref(false);
  const available = ref(false);
  const statusMessage = ref('');

  let tabId: number | undefined;
  let tabOrigin: string | null = null;

  function refreshLockMessage() {
    statusMessage.value = locked.value ? LOCKED_MSG : '';
  }

  async function previewFromSettings(settings: Settings) {
    const schedule = normalizeSchedule(settings.scheduledDarkMode);
    locked.value = settings.autoMatchSystemDarkMode || schedule.enabled;
    refreshLockMessage();

    if (!available.value) return; // let the initial GET_STATE own the first paint

    if (!locked.value) {
      if (tabOrigin) {
        const sites = await sitesStorage.getValue();
        enabled.value = !!(settings.rememberPerSite && sites[tabOrigin]);
      }
      return;
    }

    if (schedule.enabled) {
      enabled.value = isWithinSchedule(schedule);
    } else {
      enabled.value = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }

  onMounted(async () => {
    const settings = await settingsStorage.getValue();
    const schedule = normalizeSchedule(settings.scheduledDarkMode);
    locked.value = settings.autoMatchSystemDarkMode || schedule.enabled;
    refreshLockMessage();

    settingsStorage.watch((next) => void previewFromSettings(next));

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      statusMessage.value = 'No active tab.';
      return;
    }
    tabId = tab.id;

    try {
      const url = new URL(tab.url ?? '');
      hostname.value = url.hostname;
      tabOrigin = url.origin;
    } catch {
      hostname.value = tab.url ?? '';
    }

    if (!/^https?:/i.test(tab.url ?? '')) {
      statusMessage.value = 'Not available on this page.';
      return;
    }

    try {
      const response = await browser.tabs.sendMessage(tabId, { type: 'GET_STATE' });
      available.value = true;
      enabled.value = !!response?.enabled;
      refreshLockMessage();
    } catch {
      statusMessage.value = 'Reload the page to use Noctura here.';
    }
  });

  async function toggle() {
    if (locked.value || !tabId) return;
    try {
      const response = await browser.tabs.sendMessage(tabId, { type: 'TOGGLE' });
      enabled.value = !!response?.enabled;
    } catch {
      // Tab navigated away or lost its content script; nothing to do.
    }
  }

  return { hostname, enabled, locked, available, statusMessage, toggle };
}
