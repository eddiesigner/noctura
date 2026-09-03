// Noctura - shared "scheduled dark mode" time-range logic. Used by
// content.js to decide whether "now" falls in the configured range, and by
// popup.js/options.js to normalize stored values for display.
(function (global) {
  'use strict';

  const DEFAULT_SCHEDULE = { enabled: false, from: '20:00', to: '08:00' };

  function normalizeSchedule(schedule) {
    return Object.assign({}, DEFAULT_SCHEDULE, schedule);
  }

  function toMinutes(hhmm) {
    const parts = String(hhmm).split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  }

  // Date's getHours/getMinutes are always local time, so this automatically
  // follows the system clock, timezone, and DST with no extra handling.
  function isWithinSchedule(schedule, now) {
    const from = toMinutes(schedule.from);
    const to = toMinutes(schedule.to);
    const date = now || new Date();
    const nowMinutes = date.getHours() * 60 + date.getMinutes();

    if (from === to) return true; // zero-length wraparound: always on
    if (from < to) return nowMinutes >= from && nowMinutes < to;
    return nowMinutes >= from || nowMinutes < to; // overnight wraparound
  }

  global.NocturaSchedule = { DEFAULT_SCHEDULE, normalizeSchedule, isWithinSchedule };
})(typeof window !== 'undefined' ? window : this);
