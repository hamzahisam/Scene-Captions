"use client";
import type { CaptionProfile, CaptionCue, Level } from "@/lib/captions";
import { Icon } from "./icon";
import { SegmentedControl } from "./ui/segmented-control";
import { Switch } from "./ui/switch";

const AMOUNTS = [
  { label: "Essential", description: "Just the sound" },
  { label: "Balanced", description: "Sound and its source" },
  { label: "Rich", description: "More context" },
] as const;

const STYLES: { value: CaptionProfile["representation"]; label: string; description: string }[] = [
  { value: "descriptive", label: "Describe the sound", description: "Words that describe what you would hear." },
  { value: "plain", label: "Name the sound", description: "A short plain label." },
  { value: "onomatopoeic", label: "Spell the sound when possible", description: "The sound written out. Falls back to a description." },
];

/** A caption-style mini preview. Shows only the current or past sample cue. */
function MiniCaption({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="mini-caption" aria-hidden="true">
      {text}
    </span>
  );
}

export function CaptionStyleControls({
  profile,
  onChange,
  conservative,
  sample,
  explanation,
}: {
  profile: CaptionProfile;
  onChange: (p: CaptionProfile) => void;
  conservative: boolean;
  sample?: CaptionCue;
  explanation?: string;
}) {
  const styleExample = (value: CaptionProfile["representation"]) =>
    !sample
      ? undefined
      : value === "plain"
        ? sample.representations.plain
        : value === "onomatopoeic"
          ? sample.representations.onomatopoeic
          : sample.grid[`${profile.detail}-${profile.expression}`];
  return (
    <>
      <fieldset className="settings-group">
        <legend className="settings-group__title">Amount of detail</legend>
        <div className="option-cards" role="radiogroup" aria-label="Amount of detail">
          {AMOUNTS.map((amount, index) => {
            const level = (index + 1) as Level;
            return (
              <label key={amount.label} className="option-card">
                <input
                  type="radio"
                  name="amount"
                  value={level}
                  checked={profile.detail === level}
                  onChange={() => onChange({ ...profile, detail: level })}
                />
                <span className="option-card__title">{amount.label}</span>
                <span className="option-card__desc">{amount.description}</span>
                <Icon name="check" size={20} className="option-card__check" />
                <MiniCaption text={sample?.grid[`${level}-${profile.expression}`]} />
              </label>
            );
          })}
        </div>
        {sample && <p className="field__helper">Examples use the sample caption on the video.</p>}
      </fieldset>

      <div className="settings-group">
        <Switch
          label="Help me keep up"
          helper="Shortens sound captions when they come fast. Never adds more detail than you chose."
          checked={profile.adaptive}
          onChange={(adaptive) => onChange({ ...profile, adaptive })}
        >
          <span className="legend-chip" aria-hidden="true">
            <span className="legend-chip__glyph">▿</span> shortened
          </span>
          <span className="sr-only">A small triangle after a caption means it was shortened.</span>
        </Switch>
        {explanation && <p className="caption-explanation field__helper">{explanation}</p>}
      </div>

      <details className="settings-disclosure more-sound-options">
        <summary>
          <Icon name="chevron" size={18} className="disclosure-chevron" />
          More sound options
        </summary>
        <div className="settings-disclosure__body">
          <SegmentedControl
            legend="Reading pace"
            name="reading-pace"
            value={profile.readingSpeed}
            onChange={(readingSpeed) => onChange({ ...profile, readingSpeed })}
            options={[
              { value: 15, label: "Relaxed (15)" },
              { value: 17, label: "Default (17)" },
              { value: 20, label: "Quick (20)" },
            ]}
            helper="Characters per second. No single pace suits everyone."
          />

          <fieldset className="field">
            <legend className="field__label">Sound style</legend>
            <div className="option-cards" role="radiogroup" aria-label="Sound style">
              {STYLES.map((style) => (
                <label key={style.value} className="option-card">
                  <input
                    type="radio"
                    name="representation"
                    value={style.value}
                    checked={profile.representation === style.value}
                    onChange={() => onChange({ ...profile, representation: style.value })}
                  />
                  <span className="option-card__title">{style.label}</span>
                  <span className="option-card__desc">{style.description}</span>
                  <Icon name="check" size={20} className="option-card__check" />
                  <MiniCaption text={styleExample(style.value)} />
                </label>
              ))}
            </div>
          </fieldset>

          <SegmentedControl
            legend="Punctuation inside sound captions"
            name="punctuation"
            value={profile.expression}
            disabled={conservative}
            onChange={(expression) => onChange({ ...profile, expression: expression as Level })}
            options={(["None", "Full stop", "Exclamation"] as const).map((label, i) => ({
              value: (i + 1) as Level,
              label,
              hint: ["[Sound]", "[Sound.]", "[Sound!]"][i],
            }))}
            helper={
              conservative
                ? "Punctuation changes are unavailable for this track."
                : "An exclamation mark doesn’t mean the sound is louder."
            }
          />

          <Switch
            label="Mark music, off-screen and sound types"
            helper="Adds ♪ around music, an off-screen tag, and an edge on other sound types."
            checked={profile.typeStyling}
            onChange={(typeStyling) => onChange({ ...profile, typeStyling })}
          />
        </div>
      </details>
    </>
  );
}
