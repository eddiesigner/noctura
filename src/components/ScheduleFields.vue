<script setup lang="ts">
const props = defineProps<{
  from: string;
  to: string;
  visible: boolean;
}>();

const emit = defineEmits<{ change: [from: string, to: string] }>();

function onFromChange(e: Event) {
  emit('change', (e.target as HTMLInputElement).value, props.to);
}

function onToChange(e: Event) {
  emit('change', props.from, (e.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="schedule-fields" :hidden="!visible">
    <div class="schedule-field">
      <span class="schedule-label">From</span>
      <input type="time" class="time-input" :value="from" @change="onFromChange" />
    </div>
    <div class="schedule-field">
      <span class="schedule-label">To</span>
      <input type="time" class="time-input" :value="to" @change="onToChange" />
    </div>
  </div>
</template>

<style scoped>
.schedule-fields {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.schedule-fields[hidden] {
  display: none;
}

.schedule-field {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.schedule-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.time-input {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
}
</style>
