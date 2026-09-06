import { ref, onMounted } from 'vue';
import { sitesStorage } from '@/utils/settings';

export function useRememberedSites() {
  const origins = ref<string[]>([]);
  const visible = ref(false);

  function refresh(sites: Record<string, boolean>) {
    origins.value = Object.keys(sites).sort();
    if (origins.value.length === 0) {
      visible.value = false;
    }
  }

  onMounted(async () => {
    refresh(await sitesStorage.getValue());
    sitesStorage.watch((next) => refresh(next));
  });

  function toggleVisible() {
    visible.value = !visible.value;
  }

  async function deleteSite(origin: string) {
    const sites = await sitesStorage.getValue();
    delete sites[origin];
    await sitesStorage.setValue(sites);
  }

  async function clearAll() {
    await sitesStorage.setValue({});
  }

  return { origins, visible, toggleVisible, deleteSite, clearAll };
}
