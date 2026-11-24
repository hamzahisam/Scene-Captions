"use client";
import type { PlaybackClock } from "@/lib/playback-clock";
import type {StudySession} from "@/lib/study-session";import type {QuestionFile} from "@/lib/study-surveys";import type {TelemetryRecorder} from "@/lib/telemetry-storage";
import type {TelemetryInput} from "@/lib/telemetry";
import { useCallback, useEffect, useRef, useState } from "react";
import {CaptionExperience} from "./caption-experience";
import { useVideoPlayback } from "./hooks/use-video-playback";
import { PlayerControls } from "./player-controls";
import type { CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import type { StudyEvent } from "@/lib/session";
import {usePlayerShortcuts} from "./hooks/use-player-shortcuts";
import {ShortcutHelp} from "./shortcut-help";
import {adjacentSound} from "@/lib/sound-navigation";
import { detailLabels, sizeLabels } from "@/lib/viewer-language";
import type { RecurrenceAnnotation } from "@/lib/caption-recurrence";
import { useViewerLanguage } from "./viewer-language";
import { selectViewerCaptionTrack } from "@/lib/viewer-caption-track";
import type {CueAnnotations} from "@/lib/cue-annotations";
import { Icon } from "./icon";

// Remembered across film switches: the player remounts per film, and resetting these made the layout jump.
const layoutMemory={wide:false,collapsed:false};
export function VideoPlayer({ onClock, source, data, urdu, recurrences, profile, extendDisplay=false, condition, showOriginal, onOriginal, onTime, onEvent, seekTo, onApply, annotations, onTelemetry=()=>{},recording=false,session,recorder,questions, soundSettingsAllowed=true,showTicks=true, poster = "/media/bunny-poster.jpg" }: {
  onClock?: (clock: PlaybackClock) => void;
  extendDisplay?:boolean;source: string; data: CaptionVideo | null; profile: CaptionProfile; condition: Condition; urdu: CaptionVideo | null; recurrences?: readonly RecurrenceAnnotation[];
  showOriginal: boolean; onOriginal: (enabled?:boolean,mode?:"toggle"|"hold") => void; onTime: (time: number) => void;
  onEvent: (event: StudyEvent) => void; seekTo: { seconds: number; nonce: number;source?:"participant"|"system"|"researcher" } | null;
  session?:StudySession;recorder?:TelemetryRecorder|null;questions?:QuestionFile;onTelemetry?:(event:TelemetryInput)=>void;recording?:boolean;soundSettingsAllowed?:boolean;showTicks?:boolean; annotations?:CueAnnotations; poster?: string; onApply:(p:CaptionProfile)=>void;
}) {
  const { t } = useViewerLanguage();
  const track = selectViewerCaptionTrack(data, urdu, profile.captionLanguage, condition, showOriginal, !!session);
  const playback = useVideoPlayback({ source, seekTo, onTime, onEvent });
  useEffect(() => { onClock?.(playback.clock); }, [onClock, playback.clock]);
  const { video, frame, ready, playing, error, waiting, duration, time, toggle } = playback;
  const [settingsOpen,setSettingsOpen]=useState(false);
  const settingsButton=useRef<HTMLButtonElement>(null), settingsBar=useRef<HTMLButtonElement>(null);
  const [feedback, setFeedback] = useState<HTMLDivElement | null>(null);
  const [surveyActive,setSurveyActive]=useState(false);const surveyActiveRef=useRef(false);const surveyChanged=useCallback((active:boolean)=>{const wasActive=surveyActiveRef.current;surveyActiveRef.current=active;setSurveyActive(active);if(wasActive&&!active)requestAnimationFrame(()=>{if(surveyActiveRef.current)return;if(settingsButton.current)settingsButton.current.focus();else frame.current?.focus()})},[frame]);
  const [helpOpen,setHelpOpen]=useState(false),[shortcutNotice,setShortcutNotice]=useState<{field:"detail"|"textSize";label: (typeof detailLabels)[number] | (typeof sizeLabels)[keyof typeof sizeLabels]} | null>(null); const helpButton=useRef<HTMLButtonElement>(null);const closeHelp=useCallback(()=>setHelpOpen(false),[]);
  const closeSettings=useCallback(()=>setSettingsOpen(false),[]);
  // Wide screens dock caption settings beside the player; fullscreen and narrow screens keep the in-frame sheet.
  const dock=useRef<HTMLDivElement>(null);const [wide,setWide]=useState(layoutMemory.wide),[isFull,setIsFull]=useState(false),[dockFocus,setDockFocus]=useState(false);
  useEffect(()=>{const mq=window.matchMedia("(min-width:1100px)");const apply=()=>{layoutMemory.wide=mq.matches;setWide(mq.matches)};apply();mq.addEventListener("change",apply);const full=()=>setIsFull(!!document.fullscreenElement);document.addEventListener("fullscreenchange",full);return()=>{mq.removeEventListener("change",apply);document.removeEventListener("fullscreenchange",full)}},[]);
  const docked=wide&&!isFull;const dockedRef=useRef(false);dockedRef.current=docked;
  const [dockCollapsed,setDockCollapsed]=useState(layoutMemory.collapsed);const collapsedRef=useRef(false);collapsedRef.current=dockCollapsed;
  useEffect(()=>{try{const c=localStorage.getItem("scenecaptions.settingsDock")==="collapsed";layoutMemory.collapsed=c;setDockCollapsed(c)}catch{/* preference simply is not remembered */}},[]);
  const toggleDock=useCallback((collapse:boolean)=>{layoutMemory.collapsed=collapse;setDockCollapsed(collapse);if(collapse)setDockFocus(false);try{localStorage.setItem("scenecaptions.settingsDock",collapse?"collapsed":"expanded")}catch{/* ignore */}},[]);
  useEffect(()=>{if(docked)setSettingsOpen(false);else setDockFocus(false)},[docked]);
  useEffect(() => {
    const panel = dock.current;
    if (!panel) return;
    const enter = () => setDockFocus(true);
    const leave = (event: FocusEvent) => {
      if (!panel.contains(event.relatedTarget as Node | null)) setDockFocus(false);
    };
    panel.addEventListener("focusin", enter);
    panel.addEventListener("focusout", leave);
    return () => { panel.removeEventListener("focusin", enter); panel.removeEventListener("focusout", leave); };
  }, []);
  const focusDock=useCallback(()=>{const go=()=>{const el=dock.current;(el?.querySelector<HTMLElement>("input[type=radio]:checked")||el?.querySelector<HTMLElement>("select,input,button"))?.focus()};if(collapsedRef.current){toggleDock(false);setTimeout(go,60)}else go()},[toggleDock]);
  const soundControlsShown=soundSettingsAllowed&&condition!=="baseline"&&!!data?.cues.length;
  usePlayerShortcuts(frame,profile.shortcuts&&!surveyActive,profile.pageWideShortcuts&&!surveyActive,{soundControls:soundControlsShown,toggle:()=>void toggle(),seek:delta=>playback.seek((video.current?.currentTime||0)+delta,"keyboard"),settings:()=>{if(dockedRef.current){focusDock();return}setHelpOpen(false);setSettingsOpen(v=>!v)},original:(value,mode)=>{if(soundControlsShown)onOriginal(value,mode)},originalEnabled:showOriginal,amount:delta=>{if(!soundControlsShown)return;const detail=Math.max(1,Math.min(3,profile.detail+delta)) as 1|2|3;onApply({...profile,detail});setShortcutNotice({field:"detail",label:detailLabels[detail-1]})},size:delta=>{const sizes=["standard","large","extra-large"] as const;const size=sizes[Math.max(0,Math.min(2,sizes.indexOf(profile.size)+delta))];onApply({...profile,size});setShortcutNotice({field:"textSize",label:sizeLabels[size]})},fullscreen:()=>void playback.fullscreen(),sound:direction=>{const target=adjacentSound(data?.cues||[],video.current?.currentTime||0,direction);if(target!==null)playback.seek(target,"sound-navigation")},help:()=>{setSettingsOpen(false);setHelpOpen(true)},close:()=>{setHelpOpen(false);setSettingsOpen(false)}});
  const [controlsIdle, setControlsIdle] = useState(false);
  useEffect(() => {
    const player = frame.current;
    if (!player) return;
    let timer: ReturnType<typeof setTimeout>;
    let pointerDown = false;
    const activity = () => {
      setControlsIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!pointerDown && !player.querySelector(".video-controls :focus-visible")) setControlsIdle(true);
      }, 3000);
    };
    const press = () => { pointerDown = true; activity(); };
    const release = () => { pointerDown = false; activity(); };
    const events = ["pointermove", "pointerenter", "keydown", "input", "focusin", "focusout"] as const;
    events.forEach(event => player.addEventListener(event, activity));
    player.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    activity();
    return () => {
      clearTimeout(timer);
      events.forEach(event => player.removeEventListener(event, activity));
      player.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [frame]);
  const settingsHost=useRef<HTMLDivElement>(null);
  const settingsTrigger = isFull ? settingsButton : settingsBar;
  const settingsShown=docked?dockFocus:settingsOpen;const settingsSource=useRef<"participant"|"system">("participant");const previousSettings=useRef(false);useEffect(()=>{if(previousSettings.current!==settingsShown){onTelemetry({type:"settings",open:settingsShown,video_s:video.current?.currentTime||0,source:settingsSource.current});previousSettings.current=settingsShown;settingsSource.current="participant"}},[settingsShown,onTelemetry,video]);
  const mismatch=!!data&&duration>0&&Math.abs(duration-data.duration_seconds)>2;
  return <div className={`player-shell viewer-player${docked?" docked":""}${docked&&dockCollapsed?" dock-collapsed":""}`}><div className="player-main">
    <div className={`video-frame ${controlsIdle ? "controls-idle" : ""} ${settingsOpen?"settings-open":""}`} ref={frame} role="region" aria-label={t("videoPlayer")} tabIndex={0}><div className="video-stage" inert={surveyActive || settingsOpen || helpOpen}>
      <div className="viewer-picture">
      <video ref={video} src={source} poster={source.startsWith("blob:") ? undefined : poster} preload="metadata" playsInline
        aria-label={t("videoPlayer")} aria-describedby="video-description" tabIndex={-1}
        onClick={()=>{if(ready)void toggle()}} {...playback.events} />

      {!playing && !error && <button className="big-play" onClick={() => void toggle()} disabled={!ready} aria-label={t(ready ? "play" : "loadingVideo")}><Icon name="play" size={30} /></button>}
      {waiting && playing && <span className="buffering" role="status">{t("buffering")}</span>}
      <CaptionExperience soundSettingsAllowed={soundControlsShown} extendDisplay={extendDisplay} onSurveyActive={surveyChanged} session={session} recorder={recorder} questions={questions} playing={playing} ended={playback.ended} pauseForSurvey={()=>{if(settingsOpen)settingsSource.current="system";setSettingsOpen(false);setHelpOpen(false);playback.pause("system");playback.exitNativeFullscreen()}} resumeAfterSurvey={()=>void playback.play("system")} clock={playback.clock} data={data} urdu={urdu} recurrences={recurrences} feedback={feedback} duration={duration} profile={profile} condition={condition} original={showOriginal} video={video} host={settingsHost} dock={dock} docked={docked} trigger={settingsTrigger} recording={recording} onTelemetry={onTelemetry} open={docked?!dockCollapsed:settingsOpen} close={closeSettings} onApply={onApply} annotations={annotations}/>
      {(showOriginal||condition==="baseline")&&<span className="original-indicator">{t("original")}</span>}
      </div>
      <PlayerControls helpButton={helpButton} onHelp={()=>{setSettingsOpen(false);setHelpOpen(true)}} originalLocked={!soundControlsShown} showTicks={showTicks} cues={data?.cues} annotations={annotations} playback={playback} baseline={condition === "baseline"} hasCaptions={!!data?.cues.length} showOriginal={showOriginal} onOriginal={onOriginal} generatedBaseline={data?.generated_with.kind === "source-assisted"} experimental={data?.generated_with.experimental} settingsOpen={settingsOpen} onSettings={()=>{if(dockedRef.current){focusDock();return}setHelpOpen(false);setSettingsOpen(v=>!v)}} settingsButton={settingsButton} />
      <div className="viewer-player-notes">
        <div className="viewer-feedback" ref={setFeedback} />
        {!track.locked && track.language === "ur" && <p role={track.unavailable ? "status" : undefined} className="viewer-track-notice">
          {t(track.unavailable ? "translationMissing" : "translationDraft")}
        </p>}
      </div>
      </div><div ref={settingsHost} className="viewer-settings-host"/><ShortcutHelp soundControls={soundControlsShown} open={helpOpen} close={closeHelp} trigger={helpButton} profile={profile} onChange={onApply}/>
    </div>
    {!docked && !isFull && <button type="button" ref={settingsBar} className="settings-bar" aria-expanded={settingsOpen}
      aria-controls={settingsOpen ? "caption-settings" : undefined} onClick={() => {setHelpOpen(false);setSettingsOpen(value=>!value)}}>
      <Icon name="captions" size={22}/><span className="settings-bar-text"><strong>{t("captionSettings")}</strong>
        <small>{soundControlsShown && `${t(detailLabels[profile.detail-1])} · `}{t(sizeLabels[profile.size])}</small></span><Icon name="chevron" size={20}/>
    </button>}
    {error && <p role="alert" className="inline-error">{t(error)}</p>}
    {mismatch && <p role="alert" className="inline-error">{t("timingError")}</p>}
    {!data && <p className="inline-notice">{t("noCaptions")}</p>}
    <div className="sr-only" role="status">{shortcutNotice && `${t(shortcutNotice.field)} · ${t(shortcutNotice.label)}`}</div>
    <p id="video-description" className="sr-only">{t("videoDescription")}</p>
  </div>{docked&&<button type="button" className="dock-toggle" aria-expanded={!dockCollapsed} aria-controls="caption-settings"
    aria-label={t(dockCollapsed ? "openSettings" : "closeSettings")} onClick={()=>toggleDock(!dockCollapsed)}>
    <Icon name="captions" size={20}/><span className="dock-toggle-label">{t(dockCollapsed ? "openSettings" : "hideSettings")}</span>
    <Icon name={dockCollapsed?"back":"arrow"} size={18}/></button>}<div className="settings-dock-wrap"><div ref={dock} className={`settings-dock${docked?" on":""}`}/></div></div>;
}
