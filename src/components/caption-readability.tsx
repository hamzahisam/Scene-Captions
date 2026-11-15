"use client";
import { useCallback, useState } from "react";
import { DEFAULT_PROFILE } from "@/lib/captions";
import type { CaptionProfile } from "@/lib/captions";
import { Icon } from "./icon";
import { SegmentedControl } from "./ui/segmented-control";
import { Toast } from "./ui/toast";

type Appearance = Pick<CaptionProfile, "size" | "position" | "backdrop" | "textColor">;

const BACKDROPS: { value: CaptionProfile["backdrop"]; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "translucent", label: "Translucent" },
  { value: "outline", label: "Outline only" },
];

export function CaptionReadability({
  profile,
  onApply,
}: {
  profile: CaptionProfile;
  onApply: (profile: CaptionProfile) => void;
}) {
  const [undo, setUndo] = useState<Appearance | null>(null);
  const dismiss = useCallback(() => setUndo(null), []);
  return (
    <details className="settings-disclosure readability">
      <summary>
        <Icon name="chevron" size={18} className="disclosure-chevron" />
        Appearance
      </summary>
      <div className="settings-disclosure__body">
        <SegmentedControl
          legend="Text size"
          name="text-size"
          className="segmented--sizes"
          value={profile.size}
          onChange={(size) => onApply({ ...profile, size })}
          options={[
            { value: "standard", name: "Standard", label: <span className="aa aa--s">Aa</span>, hint: "Standard" },
            { value: "large", name: "Large", label: <span className="aa aa--m">Aa</span>, hint: "Large" },
            { value: "extra-large", name: "Extra large", label: <span className="aa aa--l">Aa</span>, hint: "Extra large" },
          ]}
        />

        <fieldset className="field">
          <legend className="field__label">Text colour</legend>
          <div className="swatches">
            {(["white", "yellow"] as const).map((color) => (
              <label key={color} className="swatch">
                <input
                  type="radio"
                  name="text-color"
                  value={color}
                  checked={profile.textColor === color}
                  onChange={() => onApply({ ...profile, textColor: color })}
                />
                <span className={`swatch__sample swatch__sample--${color}`} aria-hidden="true">
                  Aa
                </span>
                <span className="swatch__label">{color === "white" ? "White" : "Yellow"}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="field__label">Backdrop</legend>
          <div className="swatches swatches--three">
            {BACKDROPS.map((b) => (
              <label key={b.value} className="swatch">
                <input
                  type="radio"
                  name="backdrop"
                  value={b.value}
                  checked={profile.backdrop === b.value}
                  onChange={() => onApply({ ...profile, backdrop: b.value })}
                />
                <span className={`backdrop-thumb backdrop-thumb--${b.value}`} aria-hidden="true">
                  <span>Aa</span>
                </span>
                <span className="swatch__label">{b.label}</span>
              </label>
            ))}
          </div>
          {profile.backdrop === "outline" && (
            <p className="callout settings-warning">
              <Icon name="warning" size={18} />
              <span>Outline-only text can be hard to read on bright scenes.</span>
            </p>
          )}
        </fieldset>

        <SegmentedControl
          legend="Position on the video"
          name="caption-position"
          value={profile.position}
          onChange={(position) => onApply({ ...profile, position })}
          options={[
            { value: "top", name: "Top", label: (<span className="seg-icon"><Icon name="top" size={18} />Top</span>) },
            { value: "bottom", name: "Bottom", label: (<span className="seg-icon"><Icon name="bottom" size={18} />Bottom</span>) },
          ]}
        />

        <div className="reset-row">
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => {
              setUndo({ size: profile.size, position: profile.position, backdrop: profile.backdrop, textColor: profile.textColor });
              onApply({
                ...profile,
                size: DEFAULT_PROFILE.size,
                position: DEFAULT_PROFILE.position,
                backdrop: DEFAULT_PROFILE.backdrop,
                textColor: DEFAULT_PROFILE.textColor,
              });
            }}
          >
            <Icon name="reset" size={18} />
            Reset appearance
          </button>
          {undo && (
            <Toast
              message="Appearance reset."
              actionLabel="Undo"
              onAction={() => {
                onApply({ ...profile, ...undo });
                setUndo(null);
              }}
              onDismiss={dismiss}
            />
          )}
        </div>
      </div>
    </details>
  );
}
