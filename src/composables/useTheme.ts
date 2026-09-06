import { ref, onMounted, onUnmounted } from 'vue';
import { settingsStorage } from '@/utils/settings';
import { DEFAULT_THEME, type ThemeId } from '@/utils/theme';

export function useTheme() {
  const theme = ref<ThemeId>(DEFAULT_THEME);

  let unwatch: (() => void) | undefined;

  onMounted(async () => {
    const settings = await settingsStorage.getValue();
    theme.value = settings.theme ?? DEFAULT_THEME;
    unwatch = settingsStorage.watch((next) => {
      theme.value = next.theme ?? DEFAULT_THEME;
    });
  });

  onUnmounted(() => unwatch?.());

  async function setTheme(next: ThemeId) {
    const current = await settingsStorage.getValue();
    await settingsStorage.setValue({ ...current, theme: next });
    theme.value = next; // instant local feedback
  }

  return { theme, setTheme };
}
