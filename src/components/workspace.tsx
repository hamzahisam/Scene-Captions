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
import type { PlaybackClock } from "@/lib/playback-clock";
import { useViewerLanguage } from "./viewer-language";
import type { RecurrenceAnnotation } from "@/lib/caption-recurrence";
import { useFoldHeight } from "./hooks/use-fold-height";


export function Workspace({ initialVideo, sourceAssistedVideo, urdu, recurrences, demoSource, demoPoster = "/media/bunny-poster.jpg", demoCredit = "Blender Foundation · 2008", onMediaLockChange, annotations,session,questions,onLeaveStudy }: { initialVideo: CaptionVideo; sourceAssistedVideo?: CaptionVideo; urdu: CaptionVideo | null; recurrences?: readonly RecurrenceAnnotation[]; demoSource: string; demoPoster?: string; demoCredit?: string; questions?:QuestionFile;onLeaveStudy?:()=>void;session?:StudySession; annotations?:CueAnnotations; onMediaLockChange?: (locked: boolean) => void }) {
  const { t, storageAvailable } = useViewerLanguage();
  const {profile, update: setProfile, storageError} = useCaptionProfile(session?profileNamespace(session):PROFILE_KEY,session?sessionDefaults(session):undefined);
  const [demoExtendDisplay,setDemoExtendDisplay]=useState(false);
  const extendDisplay=session?.extendDisplay??demoExtendDisplay;
  const [manualCondition, setCondition] = useState<Condition>("personalized"); const [showOriginal, setShowOriginal] = useState(false);
  const assigned=session?.sequence[session.sequenceIndex].condition;
  const condition:Condition=session?(assigned==="baseline"?"baseline":"personalized"):manualCondition;
  const [seekTo, setSeekTo] = useState<{ seconds: number; nonce: number;source?:"participant"|"system"|"researcher" } | null>(null);
  const [saved, setSaved] = useState(0);
  const data = sourceAssistedVideo ?? initialVideo; const source=demoSource;
  const rehearsal = useRehearsal({filmId:data.video_id,session});
  const { recording, startedAt, record } = rehearsal;
  const currentTime = useRef(0); const seekNonce = useRef(0); const watchColumn = useRef<HTMLElement>(null); const [clock,setClock]=useState<PlaybackClock|null>(null),[researchOpen,setResearchOpen]=useState(false); useFoldHeight(watchColumn);
  useEffect(() => { onMediaLockChange?.(startedAt !== null); }, [startedAt, onMediaLockChange]);
  const updateTime = useCallback((seconds: number) => { currentTime.current = seconds; rehearsal.setVideoTime(seconds); }, [rehearsal.setVideoTime]);
  useEffect(()=>{if(rehearsal.recorder?.resumed&&rehearsal.recorder.resumePosition>0)setSeekTo({seconds:rehearsal.recorder.resumePosition,nonce:++seekNonce.current,source:"system"})},[rehearsal.recorder]);
  function apply(next: CaptionProfile) { const previous=conditionProfile(profile,session),effective=conditionProfile(next,session); const changes=(Object.keys(effective) as (keyof CaptionProfile)[]).filter(field=>previous[field]!==effective[field]); setProfile({...profile,...Object.fromEntries(changes.map(field=>[field,effective[field]]))}); for(const field of changes)rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field,from:previous[field],to:effective[field]}); if(changes.length)setSaved(count=>count+1); }
  function original(value?: boolean,mode:"hold"|"toggle"="toggle") { const enabled = value ?? !showOriginal; setShowOriginal(enabled); record({ type: "original", video_s: currentTime.current, enabled,mode }); }
  function changeCondition(next: Condition) { if(next===condition)return; const wasOriginal=showOriginal; setCondition(next); setShowOriginal(false); record({ type: "condition", video_s: currentTime.current, condition: next, from: condition, source: "researcher" }); if(wasOriginal)record({ type: "original", video_s: currentTime.current, enabled: false,source:"system" }); }
  function startRecording() { rehearsal.start(currentTime.current,condition,profile,showOriginal); rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field:"extendDisplay",from:null,to:extendDisplay,source:"system"}); }
  function jump(seconds: number) { setSeekTo({ seconds, nonce: ++seekNonce.current }); }
  const renders=useRef(0);renders.current++;const diagnostic=useRef<HTMLElement>(null);
  useEffect(()=>{if(process.env.NODE_ENV==="development"&&diagnostic.current)diagnostic.current.dataset.renderCount=String(renders.current)});
  const captionSource = data?.generated_with.caption_source;
  const viewerProfile = conditionProfile(profile,session);
  return <main ref={diagnostic} id="main" className="workspace">
    <RecorderStatus allowExport={!session} recorder={rehearsal.recorder} error={rehearsal.error}/>
    {!session&&<PriorRehearsal prior={rehearsal.prior} openLog={rehearsal.openLog} onResume={()=>rehearsal.resumePrior()} onDiscard={()=>rehearsal.discardPrior()}/>}
    <div className="watch-layout"><section ref={watchColumn} className="watch-column" aria-label={t("workspace")}><div className="watch-heading"><h1><bdi lang="en">{data.title}</bdi><small><bdi lang="en">{demoCredit}</bdi></small></h1></div>
      <VideoPlayer onClock={setClock} extendDisplay={extendDisplay} session={session} recorder={rehearsal.recorder} questions={questions} recording={recording} onTelemetry={rehearsal.telemetry} soundSettingsAllowed={!session||assigned==="personalized"} showTicks={session?.ticks??false} annotations={annotations} onApply={apply} poster={demoPoster} source={source} data={data} urdu={urdu} recurrences={recurrences} profile={viewerProfile} condition={condition} showOriginal={showOriginal} onOriginal={original} onTime={updateTime} onEvent={record} seekTo={seekTo} />
      <div className="film-footnote"><Icon name="leaf" size={16}/><bdi lang="en">{initialVideo.title} · {demoCredit}</bdi><a href="#media-credits">{t("credits")}</a></div>
    </section></div>
    {!session&&<details className="research-tools" onToggle={e=>setResearchOpen(e.currentTarget.open)}><summary><span className="rt-title">{t("research")}</span><span className="rt-status">{recording?<span className="status-pill recording">{t("recording")}</span>:<span className="rt-quiet">{t("recorderOff")}</span>}<span className="rt-quiet">{t(condition==='personalized'?'personalized':'baseline')}</span></span></summary>
    <div className="rt-grid" lang="en" dir="ltr">
     <div className="rt-col">
      <section className="rt-section" aria-labelledby="rt-recording"><h3 id="rt-recording">Recording</h3>
       <StudyRehearsal recorder={rehearsal.recorder} error={rehearsal.error} onStart={()=>startRecording()} onStop={()=>rehearsal.stop(currentTime.current)} paused={!!rehearsal.prior} onNew={()=>rehearsal.newRehearsal()}/>
      </section>
     </div>
     <div className="rt-col">
      <section className="rt-section" aria-labelledby="rt-condition"><h3 id="rt-condition">Caption condition</h3>
       <div className="condition-switch" role="group" aria-label="Research caption condition"><button aria-pressed={condition==='personalized'} onClick={()=>changeCondition('personalized')}>Personalized</button><button aria-pressed={condition==='baseline'} onClick={()=>changeCondition('baseline')}>Reference baseline</button></div>
       <label className="rt-check"><input type="checkbox" checked={demoExtendDisplay} onChange={e=>{setDemoExtendDisplay(e.target.checked);rehearsal.telemetry({type:"profile_change",video_s:currentTime.current,field:"extendDisplay",from:demoExtendDisplay,to:e.target.checked,source:"researcher"})}}/><span>Allow extra reading time for sound captions</span></label>
       <p className="rt-help">May keep a sound caption visible for up to one second after the sound ends, stopping before another sound. This changes timing fidelity; source timings stay unchanged.</p>
      </section>
      <section className="rt-section" aria-labelledby="rt-timeline"><h3 id="rt-timeline">Sound timeline</h3>
       <CaptionTrackNotice data={data}/><SoundTimeline extendDisplay={extendDisplay} annotations={annotations} data={data} clock={clock} live={researchOpen} profile={profile} condition={condition} showOriginal={showOriginal} jump={jump}/>
      </section>
     </div>
     <section className="rt-section rt-wide" aria-labelledby="rt-logs"><h3 id="rt-logs">Saved rehearsals</h3>
      <RehearsalLogs logs={rehearsal.logs} openLog={rehearsal.openLog} onDelete={id=>rehearsal.removeLog(id)} recordingId={recording?rehearsal.recorder?.context.session_id??null:null}/>
     </section>
    </div>
    </details>}
    <footer id="media-credits" className="page-footer">
      <div><span className="footer-brand" lang="en">SceneCaptions</span><p>{t("footerLine")}</p></div>
      <div>
        <p>{t("demoFilm")}: <a href={initialVideo.source_url} target="_blank" rel="noreferrer" lang="en"><bdi>{initialVideo.title}</bdi></a> · <bdi lang="en">{initialVideo.license === "CC BY 3.0" ? <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a> : initialVideo.license}</bdi><br />
          <bdi lang="en">{initialVideo.attribution}</bdi><br />
          {captionSource ? <>{t(data.generated_with.kind === "source-assisted" ? "generationReference" : "soundCaptions")}: <a href={captionSource.url} target="_blank" rel="noreferrer" lang="en"><bdi>{captionSource.author}</bdi></a> · <bdi lang="en">{captionSource.license}</bdi>. {t(data.generated_with.kind === "source-assisted" ? "newWording" : "wordingVariants")}</> : t("coverage")}
        </p>
        {data.dialogue_source && <p>{t("englishSubtitles")}: <a href={data.dialogue_source.url} target="_blank" rel="noreferrer" lang="en"><bdi>{data.dialogue_source.author}</bdi></a> · <bdi lang="en">{data.dialogue_source.license}</bdi>. {t("sourceRetained")}</p>}
      </div>
    </footer>
    {session&&<ResearcherDialog credential={session.researcher} onUnlock={()=>rehearsal.telemetry({type:"researcher_unlock",video_s:currentTime.current,source:"researcher"})}><StudyRehearsal recorder={rehearsal.recorder} error={rehearsal.error} onStart={startRecording} onStop={()=>rehearsal.stop(currentTime.current)}/><button onClick={()=>{rehearsal.telemetry({type:"researcher_action",action:"leave_study",video_s:currentTime.current,source:"researcher"});rehearsal.stop(currentTime.current);onLeaveStudy?.()}}>Leave study mode</button></ResearcherDialog>}
    {(storageError || !storageAvailable) && <p className="inline-error" role="status">{t("storageError")}</p>}
    <div className="sr-only" role="status">{saved > 0 && !storageError && <span key={saved}>{t("saved")}</span>}</div>
  </main>;
}
