import { ref, computed, onMounted, onUnmounted } from 'vue';
import { settingsStorage, type Settings } from '@/utils/settings';
import { normalizeSchedule } from '@/utils/schedule';

// Shared reactive state + mutation rules for "Remember per website", "Match
// system dark mode", and "Scheduled dark mode". These three interact (the
// two automatic modes are mutually exclusive, and either one locks
// "Remember per website"), so both the popup and options page drive them
// through this single composable instead of duplicating the rules twice.
export function useAutoModes() {
  const autoMatchOn = ref(false);
  const scheduleOn = ref(false);
  const scheduleFrom = ref('20:00');
  const scheduleTo = ref('08:00');
  const rememberOn = ref(true);

  const autoMatchDisabled = computed(() => scheduleOn.value);
  const scheduleDisabled = computed(() => autoMatchOn.value);
  const rememberDisabled = computed(() => autoMatchOn.value || scheduleOn.value);

  function applyFromSettings(settings: Settings) {
    const schedule = normalizeSchedule(settings.scheduledDarkMode);
    autoMatchOn.value = settings.autoMatchSystemDarkMode;
    scheduleOn.value = schedule.enabled;
    scheduleFrom.value = schedule.from;
    scheduleTo.value = schedule.to;
    rememberOn.value = settings.rememberPerSite;
  }

  let unwatch: (() => void) | undefined;

  onMounted(async () => {
    applyFromSettings(await settingsStorage.getValue());
    unwatch = settingsStorage.watch((next) => applyFromSettings(next));
  });

  onUnmounted(() => unwatch?.());

  // Always merges onto the latest storage state (not a possibly-stale local
  // snapshot), so concurrent changes from the other surface (popup vs
  // options open at the same time) can't clobber each other.
  async function save(mutate: (settings: Settings) => Settings) {
    const current = await settingsStorage.getValue();
    const next = mutate({
      ...current,
      scheduledDarkMode: normalizeSchedule(current.scheduledDarkMode),
    });
    await settingsStorage.setValue(next);
    applyFromSettings(next); // instant local feedback; watch() will confirm it
  }

  function setAutoMatch(value: boolean) {
    void save((settings) => ({
      ...settings,
      autoMatchSystemDarkMode: value,
      scheduledDarkMode: {
        ...settings.scheduledDarkMode,
        enabled: value ? false : settings.scheduledDarkMode.enabled,
      },
    }));
  }

  function setSchedule(value: boolean) {
    void save((settings) => ({
      ...settings,
      autoMatchSystemDarkMode: value ? false : settings.autoMatchSystemDarkMode,
      scheduledDarkMode: { ...settings.scheduledDarkMode, enabled: value },
    }));
  }

  function setScheduleTimes(from: string, to: string) {
    if (!from || !to) return;
    void save((settings) => ({
      ...settings,
      scheduledDarkMode: { ...settings.scheduledDarkMode, from, to },
    }));
  }

  function setRemember(value: boolean) {
    void save((settings) => ({ ...settings, rememberPerSite: value }));
  }

  return {
    autoMatchOn,
    scheduleOn,
    scheduleFrom,
    scheduleTo,
    rememberOn,
    autoMatchDisabled,
    scheduleDisabled,
    rememberDisabled,
    setAutoMatch,
    setSchedule,
    setScheduleTimes,
    setRemember,
  };
}
