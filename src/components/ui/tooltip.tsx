"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * Hover and keyboard-focus tooltip (WCAG 1.4.13): dismissible with Esc,
 * hoverable, persistent while hovered or focused, and placed above the control
 * so it never covers it. The text is visual only; the control keeps its own
 * accessible name and exposes shortcuts via aria-keyshortcuts.
 */
export function Tooltip({
  text,
  shortcut,
  align = "center",
  children,
}: {
  text: string;
  shortcut?: string;
  align?: "start" | "center" | "end";
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = (hover || focus) && !dismissed;
  useEffect(() => {
    if (!visible) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDismissed(true);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [visible]);
  return (
    <span
      className="tip"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") {
          setHover(true);
          setDismissed(false);
        }
      }}
      onPointerLeave={() => setHover(false)}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) {
          setFocus(true);
          setDismissed(false);
        }
      }}
      onBlur={() => setFocus(false)}
    >
      {children}
      <span className={`tip__bubble tip__bubble--${align}`} data-visible={visible} aria-hidden="true">
        {text}
        {shortcut && <kbd>{shortcut}</kbd>}
      </span>
    </span>
  );
}
