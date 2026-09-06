// Keyboard shortcut matching/formatting, shared by the content script, popup,
// and options page. Matches on KeyboardEvent.code (physical key), not .key,
// because on macOS holding Option/Alt rewrites .key into a different
// character (e.g. Alt+D -> "∂"), which breaks matching and displays wrong.

export interface ShortcutConfig {
  alt: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  code: string;
}

export const DEFAULT_SHORTCUT: ShortcutConfig = {
  alt: true,
  ctrl: false,
  shift: false,
  meta: false,
  code: 'KeyD',
};

const CODE_LABELS: Record<string, string> = {
  Space: 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'Esc',
  Enter: 'Enter',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  Minus: '-',
  Equal: '=',
};

export function codeToLabel(code: string): string {
  if (!code) return '';
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter?.[1]) return letter[1];
  const digit = /^Digit([0-9])$/.exec(code);
  if (digit?.[1]) return digit[1];
  if (CODE_LABELS[code]) return CODE_LABELS[code];
  return code;
}

export function formatShortcut(shortcut: ShortcutConfig | null | undefined, isMac: boolean): string {
  if (!shortcut || !shortcut.code) return 'Not set';
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win');
  parts.push(codeToLabel(shortcut.code));
  return parts.join(isMac ? ' ' : ' + ');
}

export function matchesShortcut(e: KeyboardEvent, shortcut: ShortcutConfig | null | undefined): boolean {
  if (!shortcut || !shortcut.code) return false;
  if (e.code !== shortcut.code) return false;
  if (e.altKey !== !!shortcut.alt) return false;
  if (e.ctrlKey !== !!shortcut.ctrl) return false;
  if (e.shiftKey !== !!shortcut.shift) return false;
  if (e.metaKey !== !!shortcut.meta) return false;
  return true;
}

export function isMacPlatform(): boolean {
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}
