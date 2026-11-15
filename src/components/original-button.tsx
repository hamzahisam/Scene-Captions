"use client";
import { useEffect, useRef } from "react";
import { Icon } from "./icon";

/**
 * Original captions toggle. Click toggles; press and hold (350 ms) peeks and
 * returns on release. The pointer/hold logic is unchanged from before the
 * redesign; only visuals and the disabled presentation changed.
 * Disabled uses aria-disabled so the button stays focusable and its tooltip
 * can explain why it is unavailable.
 */
export function OriginalButton({
  enabled,
  disabled,
  peeking = false,
  onChange,
}: {
  enabled: boolean;
  disabled: boolean;
  peeking?: boolean;
  onChange: (value: boolean, mode: "hold" | "toggle") => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    held = useRef(false),
    previous = useRef(false),
    suppress = useRef(false);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function release() {
    clear();
    if (held.current) {
      held.current = false;
      suppress.current = true;
      onChange(previous.current, "hold");
    }
  }
  return (
    <button
      type="button"
      className={`control control--labelled original-toggle ${peeking ? "is-peeking" : ""}`}
      aria-label="Original captions"
      aria-pressed={enabled}
      aria-disabled={disabled || undefined}
      aria-keyshortcuts="O"
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        suppress.current = false;
        previous.current = enabled;
        e.currentTarget.setPointerCapture(e.pointerId);
        timer.current = setTimeout(() => {
          held.current = true;
          onChange(true, "hold");
        }, 350);
      }}
      onPointerUp={release}
      onPointerCancel={() => {
        release();
        suppress.current = true;
      }}
      onClick={(e) => {
        if (disabled) return;
        if (e.detail === 0) {
          onChange(!enabled, "toggle");
          return;
        }
        if (suppress.current) {
          suppress.current = false;
          return;
        }
        onChange(!enabled, "toggle");
      }}
    >
      <Icon name="compare" size={22} />
      <span className="control__label" aria-hidden="true">
        Original
      </span>
    </button>
  );
}
