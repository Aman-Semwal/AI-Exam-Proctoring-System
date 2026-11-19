import { useEffect, useRef } from "react";

// Ctrl/Cmd + key → what was tried. Anything else in BLOCKED_KEYS is a generic shortcut.
const CLIPBOARD_KEYS = { c: "COPY", v: "PASTE", x: "CUT" };
const BLOCKED_KEYS = new Set(["c", "v", "x", "p", "s", "u"]); // copy, paste, cut, print, save, view source
const DEVTOOLS_KEYS = new Set(["i", "j", "c"]); // with Ctrl+Shift

/** Returns the signal for a blocked key press, or null when the key is allowed. */
function blockedSignal(e) {
  const key = (e.key || "").toLowerCase();
  if (e.key === "F12") return "SHORTCUT";
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return null;
  if (e.shiftKey && DEVTOOLS_KEYS.has(key)) return "SHORTCUT";
  if (BLOCKED_KEYS.has(key)) return CLIPBOARD_KEYS[key] ?? "SHORTCUT";
  return null;
}

/**
 * Blocks copy, cut, paste, the right-click menu, and print/save/view-source/DevTools
 * shortcuts on the whole page while `enabled`. Listeners run in the capture phase on
 * `document`, so they fire before any editor inside the page can handle the event.
 * Normal typing is untouched. onBlocked(signal) gets "COPY" | "CUT" | "PASTE" |
 * "CONTEXT_MENU" | "SHORTCUT".
 */
export default function useClipboardGuard({ enabled, onBlocked }) {
  // Latest callback without re-binding the listeners on every render
  const onBlockedRef = useRef(onBlocked);
  useEffect(() => {
    onBlockedRef.current = onBlocked;
  }, [onBlocked]);

  useEffect(() => {
    if (!enabled) return;

    const block = (signal) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      onBlockedRef.current?.(signal);
    };
    const onCopy = block("COPY");
    const onCut = block("CUT");
    const onPaste = block("PASTE");
    const onContextMenu = block("CONTEXT_MENU");
    const onKeyDown = (e) => {
      const signal = blockedSignal(e);
      if (signal) block(signal)(e);
    };

    const opts = { capture: true };
    document.addEventListener("copy", onCopy, opts);
    document.addEventListener("cut", onCut, opts);
    document.addEventListener("paste", onPaste, opts);
    document.addEventListener("contextmenu", onContextMenu, opts);
    document.addEventListener("keydown", onKeyDown, opts);
    return () => {
      document.removeEventListener("copy", onCopy, opts);
      document.removeEventListener("cut", onCut, opts);
      document.removeEventListener("paste", onPaste, opts);
      document.removeEventListener("contextmenu", onContextMenu, opts);
      document.removeEventListener("keydown", onKeyDown, opts);
    };
  }, [enabled]);
}
