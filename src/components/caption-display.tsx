"use client";
import {useMemo} from "react";
import {dialogueParts,reviewedSpeaker} from "@/lib/cue-annotations";
import type {CueAnnotations} from "@/lib/cue-annotations";
import { resolveCaptionWindows, resolveCaption } from "@/lib/captions";
import type { CaptionCue, CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import { Icon } from "./icon";

type Selected = ReturnType<typeof resolveCaption>;

export function useCaptionDisplay(data: CaptionVideo | null, duration: number, time: number, profile: CaptionProfile, condition: Condition, showOriginal: boolean, extendDisplay = false) {
  const mismatch = !!data && duration > 0 && Math.abs(duration - data.duration_seconds) > 2;
  const windows = useMemo(()=>data?resolveCaptionWindows(data,profile,condition,showOriginal,extendDisplay):[],[data,profile,condition,showOriginal,extendDisplay]);
  const activeWindows = duration>0 && !mismatch ? windows.filter(w=>w.start_s<=time&&time<w.display_end_s) : [];
  const cues = activeWindows.map(w=>w.cue);
  const nextCue = data && !mismatch ? data.cues.find(cue => cue.start_s > time) : undefined;
  const active = activeWindows.map(w=>w.caption);
  return { mismatch, cues, nextCue, active, activeWindows, windows };
}

export function CaptionOverlay({ active, cues, profile, dialogue = [], sample=false,annotations }: { active: Selected[]; cues: CaptionCue[]; profile: CaptionProfile; annotations?:CueAnnotations; sample?:boolean; dialogue?: { cue_id: string; text: string }[] }) {
  if (!active.length && !dialogue.length) return null;
  return <div className={`caption-overlay ${profile.position} ${profile.size} backdrop-${profile.backdrop} color-${profile.textColor} ${sample?"caption-sample":""}`}>
    {sample&&<span className="sample-label">Sample</span>}
    {!!dialogue.length && <div className="dialogue-lines">{dialogue.map(cue => {const part=dialogueParts(cue.text,reviewedSpeaker(annotations,cue.cue_id));return <p key={cue.cue_id}>{part.speaker&&<><span className="speaker-chip">{part.speaker}</span><span className="sr-only">: </span></>}{part.text}</p>})}</div>}
    {!!active.length && <div className="caption-lines">{active.map((caption, index) => <p key={cues[index].cue_id} className={[profile.typeStyling&&annotations?.sounds[cues[index].cue_id]?`sound-type sound-${annotations.sounds[cues[index].cue_id].kind}`:"",profile.italicSound?"sound-italic":""].filter(Boolean).join(" ")||undefined}>{profile.typeStyling&&annotations?.sounds[cues[index].cue_id]?.kind==="music"&&<span aria-hidden="true">♪ </span>}{caption.text}{profile.typeStyling&&annotations?.sounds[cues[index].cue_id]?.kind==="music"&&<span aria-hidden="true"> ♪</span>}{profile.typeStyling&&annotations?.sounds[cues[index].cue_id]?.offscreen&&<span className="offscreen-tag">off-screen</span>}{profile.markShortened&&caption.adapted&&<span className="shortened-marker"><span aria-hidden="true"> ▿</span><span className="sr-only"> (shortened)</span></span>}</p>)}</div>}
  </div>;
}

