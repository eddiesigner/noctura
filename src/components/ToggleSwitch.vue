<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).checked);
}
</script>

<template>
  <span class="switch">
    <input type="checkbox" :checked="modelValue" :disabled="disabled" @change="onChange" />
    <span class="switch-track"><span class="switch-thumb"></span></span>
  </span>
</template>

<style scoped>
.switch {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  cursor: pointer;
}

.switch input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}

.switch-track {
  display: block;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--accent-off);
  position: relative;
  transition: background 0.2s ease;
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}

.switch input:checked + .switch-track {
  background: var(--accent);
}

.switch input:checked + .switch-track .switch-thumb {
  transform: translateX(18px);
}

.switch input:disabled + .switch-track {
  opacity: 0.4;
}

.switch:has(input:disabled) {
  cursor: not-allowed;
}
</style>
