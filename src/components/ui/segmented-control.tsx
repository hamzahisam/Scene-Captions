"use client";
import type { ReactNode } from "react";

export type SegmentOption<T extends string | number> = {
  value: T;
  label: ReactNode;
  /** Accessible name when the visible label is not plain text (e.g. "Aa" glyphs). */
  name?: string;
  hint?: ReactNode;
};

/** Native radio group drawn as segments. Arrow keys move selection (browser default). */
export function SegmentedControl<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
  helper,
  className = "",
}: {
  legend: ReactNode;
  name: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  helper?: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={`field segmented ${className}`} disabled={disabled}>
      <legend className="field__label">{legend}</legend>
      <div className="segmented__track">
        {options.map((option) => (
          <label key={String(option.value)} className="segmented__option">
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-label={option.name}
            />
            <span>
              {option.label}
              {option.hint && <small>{option.hint}</small>}
            </span>
          </label>
        ))}
      </div>
      {helper && <p className="field__helper">{helper}</p>}
    </fieldset>
  );
}
