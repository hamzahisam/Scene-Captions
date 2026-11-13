"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {CaptionExperience} from "./caption-experience";
import { useVideoPlayback } from "./hooks/use-video-playback";
import { PlayerControls } from "./player-controls";
import { CaptionOverlay, useCaptionDisplay } from "./caption-display";
import type { CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import type { StudyEvent } from "@/lib/session";
import { useFullscreenTextTrack } from "./hooks/use-fullscreen-text-track";
import {usePlayerShortcuts} from "./hooks/use-player-shortcuts";
import {ShortcutHelp} from "./shortcut-help";
import {adjacentSound} from "@/lib/sound-navigation";
import { captionSample } from "@/lib/caption-sample";
import { resolveCaption } from "@/lib/captions";
import type {CueAnnotations} from "@/lib/cue-annotations";
import { Icon } from "./icon";

export function VideoPlayer({ source, data, profile, condition, showOriginal, onOriginal, onTime, onEvent, seekTo, onApply, annotations, poster = "/media/bunny-poster.jpg" }: {
  source: string; data: CaptionVideo | null; profile: CaptionProfile; condition: Condition;
  showOriginal: boolean; onOriginal: (enabled?:boolean) => void; onTime: (time: number) => void;
  onEvent: (event: StudyEvent) => void; seekTo: { seconds: number; nonce: number } | null;
  annotations?:CueAnnotations; poster?: string; onApply:(p:CaptionProfile)=>void;
}) {
  const playback = useVideoPlayback({ source, seekTo, onTime, onEvent });
  const { video, frame, ready, playing, error, waiting, duration, time, toggle } = playback;
  const [settingsOpen,setSettingsOpen]=useState(false),[narrow,setNarrow]=useState(false); const settingsButton=useRef<HTMLButtonElement>(null);
  const [helpOpen,setHelpOpen]=useState(false),[shortcutNotice,setShortcutNotice]=useState(""); const helpButton=useRef<HTMLButtonElement>(null);const closeHelp=useCallback(()=>setHelpOpen(false),[]);
  const closeSettings=useCallback(()=>setSettingsOpen(false),[]);
  useEffect(()=>{const el=frame.current;if(!el)return;const resize=new ResizeObserver(()=>setNarrow(el.clientWidth<560&&!document.fullscreenElement));resize.observe(el);const full=()=>setNarrow(el.clientWidth<560&&!document.fullscreenElement);document.addEventListener("fullscreenchange",full);return()=>{resize.disconnect();document.removeEventListener("fullscreenchange",full)}},[frame]);
  usePlayerShortcuts(frame,profile.shortcuts,profile.pageWideShortcuts,{toggle:()=>void toggle(),seek:delta=>playback.seek((video.current?.currentTime||0)+delta),settings:()=>{setHelpOpen(false);setSettingsOpen(v=>!v)},original:value=>{if(condition!=="baseline")onOriginal(value)},originalEnabled:showOriginal,amount:delta=>{if(condition==="baseline"||!data?.cues.length)return;const detail=Math.max(1,Math.min(3,profile.detail+delta)) as 1|2|3;onApply({...profile,detail});setShortcutNotice(`Amount: ${["","Essential","Balanced","Rich"][detail]}`)},size:delta=>{const sizes=["standard","large","extra-large"] as const;const size=sizes[Math.max(0,Math.min(2,sizes.indexOf(profile.size)+delta))];onApply({...profile,size});setShortcutNotice(`Text size: ${size}`)},fullscreen:()=>void playback.fullscreen(),sound:direction=>{const target=adjacentSound(data?.cues||[],video.current?.currentTime||0,direction);if(target!==null)playback.seek(target)},help:()=>{setSettingsOpen(false);setHelpOpen(true)},close:()=>{setHelpOpen(false);setSettingsOpen(false)}});
  const settingsHost=useRef<HTMLDivElement>(null);
  const mismatch=!!data&&duration>0&&Math.abs(duration-data.duration_seconds)>2;
  return <>
    <div className={`video-frame ${settingsOpen?"settings-open":""} ${narrow?"settings-below":""}`} ref={frame} role="region" aria-label="Video player" tabIndex={0}><div className="video-stage">
      <video ref={video} src={source} poster={source.startsWith("blob:") ? undefined : poster} preload="metadata" playsInline
        aria-label={`${data?.title || "Your video"} video player`} aria-describedby="video-description" tabIndex={0}
        {...playback.events} />

      {!playing && !error && <button className="big-play" onClick={() => void toggle()} disabled={!ready} aria-label={ready ? "Play video" : "Loading video"}><Icon name="play" size={30} /></button>}
      {waiting && playing && <span className="buffering" role="status">Buffering video…</span>}
      <CaptionExperience clock={playback.clock} data={data} duration={duration} profile={profile} condition={condition} original={showOriginal} video={video} host={settingsHost} trigger={settingsButton} open={settingsOpen} close={closeSettings} onApply={onApply} annotations={annotations}/>
      {(showOriginal||condition==="baseline")&&<span className="original-indicator">Original captions</span>}
      <PlayerControls cues={data?.cues} annotations={annotations} playback={playback} baseline={condition === "baseline"} hasCaptions={!!data?.cues.length} showOriginal={showOriginal} onOriginal={onOriginal} generatedBaseline={data?.generated_with.kind === "source-assisted"} experimental={data?.generated_with.experimental} settingsOpen={settingsOpen} onSettings={()=>setSettingsOpen(v=>!v)} settingsButton={settingsButton} />
      <button ref={helpButton} className="shortcut-help-trigger" aria-label="Keyboard shortcuts" onClick={()=>{setSettingsOpen(false);setHelpOpen(true)}}>?</button>
      </div><div ref={settingsHost}/><ShortcutHelp open={helpOpen} close={closeHelp} trigger={helpButton} profile={profile} onChange={onApply}/>
    </div>
    {error && <p role="alert" className="inline-error">{error}</p>}
    {mismatch && <p role="alert" className="inline-error">Caption timing does not match this video’s duration. Captions are hidden. The prepared track needs review.</p>}
    {!data && <p className="inline-notice">Sound captions are unavailable for this film.</p>}
    <div className="sr-only" role="status" aria-live="polite">{shortcutNotice}</div>
    <p id="video-description" className="sr-only">Dialogue stays fixed while sound captions follow your preferences. Open CC for detail, reading pace and appearance. Focus the player for keyboard controls; press question mark for help. Original toggles the source wording, or hold it to compare temporarily. Research tools contain upcoming sound text and are not part of participant viewing.</p>
  </>;
}
