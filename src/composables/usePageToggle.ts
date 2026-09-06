import { ref, onMounted } from 'vue';
import { settingsStorage, sitesStorage, type Settings } from '@/utils/settings';
import { normalizeSchedule, isWithinSchedule } from '@/utils/schedule';

// Drives the popup's main on/off toggle for the active tab: fetches its
// live state from the content script and keeps an instant local preview in
// sync with settings changes made in this popup or the Settings page. The
// toggle always works, even while an automatic mode governs dark mode
// elsewhere — it just creates (or updates) a sticky per-site override,
// reflected here via `overridden`.
export function usePageToggle() {
  const hostname = ref('');
  const enabled = ref(false);
  const overridden = ref(false);
  const available = ref(false);
  const statusMessage = ref('');

  let tabId: number | undefined;
  let tabOrigin: string | null = null;
  let lastSettings: Settings | undefined;

  async function previewFromSettings(settings: Settings) {
    lastSettings = settings;
    const schedule = normalizeSchedule(settings.scheduledDarkMode);
    const autoActive = settings.autoMatchSystemDarkMode || schedule.enabled;

    if (!available.value) return; // let the initial GET_STATE own the first paint

    if (!autoActive) {
      overridden.value = false;
      if (tabOrigin) {
        const sites = await sitesStorage.getValue();
        enabled.value = !!(settings.rememberPerSite && sites[tabOrigin]);
      }
      return;
    }

    if (tabOrigin) {
      const sites = await sitesStorage.getValue();
      if (tabOrigin in sites) {
        overridden.value = true;
        enabled.value = !!sites[tabOrigin];
        return;
      }
    }

    overridden.value = false;
    if (schedule.enabled) {
      enabled.value = isWithinSchedule(schedule);
    } else {
      enabled.value = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }

  onMounted(async () => {
    const settings = await settingsStorage.getValue();
    lastSettings = settings;

    settingsStorage.watch((next) => void previewFromSettings(next));
    sitesStorage.watch(() => {
      if (lastSettings) void previewFromSettings(lastSettings);
    });

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
      overridden.value = !!response?.overridden;
    } catch {
      statusMessage.value = 'Reload the page to use Noctura here.';
    }
  });

  async function toggle() {
    if (!tabId) return;
    try {
      const response = await browser.tabs.sendMessage(tabId, { type: 'TOGGLE' });
      enabled.value = !!response?.enabled;
      overridden.value = !!response?.overridden;
    } catch {
      // Tab navigated away or lost its content script; nothing to do.
    }
  }

  async function clearOverride() {
    if (!tabId) return;
    try {
      const response = await browser.tabs.sendMessage(tabId, { type: 'CLEAR_OVERRIDE' });
      enabled.value = !!response?.enabled;
      overridden.value = !!response?.overridden;
    } catch {
      // Tab navigated away or lost its content script; nothing to do.
    }
  }

  return { hostname, enabled, overridden, available, statusMessage, toggle, clearOverride };
}
