import { storage } from 'wxt/utils/storage';
import { DEFAULT_SCHEDULE, type ScheduleConfig } from './schedule';
import { DEFAULT_SHORTCUT, type ShortcutConfig } from './shortcut';
import { DEFAULT_THEME, type ThemeId } from './theme';

export interface Settings {
  rememberPerSite: boolean;
  autoMatchSystemDarkMode: boolean;
  scheduledDarkMode: ScheduleConfig;
  shortcut: ShortcutConfig;
  theme: ThemeId;
}

export const DEFAULT_SETTINGS: Settings = {
  rememberPerSite: true,
  autoMatchSystemDarkMode: false,
  scheduledDarkMode: DEFAULT_SCHEDULE,
  shortcut: DEFAULT_SHORTCUT,
  theme: DEFAULT_THEME,
};

// A single stored object (rather than one storage item per field) so a
// change to any one setting is still one atomic read-modify-write, and
// `.watch()` delivers the full, current settings every time.
export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});

// origin (e.g. "https://example.com") -> remembered dark-mode-on
export type Sites = Record<string, boolean>;

export const sitesStorage = storage.defineItem<Sites>('local:sites', {
  fallback: {},
});
