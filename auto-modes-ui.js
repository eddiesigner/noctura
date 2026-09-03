// Noctura - shared wiring for "Remember per website", "Match system dark
// mode", and "Scheduled dark mode". These three interact (the two automatic
// modes are mutually exclusive, and either one locks "Remember per
// website"), so both popup.js and options.js drive them through this single
// implementation instead of duplicating the rules twice.
(function (global) {
  'use strict';

  // els: {
  //   autoMatchToggle, scheduleToggle, scheduleFrom, scheduleTo,
  //   scheduleFields, rememberToggle (optional - popup omits it)
  // }
  function wireAutoModes(els) {
    function refreshUI(settings) {
      const autoOn = !!settings.autoMatchSystemDarkMode;
      const schedule = NocturaSchedule.normalizeSchedule(settings.scheduledDarkMode);

      els.autoMatchToggle.checked = autoOn;
      els.autoMatchToggle.disabled = schedule.enabled;

      els.scheduleToggle.checked = schedule.enabled;
      els.scheduleToggle.disabled = autoOn;
      els.scheduleFrom.value = schedule.from;
      els.scheduleTo.value = schedule.to;
      els.scheduleFields.hidden = !schedule.enabled;

      if (els.rememberToggle) {
        els.rememberToggle.disabled = autoOn || schedule.enabled;
      }
    }

    function save(mutate) {
      chrome.storage.local.get('settings', (data) => {
        const current = Object.assign({}, data && data.settings, {
          scheduledDarkMode: NocturaSchedule.normalizeSchedule(data && data.settings && data.settings.scheduledDarkMode)
        });
        const next = mutate(current);
        chrome.storage.local.set({ settings: next }, () => {
          refreshUI(next);
          NocturaBroadcast.broadcastSettingsToAllTabs(next);
        });
      });
    }

    els.autoMatchToggle.addEventListener('change', () => {
      const turningOn = els.autoMatchToggle.checked;
      save((settings) => Object.assign({}, settings, {
        autoMatchSystemDarkMode: turningOn,
        scheduledDarkMode: Object.assign({}, settings.scheduledDarkMode, {
          enabled: turningOn ? false : settings.scheduledDarkMode.enabled
        })
      }));
    });

    els.scheduleToggle.addEventListener('change', () => {
      const turningOn = els.scheduleToggle.checked;
      save((settings) => Object.assign({}, settings, {
        autoMatchSystemDarkMode: turningOn ? false : settings.autoMatchSystemDarkMode,
        scheduledDarkMode: Object.assign({}, settings.scheduledDarkMode, { enabled: turningOn })
      }));
    });

    function saveTimeRange() {
      if (!els.scheduleFrom.value || !els.scheduleTo.value) return;
      save((settings) => Object.assign({}, settings, {
        scheduledDarkMode: Object.assign({}, settings.scheduledDarkMode, {
          from: els.scheduleFrom.value,
          to: els.scheduleTo.value
        })
      }));
    }

    els.scheduleFrom.addEventListener('change', saveTimeRange);
    els.scheduleTo.addEventListener('change', saveTimeRange);

    if (els.rememberToggle) {
      els.rememberToggle.addEventListener('change', () => {
        save((settings) => Object.assign({}, settings, {
          rememberPerSite: els.rememberToggle.checked
        }));
      });
    }

    chrome.storage.local.get('settings', (data) => {
      const settings = Object.assign({}, data && data.settings, {
        scheduledDarkMode: NocturaSchedule.normalizeSchedule(data && data.settings && data.settings.scheduledDarkMode)
      });
      if (els.rememberToggle) {
        els.rememberToggle.checked = !!settings.rememberPerSite;
      }
      refreshUI(settings);
    });
  }

  global.NocturaAutoModesUI = { wireAutoModes };
})(typeof window !== 'undefined' ? window : this);
