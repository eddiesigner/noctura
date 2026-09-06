<script setup lang="ts">
import { REVERSIBLE_FILTER, type ThemePreset } from '@/utils/theme';

defineProps<{
  preset: ThemePreset;
  selected: boolean;
}>();

defineEmits<{ select: [] }>();
</script>

<template>
  <button type="button" class="theme-option" :class="{ selected }" @click="$emit('select')">
    <span class="theme-swatch" :style="{ filter: preset.filter }">
      <span class="swatch-page">
        <span class="swatch-text">
          <span class="swatch-line"></span>
          <span class="swatch-line short"></span>
          <span class="swatch-accent"></span>
        </span>
        <span class="swatch-photo" :style="{ filter: REVERSIBLE_FILTER }"></span>
      </span>
    </span>
    <span class="theme-label">{{ preset.label }}</span>
  </button>
</template>

<style scoped>
.theme-option {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.theme-option:hover {
  border-color: var(--accent);
}

.theme-option.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.theme-swatch {
  width: 100%;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
}

.swatch-page {
  width: 100%;
  height: 100%;
  background: #f4f4f6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
}

.swatch-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.swatch-line {
  height: 4px;
  width: 100%;
  border-radius: 2px;
  background: #2a2a33;
}

.swatch-line.short {
  width: 65%;
}

.swatch-accent {
  height: 6px;
  width: 45%;
  border-radius: 3px;
  background: #4f7cff;
}

.swatch-photo {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(135deg, #ff8a5c, #4f7cff 55%, #34d399);
}

.theme-label {
  font-size: 11px;
  color: var(--text-muted);
}

.theme-option.selected .theme-label {
  color: var(--text);
  font-weight: 600;
}
</style>
