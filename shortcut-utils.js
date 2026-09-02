// Shared shortcut matching/formatting logic, used by content.js, popup.js,
// and options.js. Uses KeyboardEvent.code (physical key), not .key, because
// on macOS holding Option/Alt rewrites .key into a different character
// (e.g. Alt+D -> "∂"), which breaks matching and displays wrong in the UI.
(function (global) {
  'use strict';

  var DEFAULT_SHORTCUT = { alt: true, ctrl: false, shift: false, meta: false, code: 'KeyD' };

  var CODE_LABELS = {
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
    Equal: '='
  };

  function codeToLabel(code) {
    if (!code) return '';
    var letter = /^Key([A-Z])$/.exec(code);
    if (letter) return letter[1];
    var digit = /^Digit([0-9])$/.exec(code);
    if (digit) return digit[1];
    if (CODE_LABELS[code]) return CODE_LABELS[code];
    return code;
  }

  function formatShortcut(shortcut, isMac) {
    if (!shortcut || !shortcut.code) return 'Not set';
    var parts = [];
    if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
    if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
    if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
    if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win');
    parts.push(codeToLabel(shortcut.code));
    return parts.join(isMac ? ' ' : ' + ');
  }

  function matchesShortcut(e, shortcut) {
    if (!shortcut || !shortcut.code) return false;
    if (e.code !== shortcut.code) return false;
    if (e.altKey !== !!shortcut.alt) return false;
    if (e.ctrlKey !== !!shortcut.ctrl) return false;
    if (e.shiftKey !== !!shortcut.shift) return false;
    if (e.metaKey !== !!shortcut.meta) return false;
    return true;
  }

  global.SimpleDarkModeShortcut = {
    DEFAULT_SHORTCUT: DEFAULT_SHORTCUT,
    codeToLabel: codeToLabel,
    formatShortcut: formatShortcut,
    matchesShortcut: matchesShortcut
  };
})(typeof window !== 'undefined' ? window : this);
