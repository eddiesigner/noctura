<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ToggleSwitch from '@/components/ToggleSwitch.vue';
import ScheduleFields from '@/components/ScheduleFields.vue';
import { useAutoModes } from '@/composables/useAutoModes';
import { useShortcutRecorder } from '@/composables/useShortcutRecorder';
import { useRememberedSites } from '@/composables/useRememberedSites';
import { settingsStorage, sitesStorage } from '@/utils/settings';

const {
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
} = useAutoModes();

const { recording, label: shortcutLabel, error: shortcutError, startRecording, stopRecording } =
  useShortcutRecorder();

const { origins, visible: sitesVisible, toggleVisible, deleteSite, clearAll } = useRememberedSites();

const siteCountText = computed(() =>
  origins.value.length === 1 ? '1 site currently remembered.' : `${origins.value.length} sites currently remembered.`,
);

const savedVisible = ref(false);
let savedTimeout: ReturnType<typeof setTimeout> | undefined;
function flashSaved() {
  savedVisible.value = true;
  clearTimeout(savedTimeout);
  savedTimeout = setTimeout(() => {
    savedVisible.value = false;
  }, 1200);
}

onMounted(() => {
  settingsStorage.watch(() => flashSaved());
  sitesStorage.watch(() => flashSaved());
});
</script>

<template>
  <div class="page">
    <main class="card">
      <header class="header">
        <div class="header-title">
          <img class="logo" src="/icon/48.png" alt="" />
          <div>
            <h1>Noctura</h1>
            <p class="subtitle">Settings</p>
          </div>
        </div>
        <a
          class="kofi-link"
          href="https://ko-fi.com/eddiesigner"
          target="_blank"
          rel="noopener noreferrer"
          title="Buy me a coffee on Ko-fi"
        ><span class="kofi-icon" aria-hidden="true">☕</span>Buy me a coffee</a>
      </header>

      <section class="section">
        <h2>Keyboard shortcut</h2>
        <p class="hint">Click the field, then press the key combination you want. Used to toggle dark mode on the page you're viewing.</p>
        <button
          class="shortcut-input"
          :class="{ recording }"
          type="button"
          @click="!recording && startRecording()"
          @blur="stopRecording"
        >{{ recording ? 'Press a key combination…' : shortcutLabel }}</button>
        <p v-if="shortcutError" class="error">{{ shortcutError }}</p>
      </section>

      <section class="section">
        <div class="row">
          <div>
            <h2>Remember per website</h2>
            <p class="hint">Keep dark mode on for a site the next time you visit, until you toggle it off again.</p>
          </div>
          <label class="switch-label" :class="{ disabled: rememberDisabled }">
            <ToggleSwitch
              :model-value="rememberOn"
              :disabled="rememberDisabled"
              @update:model-value="setRemember"
            />
          </label>
        </div>

        <div class="row row-divided">
          <div>
            <h2>Match system dark mode</h2>
            <p class="hint">Automatically match dark mode on any site to your OS setting. While this is on, the shortcut and popup toggle are disabled — every page just follows the OS preference.</p>
          </div>
          <label class="switch-label" :class="{ disabled: autoMatchDisabled }">
            <ToggleSwitch
              :model-value="autoMatchOn"
              :disabled="autoMatchDisabled"
              @update:model-value="setAutoMatch"
            />
          </label>
        </div>

        <div class="row row-divided">
          <div>
            <h2>Scheduled dark mode</h2>
            <p class="hint">Automatically switch to dark mode during a daily time range. Mutually exclusive with "Match system dark mode."</p>
          </div>
          <label class="switch-label" :class="{ disabled: scheduleDisabled }">
            <ToggleSwitch
              :model-value="scheduleOn"
              :disabled="scheduleDisabled"
              @update:model-value="setSchedule"
            />
          </label>
        </div>
        <ScheduleFields
          :from="scheduleFrom"
          :to="scheduleTo"
          :visible="scheduleOn"
          @change="setScheduleTimes"
        />
      </section>

      <section class="section">
        <div class="row">
          <div>
            <h2>Remembered sites</h2>
            <p class="hint">{{ siteCountText }}</p>
          </div>
          <div v-if="origins.length" class="button-group">
            <button class="secondary-btn neutral" type="button" @click="toggleVisible">
              {{ sitesVisible ? 'Hide sites' : 'Show sites' }}
            </button>
            <button class="secondary-btn" type="button" @click="clearAll">Clear all</button>
          </div>
        </div>
        <ul v-if="sitesVisible" class="site-list">
          <li v-for="origin in origins" :key="origin" class="site-list-item">
            <span class="site-list-origin">{{ origin }}</span>
            <button
              type="button"
              class="site-delete-btn"
              :title="`Forget ${origin}`"
              :aria-label="`Forget ${origin}`"
              @click="deleteSite(origin)"
            >×</button>
          </li>
        </ul>
      </section>

      <p class="saved-msg" :class="{ visible: savedVisible }">Saved</p>
    </main>
  </div>
</template>

<style scoped>
.page {
  padding: 32px 16px;
  display: flex;
  justify-content: center;
}

.card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 36px;
  height: 36px;
}

.header h1 {
  margin: 0;
  font-size: 18px;
}

.subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.kofi-link {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  background: rgba(124, 139, 255, 0.12);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.kofi-link:hover {
  background: var(--accent);
  color: #14141c;
}

.kofi-icon {
  font-size: 14px;
}

.section {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.section h2 {
  margin: 0 0 4px;
  font-size: 14px;
}

.hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.row .hint {
  margin-bottom: 0;
}

.row-divided {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.switch-label {
  flex-shrink: 0;
}

.switch-label.disabled {
  cursor: not-allowed;
}

.shortcut-input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.shortcut-input:hover {
  border-color: var(--accent);
}

.shortcut-input.recording {
  border-color: var(--accent);
  background: rgba(124, 139, 255, 0.12);
}

.error {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--danger);
}

.secondary-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.secondary-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.secondary-btn.neutral:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.button-group {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.site-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 8px 0 0;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 160px;
  overflow-y: auto;
}

.site-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.site-list-origin {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text);
  word-break: break-all;
}

.site-delete-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  padding: 0;
  font-size: 15px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.site-delete-btn:hover {
  opacity: 1;
  color: var(--danger);
}

.saved-msg {
  text-align: center;
  font-size: 12px;
  color: var(--accent);
  margin: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.saved-msg.visible {
  opacity: 1;
}
</style>
