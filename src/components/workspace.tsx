"use client";
import {profileNamespace,sessionDefaults} from "@/lib/study-session";
import type {QuestionFile} from "@/lib/study-surveys";
import type {StudySession} from "@/lib/study-session";
import {PROFILE_KEY} from "@/lib/profile";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionVideo, CaptionProfile, Condition } from "@/lib/captions";
import { useRehearsal } from "./hooks/use-rehearsal";
import { CaptionTrackNotice, SoundTimeline } from "./caption-track";
import { VideoPlayer } from "./video-player";
import { useCaptionProfile } from "./hooks/use-caption-profile";
import {RecorderStatus} from "./recorder-status";
import { StudyRehearsal } from "./study-rehearsal";
import type {CueAnnotations} from "@/lib/cue-annotations";
import { Icon } from "./icon";


export function Workspace({ initialVideo, sourceAssistedVideo, demoSource, demoPoster = "/media/bunny-poster.jpg", demoCredit = "Blender Foundation · 2008", onMediaLockChange, annotations,session,questions }: { initialVideo: CaptionVideo; sourceAssistedVideo?: CaptionVideo; demoSource: string; demoPoster?: string; demoCredit?: string; questions?:QuestionFile;session?:StudySession; annotations?:CueAnnotations; onMediaLockChange?: (locked: boolean) => void }) {
  const {profile, update: setProfile, storageError} = useCaptionProfile(session?profileNamespace(session):PROFILE_KEY,session?sessionDefaults(session):undefined);
  const [manualCondition, setCondition] = useState<Condition>("personalized"); const [showOriginal, setShowOriginal] = useState(false);
  const assigned=session?.sequence[session.sequenceIndex].condition;
  const condition:Condition=session?(assigned==="baseline"?"baseline":"personalized"):manualCondition;
  const [seekTo, setSeekTo] = useState<{ seconds: number; nonce: number;source?:"participant"|"system"|"researcher" } | null>(null);
  const [notice, setNotice] = useState("");
  const data = sourceAssistedVideo ?? initialVideo; const source=demoSource;
  const rehearsal = useRehearsal({filmId:data.video_id,session});
  const { recording, startedAt, record } = rehearsal;
  const currentTime = useRef(0); const seekNonce = useRef(0);
  useEffect(() => { onMediaLockChange?.(startedAt !== null); }, [startedAt, onMediaLockChange]);
  const updateTime = useCallback((seconds: number) => { currentTime.current = seconds; rehearsal.setVideoTime(seconds); }, [rehearsal.setVideoTime]);
  useEffect(()=>{if(rehearsal.recorder?.resumed&&rehearsal.recorder.resumePosition>0)setSeekTo({seconds:rehearsal.recorder.resumePosition,nonce:++seekNonce.current,source:"system"})},[rehearsal.recorder]);
  function apply(next: CaptionProfile) { const previous=profile; setProfile(next); for(const field of Object.keys(next) as (keyof CaptionProfile)[])if(previous[field]!==next[field])rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field,from:previous[field],to:next[field]}); setNotice("Caption preferences saved."); }
  function original(value?: boolean,mode:"hold"|"toggle"="toggle") { const enabled = value ?? !showOriginal; setShowOriginal(enabled); record({ type: "original", video_s: currentTime.current, enabled,mode }); }
  function changeCondition(next: Condition) { rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field:"condition",from:condition,to:next,source:"researcher"});setCondition(next); setShowOriginal(false); record({ type: "condition", video_s: currentTime.current, condition: next }); record({ type: "original", video_s: currentTime.current, enabled: false,source:"system" }); }
  function jump(seconds: number) { setSeekTo({ seconds, nonce: ++seekNonce.current }); }
  const time=currentTime.current; const renders=useRef(0);renders.current++;const diagnostic=useRef<HTMLElement>(null);
  useEffect(()=>{if(process.env.NODE_ENV==="development"&&diagnostic.current)diagnostic.current.dataset.renderCount=String(renders.current)});
  const captionSource = data?.generated_with.caption_source;
  const viewerProfile = session&&assigned!=="personalized"?{...profile,...sessionDefaults(session),size:profile.size,position:profile.position,backdrop:profile.backdrop,textColor:profile.textColor}:profile;
  return <main ref={diagnostic} id="main" className="workspace">
    <RecorderStatus recorder={rehearsal.recorder} error={rehearsal.error}/>
    <div className="watch-layout"><section className="watch-column" aria-label="Video workspace"><div className="watch-heading"><h1>{data.title}<small>{demoCredit}</small></h1></div>
      <VideoPlayer session={session} recorder={rehearsal.recorder} questions={questions} recording={recording} onTelemetry={rehearsal.telemetry} settingsAllowed={!session||assigned==="personalized"} showTicks={session?.ticks??true} annotations={annotations} onApply={apply} poster={demoPoster} source={source} data={data} profile={viewerProfile} condition={condition} showOriginal={showOriginal} onOriginal={original} onTime={updateTime} onEvent={record} seekTo={seekTo} />
      <div className="film-footnote"><Icon name="leaf" size={16}/><span>{initialVideo.title} · {demoCredit}</span><a href="#media-credits">Credits</a></div>
    </section></div>
    {!session&&<details className="research-tools"><summary>Research tools {recording&&<span className="status-pill recording">Recording locally</span>}</summary>
    <div className="condition-switch" role="group" aria-label="Research caption condition"><button aria-pressed={condition==='personalized'} onClick={()=>changeCondition('personalized')}>Personalized</button><button aria-pressed={condition==='baseline'} onClick={()=>changeCondition('baseline')}>Reference baseline</button></div>
    <CaptionTrackNotice data={data}/><SoundTimeline annotations={annotations} data={data} time={time} profile={profile} condition={condition} showOriginal={showOriginal} jump={jump}/>
    <StudyRehearsal recorder={rehearsal.recorder} error={rehearsal.error} onStart={()=>rehearsal.start(currentTime.current,condition,profile,showOriginal)} onStop={()=>rehearsal.stop(currentTime.current)}/>
    </details>}
    {session&&<details className="study-recording-controls"><summary>Researcher recording controls</summary><StudyRehearsal recorder={rehearsal.recorder} error={rehearsal.error} onStart={()=>rehearsal.start(currentTime.current,condition,profile,showOriginal)} onStop={()=>rehearsal.stop(currentTime.current)}/></details>}
    <footer id="media-credits" className="page-footer"><div><span className="footer-brand">SceneCaptions</span><p>More of the story. On your terms.</p></div><div><p>Research prototype · No AI calls during viewing</p><p>Demo film: <a href={initialVideo.source_url} target="_blank" rel="noreferrer">{initialVideo.title}</a> · {initialVideo.license === "CC BY 3.0" ? <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a> : initialVideo.license}<br />{initialVideo.attribution}<br />{captionSource ? <>{data?.generated_with.kind === "source-assisted" ? "Generation reference: " : "Sound captions: "}<a href={captionSource.url} target="_blank" rel="noreferrer">{captionSource.author}</a> · {captionSource.license}. {data?.generated_with.kind === "source-assisted" ? "New wording generated and edited by SceneCaptions." : "Wording variants added by SceneCaptions."}</> : <>See the caption coverage above for this title.</>}</p>{data?.dialogue_source && <p>English subtitles: <a href={data.dialogue_source.url} target="_blank" rel="noreferrer">{data.dialogue_source.author}</a> · {data.dialogue_source.license}. Source wording and timing retained.</p>}</div></footer>
    <div className="sr-only" role="status" aria-live="polite">{notice || storageError}</div>
  </main>;
}
