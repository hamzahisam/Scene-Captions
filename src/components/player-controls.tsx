"use client";
import {useEffect,useRef} from "react";
import type { RefObject } from "react";
import { formatTime } from "@/lib/captions";
import {adjacentSound} from "@/lib/sound-navigation";
import type {CaptionCue} from "@/lib/captions";
import type {CueAnnotations} from "@/lib/cue-annotations";
import {SoundMarkers} from "./sound-markers";
import { OriginalButton } from "./original-button";
import { Icon } from "./icon";
import type { useVideoPlayback } from "./hooks/use-video-playback";

export function PlayerControls({ playback, baseline, hasCaptions, showOriginal, onOriginal, generatedBaseline = false, experimental = false, settingsOpen=false, onSettings, settingsButton, cues=[],annotations,showTicks=true,originalLocked=false }: {
  playback: Pick<ReturnType<typeof useVideoPlayback>, "time" | "duration" | "ready" | "playing" | "muted" | "playbackRate" | "toggle" | "seek" | "toggleMute" | "changeRate" | "fullscreen">; baseline: boolean; hasCaptions: boolean;
  originalLocked?:boolean;cues?:CaptionCue[];annotations?:CueAnnotations;showTicks?:boolean; showOriginal: boolean; onOriginal: (enabled?:boolean,mode?:"toggle"|"hold") => void; settingsOpen?:boolean; onSettings?:()=>void; settingsButton?:RefObject<HTMLButtonElement|null>; generatedBaseline?: boolean; experimental?: boolean;
}) {
  const controls=useRef<HTMLDivElement>(null);useEffect(()=>{const el=controls.current;if(!el)return;const update=()=>el.closest<HTMLElement>(".video-stage")?.style.setProperty("--controls-height",`${el.getBoundingClientRect().height}px`);const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect()},[]);
  const { time, duration, ready, playing, muted, playbackRate, toggle, seek, toggleMute, changeRate, fullscreen } = playback;
  return (
      <div ref={controls} className="video-controls">
        <div className="timeline-track">{showTicks&&<SoundMarkers cues={cues} duration={duration} annotations={annotations}/>}<label className="sr-only" htmlFor="timeline">Seek video</label><input id="timeline" className="timeline" type="range" min={0} max={duration || 1} step={0.1} value={Math.min(time, duration || 1)} disabled={!ready} onChange={(e) => seek(Number(e.target.value))} aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`} /></div>
        <div className="transport"><button className="icon-button" onClick={() => void toggle()} disabled={!ready} aria-label={playing ? "Pause video" : "Play video"}><Icon name={playing ? "pause" : "play"} /></button><button className="icon-button" onClick={toggleMute} aria-label={muted ? "Unmute video" : "Mute video"}><Icon name={muted ? "mute" : "volume"} /></button><button className="icon-button" aria-label="Previous sound" disabled={adjacentSound(cues,time,"previous")===null} onClick={()=>{const t=adjacentSound(cues,time,"previous");if(t!==null)seek(t,"sound-navigation")}}>↶</button><button className="icon-button" aria-label="Next sound" disabled={adjacentSound(cues,time,"next")===null} onClick={()=>{const t=adjacentSound(cues,time,"next");if(t!==null)seek(t,"sound-navigation")}}>↷</button><span className="time-code">{formatTime(time)} <span>/ {formatTime(duration)}</span></span><div className="transport-right"><label className="sr-only" htmlFor="speed">Playback speed</label><select id="speed" aria-label="Playback speed" value={playbackRate} onChange={(e) => changeRate(Number(e.target.value))}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option></select>{onSettings&&<button ref={settingsButton} className="cc-button" onClick={onSettings} aria-label="Caption settings" aria-expanded={settingsOpen} aria-controls="caption-settings">CC</button>}<OriginalButton enabled={showOriginal||baseline} disabled={baseline||originalLocked||!hasCaptions} onChange={(value,mode)=>onOriginal(value,mode)}/><button className="icon-button" aria-label="Fullscreen player" onClick={() => void fullscreen()}><Icon name="expand" /></button></div></div>
      </div>
  );
}
