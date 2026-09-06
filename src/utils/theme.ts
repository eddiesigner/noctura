// Dark mode "themes" — different filter recipes applied whenever dark mode
// is on, independent of which trigger turned it on (manual, remembered,
// Match system, or Scheduled).
//
// The invert+hue-rotate pair is reversible (apply it twice and you're back
// to the original), which is what lets media elements cancel it out and
// stay untouched. grayscale()/sepia() are NOT reversible that way — once
// desaturated/tinted, a child element can't "undo" it. So every theme keeps
// the same reversible base, and only adds a one-way grayscale/sepia on top
// of it; media elements always cancel just the reversible part (see
// content.ts), meaning they end up grayscale/sepia-tinted too in those
// themes, the same as the rest of the page. That matches how similar modes
// work in other dark mode extensions.
export type ThemeId = 'classic' | 'grayscale' | 'sepia';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  /** Full filter value applied to <html> when this theme is active. */
  filter: string;
}

// Cancelled by media elements' own filter (see content.ts) so they stay
// untouched under the "classic" theme.
export const REVERSIBLE_FILTER = 'invert(1) hue-rotate(180deg)';

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'classic', label: 'Classic', filter: REVERSIBLE_FILTER },
  { id: 'grayscale', label: 'Grayscale', filter: `${REVERSIBLE_FILTER} grayscale(1)` },
  { id: 'sepia', label: 'Sepia', filter: `${REVERSIBLE_FILTER} sepia(0.6)` },
];

export const DEFAULT_THEME: ThemeId = 'classic';

export function getThemeFilter(theme: ThemeId | null | undefined): string {
  return THEME_PRESETS.find((preset) => preset.id === theme)?.filter ?? REVERSIBLE_FILTER;
}
