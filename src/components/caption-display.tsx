"use client";
import {speakerText} from "@/lib/cue-annotations";
import type {CueAnnotations} from "@/lib/cue-annotations";
import { activeCues, formatTime, resolveCaption } from "@/lib/captions";
import type { CaptionCue, CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import { Icon } from "./icon";

type Selected = ReturnType<typeof resolveCaption>;

export function useCaptionDisplay(data: CaptionVideo | null, duration: number, time: number, profile: CaptionProfile, condition: Condition, showOriginal: boolean) {
  const mismatch = !!data && duration > 0 && Math.abs(duration - data.duration_seconds) > 2;
  const cues = data && duration>0 && !mismatch ? activeCues(data.cues, time) : [];
  const nextCue = data && !mismatch ? data.cues.find(cue => cue.start_s > time) : undefined;
  const active = cues.map(cue => resolveCaption(cue, profile, condition, showOriginal));
  return { mismatch, cues, nextCue, active };
}

export function CaptionOverlay({ active, cues, profile, dialogue = [], sample=false,annotations }: { active: Selected[]; cues: CaptionCue[]; profile: CaptionProfile; annotations?:CueAnnotations; sample?:boolean; dialogue?: { cue_id: string; text: string }[] }) {
  if (!active.length && !dialogue.length) return null;
  return <div className={`caption-overlay ${profile.position} ${profile.size} backdrop-${profile.backdrop} color-${profile.textColor} ${sample?"caption-sample":""}`}>
    {sample&&<span className="sample-label">Sample</span>}
    {!!dialogue.length && <div className="dialogue-lines">{dialogue.map(cue => <p key={cue.cue_id}>{annotations?.dialogue[cue.cue_id]?.speaker&&<span className="speaker-chip">{annotations.dialogue[cue.cue_id].speaker}</span>}{speakerText(cue.text,annotations?.dialogue[cue.cue_id]?.speaker)}</p>)}</div>}
    {!!active.length && <div className="caption-lines">{active.map((caption, index) => <p key={cues[index].cue_id} className={profile.typeStyling&&annotations?.sounds[cues[index].cue_id]?`sound-type sound-${annotations.sounds[cues[index].cue_id].kind}`:undefined}>{profile.typeStyling&&annotations?.sounds[cues[index].cue_id]?.kind==="music"&&<span aria-hidden="true">♪ </span>}{caption.text}{profile.typeStyling&&annotations?.sounds[cues[index].cue_id]?.kind==="music"&&<span aria-hidden="true"> ♪</span>}{profile.typeStyling&&annotations?.sounds[cues[index].cue_id]?.offscreen&&<span className="offscreen-tag">off-screen</span>}{caption.adapted&&<span className="shortened-marker"><span aria-hidden="true"> ▿</span><span className="sr-only"> (shortened)</span></span>}</p>)}</div>}
  </div>;
}

