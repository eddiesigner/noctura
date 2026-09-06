import { ref, onMounted, onUnmounted } from 'vue';
import { settingsStorage } from '@/utils/settings';
import { formatShortcut, isMacPlatform, type ShortcutConfig } from '@/utils/shortcut';

const IGNORED_CODES = new Set([
  'ControlLeft', 'ControlRight',
  'AltLeft', 'AltRight',
  'ShiftLeft', 'ShiftRight',
  'MetaLeft', 'MetaRight',
  'Escape', 'Tab',
]);

export function useShortcutRecorder() {
  const isMac = isMacPlatform();
  const recording = ref(false);
  const label = ref('');
  const error = ref('');

  async function refreshLabel() {
    const settings = await settingsStorage.getValue();
    label.value = formatShortcut(settings.shortcut, isMac);
  }

  function startRecording() {
    recording.value = true;
    error.value = '';
  }

  function stopRecording() {
    recording.value = false;
  }

  async function handleKeydown(e: KeyboardEvent) {
    if (!recording.value) return;
    e.preventDefault();

    if (e.code === 'Escape') {
      stopRecording();
      return;
    }
    if (IGNORED_CODES.has(e.code)) return; // wait for a real key

    const hasModifier = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
    if (!hasModifier) {
      error.value = 'Include at least one modifier key (Alt, Ctrl, Shift, or Cmd) to avoid clashing with normal typing.';
      return;
    }

    const shortcut: ShortcutConfig = {
      alt: e.altKey,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      meta: e.metaKey,
      code: e.code,
    };

    error.value = '';
    stopRecording();

    const current = await settingsStorage.getValue();
    await settingsStorage.setValue({ ...current, shortcut });
  }

  onMounted(async () => {
    await refreshLabel();
    settingsStorage.watch(() => void refreshLabel());
    document.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
  });

  return { recording, label, error, startRecording, stopRecording };
}
