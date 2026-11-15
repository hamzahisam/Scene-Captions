"use client";
import { useId } from "react";
import type { ReactNode } from "react";

/** A labelled on/off switch row. Native checkbox with role="switch". */
export function Switch({
  label,
  helper,
  checked,
  onChange,
  disabled = false,
  children,
}: {
  label: ReactNode;
  helper?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const id = useId();
  const helperId = `${id}-helper`;
  return (
    <div className="switch-row">
      <div className="switch-row__text">
        <label htmlFor={id} className="switch-row__label">
          {label}
        </label>
        {helper && (
          <p id={helperId} className="field__helper">
            {helper}
          </p>
        )}
        {children}
      </div>
      <input
        id={id}
        className="switch"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={helper ? helperId : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}
