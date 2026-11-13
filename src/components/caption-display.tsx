"use client";
import { useState } from "react";
import { activeCues, formatTime, resolveCaption } from "@/lib/captions";
import type { CaptionCue, CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import { Icon } from "./icon";

type Selected = ReturnType<typeof resolveCaption>;
function captionStatus(cues: CaptionCue[], active: Selected[], hasTrack: boolean, nextCue: CaptionCue | undefined, condition: Condition, original: boolean) {
  if (!hasTrack) return "No sound-caption track available";
  if (!active.length) return nextCue ? `Next sound caption at ${formatTime(nextCue.start_s)}` : "No more sound captions in this track";
  if (active.some(caption => caption.adapted)) return cues.some(cue => cue.scene_load_basis === "cue-density") ? "Adapted to sound-cue density" : "Adapted to this scene";
  if (original || condition === "baseline") return cues.some(cue => cue.reference_text) ? "Showing fetched reference captions" : "Showing original captions";
  return "Using your preferences";
}

export function useCaptionDisplay(data: CaptionVideo | null, duration: number, time: number, profile: CaptionProfile, condition: Condition, showOriginal: boolean) {
  const mismatch = !!data && duration > 0 && Math.abs(duration - data.duration_seconds) > 2;
  const cues = data && !mismatch ? activeCues(data.cues, time) : [];
  const nextCue = data && !mismatch ? data.cues.find(cue => cue.start_s > time) : undefined;
  const active = cues.map(cue => resolveCaption(cue, profile, condition, showOriginal));
  return { mismatch, cues, nextCue, active };
}

export function CaptionOverlay({ active, cues, profile, dialogue = [], sample=false }: { active: Selected[]; cues: CaptionCue[]; profile: CaptionProfile; sample?:boolean; dialogue?: { cue_id: string; text: string }[] }) {
  if (!active.length && !dialogue.length) return null;
  return <div className={`caption-overlay ${profile.position} ${profile.size} ${sample?"caption-sample":""}`} aria-label="Captions">
    {sample&&<span className="sample-label">Sample</span>}
    {!!dialogue.length && <div className="dialogue-lines" aria-label="Dialogue subtitles">{dialogue.map(cue => <p key={cue.cue_id}>{cue.text}</p>)}</div>}
    {!!active.length && <div className="caption-lines" aria-label="Non-speech captions">{active.map((caption, index) => <p key={cues[index].cue_id}>{caption.text}{caption.adapted&&<span className="shortened-marker" aria-label="shortened"> ▿<span className="sr-only"> (shortened)</span></span>}</p>)}</div>}
  </div>;
}

