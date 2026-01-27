/**
 * Keyboard shortcut utilities
 * Handlers for global and local keyboard shortcuts
 */

import { useEffect, useCallback, useRef } from "react";

export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  handler: (e: KeyboardEvent) => void;
};

export type ShortcutConfig = Omit<KeyboardShortcut, "handler"> & {
  action: () => void;
};

/**
 * Check if the platform is macOS
 */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toLowerCase().includes("mac");
}

/**
 * Get the modifier key symbol for the current platform
 */
export function getModifierSymbol(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(
  key: string,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): string {
  const parts: string[] = [];
  const modifier = getModifierSymbol();

  if (options.ctrl || options.alt) {
    parts.push(modifier);
  }
  if (options.shift) {
    parts.push("Shift");
  }
  parts.push(key);

  return parts.join(isMac() ? "" : "+");
}

/**
 * Hook to handle global keyboard shortcuts
 */
export function useGlobalShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const isMatch =
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!e.ctrlKey === !!shortcut.ctrl &&
          !!e.metaKey === !!shortcut.meta &&
          !!e.shiftKey === !!shortcut.shift &&
          !!e.altKey === !!shortcut.alt;

        if (isMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * Hook to handle keyboard shortcuts on a specific element
 */
export function useElementShortcuts(
  ref: React.RefObject<HTMLElement>,
  shortcuts: ShortcutConfig[]
) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const isMatch =
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!e.ctrlKey === !!shortcut.ctrl &&
          !!e.metaKey === !!shortcut.meta &&
          !!e.shiftKey === !!shortcut.shift &&
          !!e.altKey === !!shortcut.alt;

        if (isMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);
    return () => element.removeEventListener("keydown", handleKeyDown);
  }, [ref]);
}

/**
 * Hook to handle Escape key press
 */
export function useEscapeKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handler();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handler, enabled]);
}

/**
 * Hook to handle Enter key press
 */
export function useEnterKey(
  handler: () => void,
  options: { shift?: boolean; ctrl?: boolean; meta?: boolean } = {},
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        !!e.shiftKey === !!options.shift &&
        !!e.ctrlKey === !!options.ctrl &&
        !!e.metaKey === !!options.meta
      ) {
        handler();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handler, options, enabled]);
}

/**
 * Hook to detect if a modifier key is pressed
 */
export function useModifierKey(
  key: "ctrl" | "meta" | "shift" | "alt"
): boolean {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (key === "ctrl" && e.ctrlKey) ||
        (key === "meta" && e.metaKey) ||
        (key === "shift" && e.shiftKey) ||
        (key === "alt" && e.altKey)
      ) {
        setIsPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        (key === "ctrl" && !e.ctrlKey) ||
        (key === "meta" && !e.metaKey) ||
        (key === "shift" && !e.shiftKey) ||
        (key === "alt" && !e.altKey)
      ) {
        setIsPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [key]);

  return isPressed;
}

// Need to import useState
import { useState } from "react";

/**
 * Common keyboard shortcuts for the app
 */
export const APP_SHORTCUTS = {
  search: { key: "k", meta: true, ctrl: true },
  newTask: { key: "n", meta: true, ctrl: true },
  close: { key: "Escape" },
  complete: { key: " ", ctrl: true },
  delete: { key: "Delete", shift: true },
  edit: { key: "e", meta: true, ctrl: true },
  save: { key: "s", meta: true, ctrl: true },
  navigateUp: { key: "ArrowUp", alt: true },
  navigateDown: { key: "ArrowDown", alt: true },
  focusSearch: { key: "/" },
  toggleSidebar: { key: "b", meta: true, ctrl: true },
} as const;

/**
 * Create shortcut handlers for the main app
 */
export function createAppShortcutHandlers(handlers: {
  onSearch?: () => void;
  onNewTask?: () => void;
  onClose?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onToggleSidebar?: () => void;
  onFocusSearch?: () => void;
}): ShortcutConfig[] {
  return [
    ...(handlers.onSearch
      ? [{ ...APP_SHORTCUTS.search, action: handlers.onSearch }]
      : []),
    ...(handlers.onNewTask
      ? [{ ...APP_SHORTCUTS.newTask, action: handlers.onNewTask }]
      : []),
    ...(handlers.onClose
      ? [{ ...APP_SHORTCUTS.close, action: handlers.onClose }]
      : []),
    ...(handlers.onComplete
      ? [{ ...APP_SHORTCUTS.complete, action: handlers.onComplete }]
      : []),
    ...(handlers.onDelete
      ? [{ ...APP_SHORTCUTS.delete, action: handlers.onDelete }]
      : []),
    ...(handlers.onEdit
      ? [{ ...APP_SHORTCUTS.edit, action: handlers.onEdit }]
      : []),
    ...(handlers.onSave
      ? [{ ...APP_SHORTCUTS.save, action: handlers.onSave }]
      : []),
    ...(handlers.onToggleSidebar
      ? [{ ...APP_SHORTCUTS.toggleSidebar, action: handlers.onToggleSidebar }]
      : []),
    ...(handlers.onFocusSearch
      ? [{ ...APP_SHORTCUTS.focusSearch, action: handlers.onFocusSearch }]
      : []),
  ];
}

/**
 * Focus trap for modals/dialogs
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    element.addEventListener("keydown", handleKeyDown);
    firstElement?.focus();

    return () => element.removeEventListener("keydown", handleKeyDown);
  }, [ref, enabled]);
}
