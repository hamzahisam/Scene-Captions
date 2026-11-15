"use client";
import {conditionProfile,profileNamespace,sessionDefaults} from "@/lib/study-session";
import type {QuestionFile} from "@/lib/study-surveys";
import type {StudySession} from "@/lib/study-session";
import {PROFILE_KEY} from "@/lib/profile";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionVideo, CaptionProfile, Condition } from "@/lib/captions";
import { useRehearsal } from "./hooks/use-rehearsal";
import { CaptionTrackNotice, SoundTimeline } from "./caption-track";
import { VideoPlayer } from "./video-player";
import { useCaptionProfile } from "./hooks/use-caption-profile";
import {ResearcherDialog} from "./researcher-dialog";
import {RecorderStatus} from "./recorder-status";
import { StudyRehearsal } from "./study-rehearsal";
import { PriorRehearsal, RehearsalLogs } from "./rehearsal-logs";
import type {CueAnnotations} from "@/lib/cue-annotations";
import { Icon } from "./icon";
import { useFoldHeight } from "./hooks/use-fold-height";


export function Workspace({ initialVideo, sourceAssistedVideo, demoSource, demoPoster = "/media/bunny-poster.jpg", demoCredit = "Blender Foundation · 2008", onMediaLockChange, annotations,session,questions,onLeaveStudy }: { initialVideo: CaptionVideo; sourceAssistedVideo?: CaptionVideo; demoSource: string; demoPoster?: string; demoCredit?: string; questions?:QuestionFile;onLeaveStudy?:()=>void;session?:StudySession; annotations?:CueAnnotations; onMediaLockChange?: (locked: boolean) => void }) {
  const {profile, update: setProfile, storageError} = useCaptionProfile(session?profileNamespace(session):PROFILE_KEY,session?sessionDefaults(session):undefined);
  const [demoExtendDisplay,setDemoExtendDisplay]=useState(false);
  const extendDisplay=session?.extendDisplay??demoExtendDisplay;
  const [manualCondition, setCondition] = useState<Condition>("personalized"); const [showOriginal, setShowOriginal] = useState(false);
  const assigned=session?.sequence[session.sequenceIndex].condition;
  const condition:Condition=session?(assigned==="baseline"?"baseline":"personalized"):manualCondition;
  const [seekTo, setSeekTo] = useState<{ seconds: number; nonce: number;source?:"participant"|"system"|"researcher" } | null>(null);
  const [notice, setNotice] = useState("");
  const data = sourceAssistedVideo ?? initialVideo; const source=demoSource;
  const rehearsal = useRehearsal({filmId:data.video_id,session});
  const { recording, startedAt, record } = rehearsal;
  const currentTime = useRef(0); const seekNonce = useRef(0); const watchColumn = useRef<HTMLElement>(null); useFoldHeight(watchColumn);
  useEffect(() => { onMediaLockChange?.(startedAt !== null); }, [startedAt, onMediaLockChange]);
  const updateTime = useCallback((seconds: number) => { currentTime.current = seconds; rehearsal.setVideoTime(seconds); }, [rehearsal.setVideoTime]);
  useEffect(()=>{if(rehearsal.recorder?.resumed&&rehearsal.recorder.resumePosition>0)setSeekTo({seconds:rehearsal.recorder.resumePosition,nonce:++seekNonce.current,source:"system"})},[rehearsal.recorder]);
  function apply(next: CaptionProfile) { const previous=conditionProfile(profile,session),effective=conditionProfile(next,session); const changes=(Object.keys(effective) as (keyof CaptionProfile)[]).filter(field=>previous[field]!==effective[field]); setProfile({...profile,...Object.fromEntries(changes.map(field=>[field,effective[field]]))}); for(const field of changes)rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field,from:previous[field],to:effective[field]}); setNotice("Caption preferences saved."); }
  function original(value?: boolean,mode:"hold"|"toggle"="toggle") { const enabled = value ?? !showOriginal; setShowOriginal(enabled); record({ type: "original", video_s: currentTime.current, enabled,mode }); }
  function changeCondition(next: Condition) { rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field:"condition",from:condition,to:next,source:"researcher"});setCondition(next); setShowOriginal(false); record({ type: "condition", video_s: currentTime.current, condition: next }); record({ type: "original", video_s: currentTime.current, enabled: false,source:"system" }); }
  function startRecording() { rehearsal.start(currentTime.current,condition,profile,showOriginal); rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field:"extendDisplay",from:null,to:extendDisplay,source:"system"}); }
  function jump(seconds: number) { setSeekTo({ seconds, nonce: ++seekNonce.current }); }
  const time=currentTime.current; const renders=useRef(0);renders.current++;const diagnostic=useRef<HTMLElement>(null);
  useEffect(()=>{if(process.env.NODE_ENV==="development"&&diagnostic.current)diagnostic.current.dataset.renderCount=String(renders.current)});
  const captionSource = data?.generated_with.caption_source;
  const viewerProfile = conditionProfile(profile,session);
  return <main ref={diagnostic} id="main" className="workspace">
    <RecorderStatus allowExport={!session} recorder={rehearsal.recorder} error={rehearsal.error}/>
    {!session&&<PriorRehearsal prior={rehearsal.prior} openLog={rehearsal.openLog} onResume={()=>rehearsal.resumePrior()} onDiscard={()=>rehearsal.discardPrior()}/>}
    <div className="watch-layout"><section ref={watchColumn} className="watch-column" aria-label="Video workspace"><div className="watch-heading"><h1>{data.title}<small>{demoCredit}</small></h1></div>
      <VideoPlayer extendDisplay={extendDisplay} session={session} recorder={rehearsal.recorder} questions={questions} recording={recording} onTelemetry={rehearsal.telemetry} soundSettingsAllowed={!session||assigned==="personalized"} showTicks={session?.ticks??true} annotations={annotations} onApply={apply} poster={demoPoster} source={source} data={data} profile={viewerProfile} condition={condition} showOriginal={showOriginal} onOriginal={original} onTime={updateTime} onEvent={record} seekTo={seekTo} />
      <div className="film-footnote"><Icon name="leaf" size={16}/><span>{initialVideo.title} · {demoCredit}</span><a href="#media-credits">Credits</a></div>
    </section></div>
    {!session&&<details className="research-tools"><summary>Research tools {recording&&<span className="status-pill recording">Recording locally</span>}</summary>
    <div className="condition-switch" role="group" aria-label="Research caption condition"><button aria-pressed={condition==='personalized'} onClick={()=>changeCondition('personalized')}>Personalized</button><button aria-pressed={condition==='baseline'} onClick={()=>changeCondition('baseline')}>Reference baseline</button></div>
    <label><input type="checkbox" checked={demoExtendDisplay} onChange={e=>{setDemoExtendDisplay(e.target.checked);rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field:"extendDisplay",from:demoExtendDisplay,to:e.target.checked,source:"researcher"})}}/>Allow extra reading time for sound captions</label><p>May keep a sound caption visible for up to one second after the sound ends, stopping before another sound. This changes timing fidelity; source timings stay unchanged.</p>
    <CaptionTrackNotice data={data}/><SoundTimeline extendDisplay={extendDisplay} annotations={annotations} data={data} time={time} profile={profile} condition={condition} showOriginal={showOriginal} jump={jump}/>
    <StudyRehearsal recorder={rehearsal.recorder} error={rehearsal.error} onStart={()=>startRecording()} onStop={()=>rehearsal.stop(currentTime.current)} paused={!!rehearsal.prior} onNew={()=>rehearsal.newRehearsal()}/>
    <RehearsalLogs logs={rehearsal.logs} openLog={rehearsal.openLog} onDelete={id=>rehearsal.removeLog(id)} recordingId={recording?rehearsal.recorder?.context.session_id??null:null}/>
    </details>}
    <footer id="media-credits" className="page-footer"><div><span className="footer-brand">SceneCaptions</span><p>More of the story. On your terms.</p></div><div><p>Research prototype · No AI calls during viewing</p><p>Demo film: <a href={initialVideo.source_url} target="_blank" rel="noreferrer">{initialVideo.title}</a> · {initialVideo.license === "CC BY 3.0" ? <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a> : initialVideo.license}<br />{initialVideo.attribution}<br />{captionSource ? <>{data?.generated_with.kind === "source-assisted" ? "Generation reference: " : "Sound captions: "}<a href={captionSource.url} target="_blank" rel="noreferrer">{captionSource.author}</a> · {captionSource.license}. {data?.generated_with.kind === "source-assisted" ? "New wording generated and edited by SceneCaptions." : "Wording variants added by SceneCaptions."}</> : <>See the caption coverage above for this title.</>}</p>{data?.dialogue_source && <p>English subtitles: <a href={data.dialogue_source.url} target="_blank" rel="noreferrer">{data.dialogue_source.author}</a> · {data.dialogue_source.license}. Source wording and timing retained.</p>}</div></footer>
    {session&&<ResearcherDialog credential={session.researcher} onUnlock={()=>rehearsal.telemetry({type:"researcher_unlock",video_s:currentTime.current,source:"researcher"})}><StudyRehearsal recorder={rehearsal.recorder} error={rehearsal.error} onStart={startRecording} onStop={()=>rehearsal.stop(currentTime.current)}/><button onClick={()=>{rehearsal.telemetry({type:"researcher_action",action:"leave_study",video_s:currentTime.current,source:"researcher"});rehearsal.stop(currentTime.current);onLeaveStudy?.()}}>Leave study mode</button></ResearcherDialog>}
    <div className="sr-only" role="status" aria-live="polite">{notice || storageError}</div>
  </main>;
}
