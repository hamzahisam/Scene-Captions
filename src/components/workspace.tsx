"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionVideo, CaptionProfile, Condition } from "@/lib/captions";
import { useRehearsal } from "./hooks/use-rehearsal";
import { CaptionTrackNotice, SoundTimeline } from "./caption-track";
import { VideoPlayer } from "./video-player";
import { useCaptionProfile } from "./hooks/use-caption-profile";
import { StudyRehearsal } from "./study-rehearsal";
import type {CueAnnotations} from "@/lib/cue-annotations";
import { Icon } from "./icon";


export function Workspace({ initialVideo, sourceAssistedVideo, demoSource, demoPoster = "/media/bunny-poster.jpg", demoCredit = "Blender Foundation · 2008", onMediaLockChange, annotations }: { initialVideo: CaptionVideo; sourceAssistedVideo?: CaptionVideo; demoSource: string; demoPoster?: string; demoCredit?: string; annotations?:CueAnnotations; onMediaLockChange?: (locked: boolean) => void }) {
  const {profile, update: setProfile, storageError} = useCaptionProfile();
  const [condition, setCondition] = useState<Condition>("personalized"); const [showOriginal, setShowOriginal] = useState(false);
  const [seekTo, setSeekTo] = useState<{ seconds: number; nonce: number } | null>(null);
  const [notice, setNotice] = useState("");
  const data = sourceAssistedVideo ?? initialVideo; const source=demoSource;
  const rehearsal = useRehearsal();
  const { recording, events, startedAt, sessionId, stoppedElapsed, record } = rehearsal;
  const currentTime = useRef(0); const seekNonce = useRef(0);
  useEffect(() => { onMediaLockChange?.(startedAt !== null); }, [startedAt, onMediaLockChange]);
  const updateTime = useCallback((seconds: number) => { currentTime.current = seconds; }, []);
  function apply(next: CaptionProfile) { setProfile(next); record({ type: "profile", video_s: currentTime.current, profile: next }); setNotice("Caption preferences saved."); }
  function original(value?: boolean) { const enabled = value ?? !showOriginal; setShowOriginal(enabled); record({ type: "original", video_s: currentTime.current, enabled }); }
  function changeCondition(next: Condition) { setCondition(next); setShowOriginal(false); record({ type: "condition", video_s: currentTime.current, condition: next }); record({ type: "original", video_s: currentTime.current, enabled: false }); }
  function jump(seconds: number) { setSeekTo({ seconds, nonce: ++seekNonce.current }); }
  const time=currentTime.current; const renders=useRef(0);renders.current++;
  const captionSource = data?.generated_with.caption_source;
  const viewerProfile = profile;
  return <main data-render-count={process.env.NODE_ENV==="development"?renders.current:undefined} id="main" className="workspace">
    <div className="watch-layout"><section className="watch-column" aria-label="Video workspace"><div className="watch-heading"><h1>{data.title}<small>{demoCredit}</small></h1></div>
      <VideoPlayer annotations={annotations} onApply={apply} poster={demoPoster} source={source} data={data} profile={viewerProfile} condition={condition} showOriginal={showOriginal} onOriginal={original} onTime={updateTime} onEvent={record} seekTo={seekTo} />
      <div className="film-footnote"><Icon name="leaf" size={16}/><span>{initialVideo.title} · {demoCredit}</span><a href="#media-credits">Credits</a></div>
    </section></div>
    <details className="research-tools"><summary>Research tools {recording&&<span className="status-pill recording">Recording locally</span>}</summary>
    <div className="condition-switch" role="group" aria-label="Research caption condition"><button aria-pressed={condition==='personalized'} onClick={()=>changeCondition('personalized')}>Personalized</button><button aria-pressed={condition==='baseline'} onClick={()=>changeCondition('baseline')}>Reference baseline</button></div>
    <CaptionTrackNotice data={data}/><SoundTimeline annotations={annotations} data={data} time={time} profile={profile} condition={condition} showOriginal={showOriginal} jump={jump}/>
    <StudyRehearsal active={recording} events={events} onStart={() => { rehearsal.start(currentTime.current, condition, profile, showOriginal); }} onStop={() => { rehearsal.stop(); setNotice("Rehearsal recording stopped. Export your data before reloading."); }} data={data?.cues.length ? data : null} condition={condition} profile={profile} showOriginal={showOriginal} stoppedElapsed={stoppedElapsed} startedAt={startedAt} sessionId={sessionId} />
    </details>
    <footer id="media-credits" className="page-footer"><div><span className="footer-brand">SceneCaptions</span><p>More of the story. On your terms.</p></div><div><p>Research prototype · No AI calls during viewing</p><p>Demo film: <a href={initialVideo.source_url} target="_blank" rel="noreferrer">{initialVideo.title}</a> · {initialVideo.license === "CC BY 3.0" ? <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a> : initialVideo.license}<br />{initialVideo.attribution}<br />{captionSource ? <>{data?.generated_with.kind === "source-assisted" ? "Generation reference: " : "Sound captions: "}<a href={captionSource.url} target="_blank" rel="noreferrer">{captionSource.author}</a> · {captionSource.license}. {data?.generated_with.kind === "source-assisted" ? "New wording generated and edited by SceneCaptions." : "Wording variants added by SceneCaptions."}</> : <>See the caption coverage above for this title.</>}</p>{data?.dialogue_source && <p>English subtitles: <a href={data.dialogue_source.url} target="_blank" rel="noreferrer">{data.dialogue_source.author}</a> · {data.dialogue_source.license}. Source wording and timing retained.</p>}</div></footer>
    <div className="sr-only" role="status" aria-live="polite">{notice || storageError}</div>
  </main>;
}
