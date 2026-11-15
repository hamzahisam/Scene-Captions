"use client";
import {useMemo} from "react";
import {dialogueParts,reviewedSpeaker,mapLinesToKinds} from "@/lib/cue-annotations";
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
    {!!active.length && <div className="caption-lines">{active.map((caption, index) => {
      const cue = cues[index];
      const soundAnn = annotations?.sounds[cue.cue_id];
      const lines = caption.text.split('\n');
      const kinds = mapLinesToKinds(lines, soundAnn);
      if (lines.length === 1) {
        const lineKind = kinds[0];
        const isMusic = profile.typeStyling && lineKind === "music";
        return <p key={cue.cue_id} className={[profile.typeStyling&&lineKind?`sound-type sound-${lineKind}`:"",profile.italicSound?"sound-italic":""].filter(Boolean).join(" ")||undefined}>{isMusic&&<span aria-hidden="true">♪ </span>}{lines[0]}{isMusic&&<span aria-hidden="true"> ♪</span>}{profile.typeStyling&&soundAnn?.offscreen&&<span className="offscreen-tag">off-screen</span>}{profile.markShortened&&caption.adapted&&<span className="shortened-marker"><span aria-hidden="true"> ▿</span><span className="sr-only"> (shortened)</span></span>}</p>;
      }
      return <p key={cue.cue_id}>{lines.map((line, lineIdx) => {
        const lineKind = kinds[lineIdx];
        const isMusic = profile.typeStyling && lineKind === "music";
        return <span key={lineIdx} style={{display:'block'}} className={[profile.typeStyling&&lineKind?`sound-type sound-${lineKind}`:"",profile.italicSound?"sound-italic":""].filter(Boolean).join(" ")||undefined}>{isMusic&&<span aria-hidden="true">♪ </span>}{line}{isMusic&&<span aria-hidden="true"> ♪</span>}</span>;
      })}{profile.typeStyling&&soundAnn?.offscreen&&<span className="offscreen-tag">off-screen</span>}{profile.markShortened&&caption.adapted&&<span className="shortened-marker"><span aria-hidden="true"> ▿</span><span className="sr-only"> (shortened)</span></span>}</p>;
    })}</div>}
  </div>;
}

