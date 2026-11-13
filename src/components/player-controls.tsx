"use client";
import type { RefObject } from "react";
import { formatTime } from "@/lib/captions";
import { OriginalButton } from "./original-button";
import { Icon } from "./icon";
import type { useVideoPlayback } from "./hooks/use-video-playback";

export function PlayerControls({ playback, baseline, hasCaptions, showOriginal, onOriginal, generatedBaseline = false, experimental = false, settingsOpen=false, onSettings, settingsButton }: {
  playback: Pick<ReturnType<typeof useVideoPlayback>, "time" | "duration" | "ready" | "playing" | "muted" | "playbackRate" | "toggle" | "seek" | "toggleMute" | "changeRate" | "fullscreen">; baseline: boolean; hasCaptions: boolean;
  showOriginal: boolean; onOriginal: (enabled?:boolean) => void; settingsOpen?:boolean; onSettings?:()=>void; settingsButton?:RefObject<HTMLButtonElement|null>; generatedBaseline?: boolean; experimental?: boolean;
}) {
  const { time, duration, ready, playing, muted, playbackRate, toggle, seek, toggleMute, changeRate, fullscreen } = playback;
  return (
      <div className="video-controls">
        <label className="sr-only" htmlFor="timeline">Seek video</label><input id="timeline" className="timeline" type="range" min={0} max={duration || 1} step={0.1} value={Math.min(time, duration || 1)} disabled={!ready} onChange={(e) => seek(Number(e.target.value))} aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`} />
        <div className="transport"><button className="icon-button" onClick={() => void toggle()} disabled={!ready} aria-label={playing ? "Pause video" : "Play video"}><Icon name={playing ? "pause" : "play"} /></button><button className="icon-button" onClick={toggleMute} aria-label={muted ? "Unmute video" : "Mute video"}><Icon name={muted ? "mute" : "volume"} /></button><span className="time-code">{formatTime(time)} <span>/ {formatTime(duration)}</span></span><div className="transport-right"><label className="sr-only" htmlFor="speed">Playback speed</label><select id="speed" aria-label="Playback speed" value={playbackRate} onChange={(e) => changeRate(Number(e.target.value))}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option></select>{onSettings&&<button ref={settingsButton} className="cc-button" onClick={onSettings} aria-label="Caption settings" aria-expanded={settingsOpen} aria-controls="caption-settings">CC</button>}<OriginalButton enabled={showOriginal||baseline} disabled={baseline||!hasCaptions} onChange={value=>onOriginal(value)}/><button className="icon-button" aria-label="Fullscreen player" onClick={() => void fullscreen()}><Icon name="expand" /></button></div></div>
      </div>
  );
}
