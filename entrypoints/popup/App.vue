<script setup lang="ts">
import { computed } from 'vue';
import ToggleSwitch from '@/components/ToggleSwitch.vue';
import ScheduleFields from '@/components/ScheduleFields.vue';
import { useAutoModes } from '@/composables/useAutoModes';
import { usePageToggle } from '@/composables/usePageToggle';
import { settingsStorage } from '@/utils/settings';
import { formatShortcut, isMacPlatform, DEFAULT_SHORTCUT } from '@/utils/shortcut';
import { ref, onMounted } from 'vue';

const {
  autoMatchOn,
  scheduleOn,
  scheduleFrom,
  scheduleTo,
  autoMatchDisabled,
  scheduleDisabled,
  setAutoMatch,
  setSchedule,
  setScheduleTimes,
} = useAutoModes();

const { hostname, enabled, locked, statusMessage, toggle } = usePageToggle();

const toggleDisabled = computed(() => locked.value);

const shortcutHint = ref('⌥ D');
onMounted(async () => {
  const settings = await settingsStorage.getValue();
  shortcutHint.value = formatShortcut(settings.shortcut ?? DEFAULT_SHORTCUT, isMacPlatform());
});

function openSettings() {
  browser.runtime.openOptionsPage();
}
</script>

<template>
  <main class="card">
    <header class="header">
      <img class="logo" src="/icon/32.png" alt="" />
      <h1>Noctura</h1>
    </header>

    <div class="site-row">
      <span class="site-label">This site</span>
      <span class="site-host">{{ hostname || '—' }}</span>
    </div>

    <button
      class="toggle"
      type="button"
      :aria-pressed="enabled"
      :disabled="toggleDisabled"
      @click="toggle"
    >
      <span class="toggle-track">
        <span class="toggle-thumb"></span>
      </span>
      <span class="toggle-text">{{ enabled ? 'Dark mode on' : 'Dark mode off' }}</span>
    </button>

    <p v-if="statusMessage" class="status-msg">{{ statusMessage }}</p>

    <label class="setting-row" :class="{ disabled: autoMatchDisabled }">
      <span class="setting-label">Match system dark mode</span>
      <ToggleSwitch
        :model-value="autoMatchOn"
        :disabled="autoMatchDisabled"
        @update:model-value="setAutoMatch"
      />
    </label>

    <label class="setting-row" :class="{ disabled: scheduleDisabled }">
      <span class="setting-label">Scheduled dark mode</span>
      <ToggleSwitch
        :model-value="scheduleOn"
        :disabled="scheduleDisabled"
        @update:model-value="setSchedule"
      />
    </label>
    <ScheduleFields
      :from="scheduleFrom"
      :to="scheduleTo"
      :visible="scheduleOn"
      @change="setScheduleTimes"
    />

    <footer class="footer">
      <span class="shortcut-hint">{{ shortcutHint }}</span>
      <button class="link-btn" type="button" @click="openSettings">Settings</button>
    </footer>
  </main>
</template>

<style scoped>
.card {
  width: 260px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  width: 22px;
  height: 22px;
}

.header h1 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.2px;
}

.site-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
}

.site-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.site-host {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.toggle:hover {
  border-color: var(--accent);
}

.toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toggle-track {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--accent-off);
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}

.toggle[aria-pressed='true'] .toggle-track {
  background: var(--accent);
}

.toggle[aria-pressed='true'] .toggle-thumb {
  transform: translateX(18px);
}

.toggle-text {
  order: -1;
}

.status-msg {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  margin: -6px 0 0;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 12px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.setting-row:hover {
  border-color: var(--accent);
}

.setting-row.disabled {
  cursor: not-allowed;
}

.setting-row.disabled:hover {
  border-color: var(--border);
}

.setting-label {
  font-size: 12px;
  font-weight: 500;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid var(--border);
}

.shortcut-hint {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}
</style>
