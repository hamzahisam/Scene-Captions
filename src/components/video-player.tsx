"use client";
import type { PlaybackClock } from "@/lib/playback-clock";
import type {StudySession} from "@/lib/study-session";import type {QuestionFile} from "@/lib/study-surveys";import type {TelemetryRecorder} from "@/lib/telemetry-storage";
import type {TelemetryInput} from "@/lib/telemetry";
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

// Remembered across film switches: the player remounts per film, and resetting these made the layout jump.
const layoutMemory={wide:false,collapsed:false};
export function VideoPlayer({ onClock, source, data, profile, extendDisplay=false, condition, showOriginal, onOriginal, onTime, onEvent, seekTo, onApply, annotations, onTelemetry=()=>{},recording=false,session,recorder,questions, soundSettingsAllowed=true,showTicks=true, poster = "/media/bunny-poster.jpg" }: {
  onClock?: (clock: PlaybackClock) => void;
  extendDisplay?:boolean;source: string; data: CaptionVideo | null; profile: CaptionProfile; condition: Condition;
  showOriginal: boolean; onOriginal: (enabled?:boolean,mode?:"toggle"|"hold") => void; onTime: (time: number) => void;
  onEvent: (event: StudyEvent) => void; seekTo: { seconds: number; nonce: number;source?:"participant"|"system"|"researcher" } | null;
  session?:StudySession;recorder?:TelemetryRecorder|null;questions?:QuestionFile;onTelemetry?:(event:TelemetryInput)=>void;recording?:boolean;soundSettingsAllowed?:boolean;showTicks?:boolean; annotations?:CueAnnotations; poster?: string; onApply:(p:CaptionProfile)=>void;
}) {
  const playback = useVideoPlayback({ source, seekTo, onTime, onEvent });
  useEffect(() => { onClock?.(playback.clock); }, [onClock, playback.clock]);
  const { video, frame, ready, playing, error, waiting, duration, time, toggle } = playback;
  const [settingsOpen,setSettingsOpen]=useState(false),[narrow,setNarrow]=useState(false); const settingsButton=useRef<HTMLButtonElement>(null);
  const [surveyActive,setSurveyActive]=useState(false);const surveyActiveRef=useRef(false);const surveyChanged=useCallback((active:boolean)=>{const wasActive=surveyActiveRef.current;surveyActiveRef.current=active;setSurveyActive(active);if(wasActive&&!active)requestAnimationFrame(()=>{if(surveyActiveRef.current)return;if(settingsButton.current)settingsButton.current.focus();else frame.current?.focus()})},[frame]);
  const [helpOpen,setHelpOpen]=useState(false),[shortcutNotice,setShortcutNotice]=useState(""); const helpButton=useRef<HTMLButtonElement>(null);const closeHelp=useCallback(()=>setHelpOpen(false),[]);
  const closeSettings=useCallback(()=>setSettingsOpen(false),[]);
  // Wide screens dock caption settings beside the player; fullscreen and narrow screens keep the in-frame sheet.
  const dock=useRef<HTMLDivElement>(null);const [wide,setWide]=useState(layoutMemory.wide),[isFull,setIsFull]=useState(false),[dockFocus,setDockFocus]=useState(false),[dockHover,setDockHover]=useState(false);
  useEffect(()=>{const mq=window.matchMedia("(min-width:1100px)");const apply=()=>{layoutMemory.wide=mq.matches;setWide(mq.matches)};apply();mq.addEventListener("change",apply);const full=()=>setIsFull(!!document.fullscreenElement);document.addEventListener("fullscreenchange",full);return()=>{mq.removeEventListener("change",apply);document.removeEventListener("fullscreenchange",full)}},[]);
  const docked=wide&&!isFull;const dockedRef=useRef(false);dockedRef.current=docked;
  const [dockCollapsed,setDockCollapsed]=useState(layoutMemory.collapsed);const collapsedRef=useRef(false);collapsedRef.current=dockCollapsed;
  useEffect(()=>{try{const c=localStorage.getItem("scenecaptions.settingsDock")==="collapsed";layoutMemory.collapsed=c;setDockCollapsed(c)}catch{/* preference simply is not remembered */}},[]);
  const toggleDock=useCallback((collapse:boolean)=>{layoutMemory.collapsed=collapse;setDockCollapsed(collapse);if(collapse){setDockFocus(false);setDockHover(false)}try{localStorage.setItem("scenecaptions.settingsDock",collapse?"collapsed":"expanded")}catch{/* ignore */}},[]);
  useEffect(()=>{if(docked)setSettingsOpen(false);else{setDockFocus(false);setDockHover(false)}},[docked]);
  const focusDock=useCallback(()=>{const go=()=>{const el=dock.current;(el?.querySelector<HTMLElement>("input[type=radio]:checked")||el?.querySelector<HTMLElement>("select,input,button"))?.focus()};if(collapsedRef.current){toggleDock(false);setTimeout(go,60)}else go()},[toggleDock]);
  useEffect(()=>{const el=frame.current;if(!el)return;const resize=new ResizeObserver(()=>setNarrow(el.clientWidth<560&&!document.fullscreenElement));resize.observe(el);const full=()=>setNarrow(el.clientWidth<560&&!document.fullscreenElement);document.addEventListener("fullscreenchange",full);return()=>{resize.disconnect();document.removeEventListener("fullscreenchange",full)}},[frame]);
  const soundControlsShown=soundSettingsAllowed&&condition!=="baseline"&&!!data?.cues.length;
  usePlayerShortcuts(frame,profile.shortcuts&&!surveyActive,profile.pageWideShortcuts&&!surveyActive,{soundControls:soundControlsShown,toggle:()=>void toggle(),seek:delta=>playback.seek((video.current?.currentTime||0)+delta,"keyboard"),settings:()=>{if(dockedRef.current){focusDock();return}setHelpOpen(false);setSettingsOpen(v=>!v)},original:(value,mode)=>{if(soundControlsShown)onOriginal(value,mode)},originalEnabled:showOriginal,amount:delta=>{if(!soundControlsShown)return;const detail=Math.max(1,Math.min(3,profile.detail+delta)) as 1|2|3;onApply({...profile,detail});setShortcutNotice(`Amount: ${["","Essential","Balanced","Rich"][detail]}`)},size:delta=>{const sizes=["standard","large","extra-large"] as const;const size=sizes[Math.max(0,Math.min(2,sizes.indexOf(profile.size)+delta))];onApply({...profile,size});setShortcutNotice(`Text size: ${size}`)},fullscreen:()=>void playback.fullscreen(),sound:direction=>{const target=adjacentSound(data?.cues||[],video.current?.currentTime||0,direction);if(target!==null)playback.seek(target,"sound-navigation")},help:()=>{setSettingsOpen(false);setHelpOpen(true)},close:()=>{setHelpOpen(false);setSettingsOpen(false)}});
  const settingsHost=useRef<HTMLDivElement>(null);
  const settingsShown=docked?dockFocus:settingsOpen;const settingsSource=useRef<"participant"|"system">("participant");const previousSettings=useRef(false);useEffect(()=>{if(previousSettings.current!==settingsShown){onTelemetry({type:"settings",open:settingsShown,video_s:video.current?.currentTime||0,source:settingsSource.current});previousSettings.current=settingsShown;settingsSource.current="participant"}},[settingsShown,onTelemetry,video]);
  const mismatch=!!data&&duration>0&&Math.abs(duration-data.duration_seconds)>2;
  return <div className={`player-shell${docked?" docked":""}${docked&&dockCollapsed?" dock-collapsed":""}`}><div className="player-main">
    <div className={`video-frame ${settingsOpen?"settings-open":""} ${narrow?"settings-below":""}`} ref={frame} role="region" aria-label="Video player" tabIndex={0}><div className="video-stage" inert={surveyActive}>
      <video ref={video} src={source} poster={source.startsWith("blob:") ? undefined : poster} preload="metadata" playsInline
        aria-label={`${data?.title || "Your video"} video player`} aria-describedby="video-description" tabIndex={-1}
        onClick={()=>{if(ready)void toggle()}} {...playback.events} />

      {!playing && !error && <button className="big-play" onClick={() => void toggle()} disabled={!ready} aria-label={ready ? "Play video" : "Loading video"}><Icon name="play" size={30} /></button>}
      {waiting && playing && <span className="buffering" role="status">Buffering video…</span>}
      <CaptionExperience soundSettingsAllowed={soundControlsShown} extendDisplay={extendDisplay} onSurveyActive={surveyChanged} session={session} recorder={recorder} questions={questions} playing={playing} ended={playback.ended} pauseForSurvey={()=>{if(settingsOpen)settingsSource.current="system";setSettingsOpen(false);setHelpOpen(false);playback.pause("system");playback.exitNativeFullscreen()}} resumeAfterSurvey={()=>void playback.play("system")} clock={playback.clock} data={data} duration={duration} profile={profile} condition={condition} original={showOriginal} video={video} host={settingsHost} dock={dock} docked={docked} trigger={settingsButton} recording={recording} onTelemetry={onTelemetry} open={docked?(dockFocus||dockHover):settingsOpen} close={closeSettings} onApply={onApply} annotations={annotations}/>
      {(showOriginal||condition==="baseline")&&<span className="original-indicator">Original captions</span>}
      <PlayerControls helpButton={helpButton} onHelp={()=>{setSettingsOpen(false);setHelpOpen(true)}} originalLocked={!soundControlsShown} showTicks={showTicks} cues={data?.cues} annotations={annotations} playback={playback} baseline={condition === "baseline"} hasCaptions={!!data?.cues.length} showOriginal={showOriginal} onOriginal={onOriginal} generatedBaseline={data?.generated_with.kind === "source-assisted"} experimental={data?.generated_with.experimental} settingsOpen={settingsOpen} onSettings={()=>{if(dockedRef.current){focusDock();return}setSettingsOpen(v=>!v)}} settingsButton={settingsButton} />
      </div><div ref={settingsHost}/><ShortcutHelp soundControls={soundControlsShown} open={helpOpen} close={closeHelp} trigger={helpButton} profile={profile} onChange={onApply}/>
    </div>
    {!docked&&!isFull&&!settingsOpen&&<button type="button" className="settings-bar" aria-expanded="false" aria-controls="caption-settings" aria-label={`Open caption settings. Now: ${soundControlsShown?["","Essential","Balanced","Rich"][profile.detail]+" detail, ":""}${({standard:"standard",large:"large","extra-large":"extra large"} as const)[profile.size]} text.`} onClick={()=>{setHelpOpen(false);setSettingsOpen(true)}}><Icon name="captions" size={22}/><span className="settings-bar-text"><strong>Caption settings</strong><small>{soundControlsShown?["","Essential","Balanced","Rich"][profile.detail]+" · ":""}{({standard:"Standard",large:"Large","extra-large":"Extra large"} as const)[profile.size]} text · Pace {profile.readingSpeed}</small></span><Icon name="chevron" size={20}/></button>}
    {error && <p role="alert" className="inline-error">{error}</p>}
    {mismatch && <p role="alert" className="inline-error">Caption timing does not match this video’s duration. Captions are hidden. The prepared track needs review.</p>}
    {!data && <p className="inline-notice">Sound captions are unavailable for this film.</p>}
    <div className="sr-only" role="status" aria-live="polite">{shortcutNotice}</div>
    <p id="video-description" className="sr-only">Dialogue stays fixed while sound captions follow your preferences. Caption settings sit beside the player on wide screens, or open from the Caption settings button. Focus the player for keyboard controls; press question mark for help. {soundControlsShown?"Original toggles the source wording, or hold it to compare temporarily.":"Sound captions are fixed for this session."} Research tools contain upcoming sound text and are not part of participant viewing.</p>
  </div>{docked&&<button type="button" className="dock-toggle" aria-expanded={!dockCollapsed} aria-controls="caption-settings" onClick={()=>toggleDock(!dockCollapsed)}><Icon name="captions" size={20}/><span className="dock-toggle-label">{dockCollapsed?"Show caption settings":"Hide"}</span><Icon name={dockCollapsed?"back":"arrow"} size={18}/></button>}<div className="settings-dock-wrap"><div ref={dock} className={`settings-dock${docked?" on":""}`} onFocusCapture={()=>setDockFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setDockFocus(false)}} onPointerEnter={()=>setDockHover(true)} onPointerLeave={()=>setDockHover(false)}/></div></div>;
}
