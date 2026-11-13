"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaptionSettingsPanel } from "./caption-settings-panel";
import { useVideoPlayback } from "./hooks/use-video-playback";
import { PlayerControls } from "./player-controls";
import { CaptionOverlay, useCaptionDisplay } from "./caption-display";
import type { CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import type { StudyEvent } from "@/lib/session";
import { useFullscreenTextTrack } from "./hooks/use-fullscreen-text-track";
import { captionSample } from "@/lib/caption-sample";
import { resolveCaption } from "@/lib/captions";
import { Icon } from "./icon";

export function VideoPlayer({ source, data, profile, condition, showOriginal, onOriginal, onTime, onEvent, seekTo, onApply, poster = "/media/bunny-poster.jpg" }: {
  source: string; data: CaptionVideo | null; profile: CaptionProfile; condition: Condition;
  showOriginal: boolean; onOriginal: (enabled?:boolean) => void; onTime: (time: number) => void;
  onEvent: (event: StudyEvent) => void; seekTo: { seconds: number; nonce: number } | null;
  poster?: string; onApply:(p:CaptionProfile)=>void;
}) {
  const playback = useVideoPlayback({ source, seekTo, onTime, onEvent });
  const { video, frame, ready, playing, error, waiting, duration, time, toggle } = playback;
  const [settingsOpen,setSettingsOpen]=useState(false),[narrow,setNarrow]=useState(false); const settingsButton=useRef<HTMLButtonElement>(null);
  const closeSettings=useCallback(()=>setSettingsOpen(false),[]);
  useEffect(()=>{const el=frame.current;if(!el)return;const resize=new ResizeObserver(()=>setNarrow(el.clientWidth<560&&!document.fullscreenElement));resize.observe(el);const full=()=>setNarrow(el.clientWidth<560&&!document.fullscreenElement);document.addEventListener("fullscreenchange",full);return()=>{resize.disconnect();document.removeEventListener("fullscreenchange",full)}},[frame]);
  const display = useCaptionDisplay(data, duration, time, profile, condition, showOriginal);
  const nativeFullscreen=useFullscreenTextTrack(video,[...display.cues.map((cue,i)=>({start:cue.start_s,end:cue.end_s,text:display.active[i].text})),...(display.mismatch?[]:data?.dialogue?.filter(c=>c.start_s<=time&&time<c.end_s).map(c=>({start:c.start_s,end:c.end_s,text:c.text}))||[])]);
  const sample=captionSample(data?.cues||[],time);
  const sampleVisible=settingsOpen&&!display.mismatch&&!display.active.length&&!!sample;
  return <>
    <div className={`video-frame ${settingsOpen?"settings-open":""} ${narrow?"settings-below":""}`} ref={frame}><div className="video-stage">
      <video ref={video} src={source} poster={source.startsWith("blob:") ? undefined : poster} preload="metadata" playsInline
        aria-label={`${data?.title || "Your video"} video player`} aria-describedby="video-description" tabIndex={0}
        {...playback.events} />

      {!playing && !error && <button className="big-play" onClick={() => void toggle()} disabled={!ready} aria-label={ready ? "Play video" : "Loading video"}><Icon name="play" size={30} /></button>}
      {waiting && playing && <span className="buffering" role="status">Buffering video…</span>}
      {!nativeFullscreen&&<CaptionOverlay sample={sampleVisible} active={sampleVisible?[resolveCaption(sample!,profile,condition,showOriginal)]:display.active} cues={sampleVisible?[sample!]:display.cues} profile={profile} dialogue={display.mismatch ? [] : data?.dialogue?.filter(cue => cue.start_s <= time && time < cue.end_s)} />}
      {(showOriginal||condition==="baseline")&&<span className="original-indicator">Original captions</span>}
      <PlayerControls playback={playback} baseline={condition === "baseline"} hasCaptions={!!data?.cues.length} showOriginal={showOriginal} onOriginal={onOriginal} generatedBaseline={data?.generated_with.kind === "source-assisted"} experimental={data?.generated_with.experimental} settingsOpen={settingsOpen} onSettings={()=>setSettingsOpen(v=>!v)} settingsButton={settingsButton} />
      </div><CaptionSettingsPanel open={settingsOpen} close={closeSettings} trigger={settingsButton} profile={profile} onApply={onApply} data={data} condition={condition} sample={sample} explanation={display.active[0]?.reason||"Changes apply immediately to sound captions."} />
    </div>
    {error && <p role="alert" className="inline-error">{error}</p>}
    {display.mismatch && <p role="alert" className="inline-error">Caption timing does not match this video’s duration. Captions are hidden. The prepared track needs review.</p>}
    {!data && <p className="inline-notice">Sound captions are unavailable for this film.</p>}
    <p id="video-description" className="sr-only">Available dialogue and non-speech captions are displayed on the video. {data?.generated_with.experimental ? "Experimental dialogue is transcribed from audio; words and timing are unverified." : "Dialogue keeps its source wording regardless of sound preferences."} Focus the video and press Space to play or pause; use Left and Right arrows to seek five seconds. Full sound text and jump controls are available in the timeline below.</p>
  </>;
}
