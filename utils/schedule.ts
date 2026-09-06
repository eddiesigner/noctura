// "Scheduled dark mode" time-range logic. Used by the content script to
// decide whether "now" falls in the configured range, and by the popup and
// options UI to normalize stored values for display.

export interface ScheduleConfig {
  enabled: boolean;
  from: string; // "HH:MM", 24h
  to: string; // "HH:MM", 24h
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  enabled: false,
  from: '20:00',
  to: '08:00',
};

export function normalizeSchedule(schedule?: Partial<ScheduleConfig> | null): ScheduleConfig {
  return { ...DEFAULT_SCHEDULE, ...schedule };
}

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(':');
  const h = parseInt(parts[0] ?? '', 10);
  const m = parseInt(parts[1] ?? '', 10);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

// Date's getHours/getMinutes are always local time, so this automatically
// follows the system clock, timezone, and DST with no extra handling.
export function isWithinSchedule(schedule: ScheduleConfig, now: Date = new Date()): boolean {
  const from = toMinutes(schedule.from);
  const to = toMinutes(schedule.to);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (from === to) return true; // zero-length wraparound: always on
  if (from < to) return nowMinutes >= from && nowMinutes < to;
  return nowMinutes >= from || nowMinutes < to; // overnight wraparound
}
