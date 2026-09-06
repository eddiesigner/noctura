import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // Default is ".output" — macOS's native folder picker hides dotfiles by
  // default, which makes "Load unpacked" in Arc/Chrome annoying to point at
  // it. A plain, visible folder name avoids that friction.
  outDir: 'output',
  // Keeps all source code (entrypoints/, components/, composables/, utils/,
  // assets/) together under src/, separate from config files at the root.
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Noctura',
    description:
      'Toggle a clean, on-demand dark mode for any website with one click or a keyboard shortcut. Images and videos are left untouched.',
    permissions: ['storage', 'activeTab', 'alarms'],
    browser_specific_settings: {
      gecko: {
        id: 'noctura@local.test',
        strict_min_version: '109.0',
      },
    },
  },
});
