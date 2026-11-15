import type { CaptionCue } from "@/lib/captions";
import type { CueAnnotations } from "@/lib/cue-annotations";
import { densityBins } from "@/lib/sound-navigation";

/**
 * The soundprint: when and what kind of non-speech sound happens across a
 * film. Built only from cue start times and annotation kinds. It never shows
 * caption words, so it is safe on film cards and the player timeline.
 */
export type SoundKind = "sfx" | "music" | "ambience" | "vocal";

export const SOUND_KINDS: { kind: SoundKind; label: string; shape: string }[] = [
  { kind: "sfx", label: "Effects", shape: "diamond" },
  { kind: "music", label: "Music", shape: "circle" },
  { kind: "ambience", label: "Ambience", shape: "square" },
  { kind: "vocal", label: "Voice", shape: "triangle" },
];

export function soundKindOf(cueId: string, annotations?: CueAnnotations): SoundKind {
  return annotations?.sounds[cueId]?.kind || "sfx";
}

export function soundKindLabel(kind: SoundKind) {
  return SOUND_KINDS.find((k) => k.kind === kind)?.label || "Sound";
}

/** Kind of the sound cue that starts closest to `time`, within `tolerance` seconds. */
export function soundKindNear(
  cues: Pick<CaptionCue, "cue_id" | "start_s">[],
  annotations: CueAnnotations | undefined,
  time: number,
  tolerance: number,
): SoundKind | null {
  let best: { d: number; id: string } | null = null;
  for (const cue of cues) {
    const d = Math.abs(cue.start_s - time);
    if (d <= tolerance && (!best || d < best.d)) best = { d, id: cue.cue_id };
  }
  return best ? soundKindOf(best.id, annotations) : null;
}

export function Soundprint({
  cues,
  duration,
  annotations,
  variant,
  showTicks = true,
  draw = false,
}: {
  cues: Pick<CaptionCue, "cue_id" | "start_s">[];
  duration: number;
  annotations?: CueAnnotations;
  variant: "card" | "timeline";
  showTicks?: boolean;
  draw?: boolean;
}) {
  if (!duration || !cues.length) return null;
  const bins = densityBins(cues, duration);
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <div className={`soundprint soundprint--${variant} ${draw ? "soundprint--draw" : ""}`} aria-hidden="true">
      <div className="soundprint__bars">
        {bins.map((b) =>
          b.count ? (
            <i
              key={b.start}
              style={{
                left: `${(b.start / duration) * 100}%`,
                width: `${(Math.min(5, duration - b.start) / duration) * 100}%`,
                height: `${20 + (b.count / max) * 80}%`,
              }}
            />
          ) : null,
        )}
      </div>
      {showTicks && (
        <div className="soundprint__ticks">
          {cues.map((c) => (
            <i
              key={c.cue_id}
              className={`sound-shape sound-shape--${soundKindOf(c.cue_id, annotations)}`}
              style={{ left: `${(c.start_s / duration) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Visible legend for the four shapes and hues. */
export function SoundKey({ title = "Sound key" }: { title?: string }) {
  return (
    <div className="sound-key">
      <p className="sound-key__title">{title}</p>
      <ul>
        {SOUND_KINDS.map((k) => (
          <li key={k.kind}>
            <i className={`sound-shape sound-shape--${k.kind}`} aria-hidden="true" />
            <span>
              {k.label} <span className="sr-only">({k.shape})</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="field__helper">Shows when and what kind of sound. Never the caption words.</p>
    </div>
  );
}
