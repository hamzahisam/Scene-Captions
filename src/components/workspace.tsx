"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { activeCues } from "@/lib/captions";
import type { CaptionVideo, CaptionProfile, Condition } from "@/lib/captions";
import { useLocalMedia } from "./hooks/use-local-media";
import { useRehearsal } from "./hooks/use-rehearsal";
import { CaptionTrackNotice, SoundTimeline } from "./caption-track";
import { VideoPlayer } from "./video-player";
import { useCaptionProfile } from "./hooks/use-caption-profile";
import { StudyRehearsal } from "./study-rehearsal";
import { Icon } from "./icon";


export function Workspace({ initialVideo, sourceAssistedVideo, demoSource, demoPoster = "/media/bunny-poster.jpg", demoCredit = "Blender Foundation · 2008", onMediaLockChange }: { initialVideo: CaptionVideo; sourceAssistedVideo?: CaptionVideo; demoSource: string; demoPoster?: string; demoCredit?: string; onMediaLockChange?: (locked: boolean) => void }) {
  const {profile, update: setProfile, storageError} = useCaptionProfile();
  const [condition, setCondition] = useState<Condition>("personalized"); const [showOriginal, setShowOriginal] = useState(false);
  const [time, setTime] = useState(0); const [seekTo, setSeekTo] = useState<{ seconds: number; nonce: number } | null>(null);
  const [notice, setNotice] = useState("");
  const media = useLocalMedia(sourceAssistedVideo ?? initialVideo, demoSource, setNotice);
  const { data, source, localName } = media;
  const rehearsal = useRehearsal();
  const { recording, events, startedAt, sessionId, stoppedElapsed, record } = rehearsal;
  const currentTime = useRef(0); const seekNonce = useRef(0);
  useEffect(() => { onMediaLockChange?.(startedAt !== null); }, [startedAt, onMediaLockChange]);
  const updateTime = useCallback((seconds: number) => { currentTime.current = seconds; setTime(seconds); }, []);
  function apply(next: CaptionProfile) { setProfile(next); record({ type: "profile", video_s: time, profile: next }); setNotice("Caption preferences saved."); }
  function original(value?: boolean) { const enabled = value ?? !showOriginal; setShowOriginal(enabled); record({ type: "original", video_s: time, enabled }); }
  function changeCondition(next: Condition) { setCondition(next); setShowOriginal(false); record({ type: "condition", video_s: time, condition: next }); record({ type: "original", video_s: time, enabled: false }); }
  function jump(seconds: number) { setSeekTo({ seconds, nonce: ++seekNonce.current }); }
  const captionSource = data?.generated_with.caption_source;
  const experimental = !!data?.generated_with.experimental;
  const enriched = !!data?.generated_with.wording_style;
  function selectTrack(track: CaptionVideo) {
    if (startedAt !== null) return;
    changeCondition("personalized");
    media.selectPreparedTrack(track);
  }
  const viewerProfile = data?.generated_with.scene_load_method === "unreviewed" ? { ...profile, adaptive: false } : profile;
  return <main id="main" className="workspace">
    <div className="page-intro"><div><div className="eyebrow"><span className="small-line" />YOUR SOUND. YOUR WAY.</div><h1>Stay in the story.</h1><p>Sound captions that make room for the way you watch.</p></div></div>
    <div className="watch-layout"><section className="watch-column" aria-label="Video workspace"><div className="watch-heading"><div><span className="film-kicker">{localName ? "YOUR VIDEO" : "THE DEMO SCREENING"}</span><h2>{data?.title || localName || "Your video"}<span>{localName ? "Local file" : demoCredit}</span></h2></div>{!experimental && <div className="condition-switch" role="group" aria-label="Caption condition"><button aria-pressed={condition === "personalized" && !showOriginal} onClick={() => changeCondition("personalized")}>Personalized</button><button aria-pressed={condition === "baseline" || showOriginal} onClick={() => changeCondition("baseline")}>{data?.generated_with.kind === "source-assisted" ? "Reference baseline" : "Original baseline"}</button></div>}</div>
      {sourceAssistedVideo && !localName && <section className="caption-track-picker" aria-label="Generated subtitles"><div><strong>Our generated subtitles</strong><p>Three levels of detail: Essential, Balanced and Rich.</p></div><div className="caption-track-actions" role="group" aria-label="Choose generated subtitles"><button className="secondary-button" aria-pressed={enriched} disabled={startedAt !== null} onClick={() => selectTrack(sourceAssistedVideo)}>Use our generated subtitles</button></div>{startedAt !== null && <p>Subtitle selection stays fixed after a rehearsal starts. Export, then reload to switch.</p>}</section>}
      <VideoPlayer onApply={apply} poster={demoPoster} source={source} data={data} profile={viewerProfile} condition={condition} showOriginal={showOriginal} onOriginal={original} onTime={updateTime} onEvent={record} seekTo={seekTo} />
      <div className="film-footnote"><Icon name="leaf" size={16} /><span>{localName ? "Your video stays on this device. Nothing is uploaded." : `${initialVideo.title} · ${initialVideo.license} · ${demoCredit}`}</span><a href="#media-credits">{localName ? "Local playback" : "Credits & demo notes"}</a></div>
      <CaptionTrackNotice data={data} />
      <SoundTimeline data={data} time={time} profile={profile} condition={condition} showOriginal={showOriginal} jump={jump} />
    </section></div>

    <StudyRehearsal active={recording} events={events} onStart={() => { rehearsal.start(time, condition, profile, showOriginal); }} onStop={() => { rehearsal.stop(); setNotice("Rehearsal recording stopped. Export your data before reloading."); }} data={data?.cues.length ? data : null} condition={condition} profile={profile} showOriginal={showOriginal} stoppedElapsed={stoppedElapsed} startedAt={startedAt} sessionId={sessionId} />
    <footer id="media-credits" className="page-footer"><div><span className="footer-brand">SceneCaptions</span><p>More of the story. On your terms.</p></div><div><p>Research prototype · No AI calls during viewing</p><p>Demo film: <a href={initialVideo.source_url} target="_blank" rel="noreferrer">{initialVideo.title}</a> · {initialVideo.license === "CC BY 3.0" ? <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a> : initialVideo.license}<br />{initialVideo.attribution}<br />{captionSource ? <>{data?.generated_with.kind === "source-assisted" ? "Generation reference: " : "Sound captions: "}<a href={captionSource.url} target="_blank" rel="noreferrer">{captionSource.author}</a> · {captionSource.license}. {data?.generated_with.kind === "source-assisted" ? "New wording generated and edited by SceneCaptions." : "Wording variants added by SceneCaptions."}</> : <>See the caption coverage above for this title.</>}</p>{data?.dialogue_source && <p>English subtitles: <a href={data.dialogue_source.url} target="_blank" rel="noreferrer">{data.dialogue_source.author}</a> · {data.dialogue_source.license}. Source wording and timing retained.</p>}</div></footer>
    <div className="sr-only" role="status" aria-live="polite">{notice || storageError}</div>
  </main>;
}
