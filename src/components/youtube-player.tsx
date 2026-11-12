"use client";
import { useEffect, useRef, useState } from "react";
import type { CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import type { StudyEvent } from "@/lib/session";
import { CaptionFeedback, CaptionOverlay, useCaptionDisplay } from "./caption-display";
import { PlayerControls } from "./player-controls";

type YTPlayer = {
  getCurrentTime(): number; getDuration(): number; getPlayerState(): number;
  playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void; unMute(): void; isMuted(): boolean; setPlaybackRate(rate: number): void;
  getPlaybackRate(): number; getIframe(): HTMLIFrameElement; destroy(): void;
};
type YTApi = { Player: new (element: HTMLElement, options: {
  videoId: string; width: string; height: string; playerVars: Record<string, string | number>;
  events: { onReady(e: {target: YTPlayer}): void; onStateChange(e: {data: number}): void; onError(e: {data: number}): void };
}) => YTPlayer };
declare global { interface Window { YT?: YTApi; onYouTubeIframeAPIReady?: () => void } }
let apiPromise: Promise<YTApi> | undefined;
function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise<YTApi>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); if (window.YT) resolve(window.YT); };
    const script = document.createElement("script"); script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { apiPromise = undefined; script.remove(); reject(Error("YouTube could not load.")); };
    document.head.append(script);
  });
  return apiPromise;
}

/** Publisher-hosted playback. Our synchronized subtitle strip never covers YouTube's controls. */
export function YouTubePlayer({ videoId, data, profile, condition, showOriginal, onOriginal, onTime, onEvent, seekTo, previewProfile, onPreviewEnd }: {
  videoId: string; data: CaptionVideo; profile: CaptionProfile; condition: Condition; showOriginal: boolean;
  onOriginal(): void; onTime(seconds: number): void; onEvent(event: StudyEvent): void;
  seekTo: {seconds: number; nonce: number} | null; previewProfile: CaptionProfile | null; onPreviewEnd(): void;
}) {
  const mount = useRef<HTMLDivElement>(null), frame = useRef<HTMLDivElement>(null), player = useRef<YTPlayer | null>(null);
  const callbacks = useRef({onTime, onEvent, onPreviewEnd, previewProfile});
  callbacks.current = {onTime, onEvent, onPreviewEnd, previewProfile};
  const [ready, setReady] = useState(false), [time, setTime] = useState(0), [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false), [muted, setMuted] = useState(false), [playbackRate, setRate] = useState(1), [error, setError] = useState("");
  useEffect(() => {
    let disposed = false, timer: ReturnType<typeof setInterval> | undefined;
    const slot = document.createElement("div"); mount.current?.append(slot);
    setReady(false); setTime(0); setDuration(0); setError("");
    loadApi().then(api => {
      if (disposed) return;
      player.current = new api.Player(slot, {videoId, width: "100%", height: "100%",
        playerVars: {origin: window.location.origin, playsinline: 1, rel: 0, cc_load_policy: 1, cc_lang_pref: "en"},
        events: {
          onReady({target}) {
            if (disposed) return;
            target.getIframe().title = `${data.title} · YouTube video player`;
            target.getIframe().setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
            setReady(true); setDuration(target.getDuration());
            timer = setInterval(() => {
              const p = player.current; if (!p || disposed) return;
              const seconds = p.getCurrentTime(); setTime(seconds); callbacks.current.onTime(seconds);
              setDuration(p.getDuration()); setMuted(p.isMuted()); setRate(p.getPlaybackRate());
            }, 150);
          },
          onStateChange({data: state}) {
            if (disposed) return;
            setPlaying(state === 1);
            if (state === 1 || state === 2) callbacks.current.onEvent({type: state === 1 ? "play" : "pause", video_s: player.current?.getCurrentTime() || 0});
          },
          onError({data: code}) { if (!disposed) { setPlaying(false); setError(`YouTube playback is unavailable (code ${code}). Try opening the publisher's video.`); } },
        },
      });
    }).catch(() => { if (!disposed) setError("YouTube could not load. Check your connection and try again."); });
    return () => { disposed = true; if (timer) clearInterval(timer); player.current?.destroy(); player.current = null; slot.remove(); };
  }, [videoId, data.title]);
  function seek(seconds: number, cancelPreview = true) {
    if (!ready || !player.current) return;
    if (cancelPreview && previewProfile) onPreviewEnd();
    const target = Math.max(0, Math.min(duration || data.duration_seconds, seconds));
    const wasPlaying = player.current.getPlayerState() === 1;
    player.current.seekTo(target, true);
    if (!wasPlaying || previewProfile) player.current.pauseVideo();
    setTime(target); onTime(target); onEvent({type: "seek", video_s: target});
  }
  useEffect(() => { if (seekTo && ready) seek(seekTo.seconds, false); }, [seekTo, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!previewProfile || !ready) return;
    player.current?.pauseVideo();
    const timer = setTimeout(() => callbacks.current.onPreviewEnd(), 5000);
    return () => clearTimeout(timer);
  }, [previewProfile, ready]);
  const display = useCaptionDisplay(data, duration, time, previewProfile || profile, condition, showOriginal);
  const playback = {ready, time, duration, playing, muted, playbackRate,
    async toggle() { if (previewProfile) onPreviewEnd(); if (player.current?.getPlayerState() === 1) player.current.pauseVideo(); else player.current?.playVideo(); },
    seek,
    toggleMute() { if (muted) player.current?.unMute(); else player.current?.mute(); setMuted(!muted); },
    changeRate(rate: number) { player.current?.setPlaybackRate(rate); setRate(rate); },
    async fullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await frame.current?.requestFullscreen(); } catch { setError("Fullscreen is unavailable in this browser."); } },
  };
  return <>
    <div className={`youtube-player caption-position-${profile.position}`} ref={frame}>
      <div className="youtube-embed" ref={mount} />
      <div className="youtube-caption-strip" aria-label="Generated sound subtitles">
        <CaptionOverlay active={display.active} cues={display.cues} profile={profile} />
        {!display.active.length && <span className="youtube-caption-gap">{ready ? "Sound subtitles follow the film." : "Loading YouTube…"}</span>}
      </div>
      <PlayerControls playback={playback} baseline={condition === "baseline"} hasCaptions={!!data.cues.length} showOriginal={showOriginal} onOriginal={onOriginal} generatedBaseline />
    </div>
    {previewProfile && <div className="caption-preview-notice" role="status"><span>Preview only · your saved settings have not changed.</span><button className="text-button" onClick={onPreviewEnd}>Return to saved settings</button></div>}
    {error && <p role="alert" className="inline-error">{error} <a href={data.source_url} target="_blank" rel="noreferrer">Watch on YouTube</a></p>}
    {display.mismatch && <p role="alert" className="inline-error">This video's duration differs from the prepared track. Sound subtitles are hidden.</p>}
    <CaptionFeedback data={data} display={display} condition={condition} showOriginal={showOriginal} />
    <p className="helper-text">Original captions are available in the YouTube player. Our generated sound subtitles appear in the strip {profile.position === "top" ? "above" : "below"} the picture.</p>
  </>;
}
