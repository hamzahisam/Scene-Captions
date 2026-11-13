"use client";
import {createPlaybackClock} from "@/lib/playback-clock";
import { toggleFullscreen } from "@/lib/fullscreen";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { CaptionProfile } from "@/lib/captions";
import type { StudyEvent } from "@/lib/session";

export function useVideoPlayback({ source, seekTo, onTime, onEvent }: {
  source: string; seekTo: { seconds: number; nonce: number;source?:"participant"|"system"|"researcher" } | null;
  onTime: (seconds: number) => void; onEvent: (event: StudyEvent) => void;
}) {
  const clock=useRef(createPlaybackClock()).current;
  const video = useRef<HTMLVideoElement>(null); const frame = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0); const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false); const [muted, setMuted] = useState(false);
  const [error, setError] = useState(""); const [ready, setReady] = useState(false); const [waiting, setWaiting] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  useEffect(() => {
    // Metadata may arrive before hydration effects run for a cached local file.
    const el = video.current;
    const loaded = !!el && el.readyState >= 1 && Number.isFinite(el.duration);
    setTime(el?.currentTime || 0); setDuration(loaded ? el.duration : 0);
    setReady(loaded); setPlaying(el ? !el.paused : false); setWaiting(false);
    setError(""); setPlaybackRate(1); setMuted(el?.muted || false);
  }, [source]);
  useEffect(() => {
    if (seekTo && video.current && ready) {
      const target = Math.min(duration, Math.max(0, seekTo.seconds));
      pendingSeek.current={method:"jump",from:video.current.currentTime,source:seekTo.source||"participant"};video.current.currentTime = target;
      clock.set(target);setTime(target);
      onTime(target);
    }
  }, [seekTo, ready, duration, onTime]);
  const callbacks=useRef({onTime});callbacks.current={onTime};
  useEffect(()=>{const el=video.current;if(!el||!playing)return;let frameId=0,animationId=0,last=0,active=true;
    function tick(now:number,mediaTime?:number){if(!active)return;const seconds=mediaTime??el!.currentTime;clock.set(seconds);callbacks.current.onTime(seconds);if(now-last>=250){setTime(seconds);last=now}if(typeof el!.requestVideoFrameCallback==="function")frameId=el!.requestVideoFrameCallback((stamp,meta)=>tick(stamp,meta.mediaTime));else animationId=requestAnimationFrame(stamp=>tick(stamp))}
    if(typeof el.requestVideoFrameCallback==="function")frameId=el.requestVideoFrameCallback((stamp,meta)=>tick(stamp,meta.mediaTime));else animationId=requestAnimationFrame(stamp=>tick(stamp));return()=>{active=false;if(frameId)el.cancelVideoFrameCallback(frameId);if(animationId)cancelAnimationFrame(animationId)};
  },[playing,clock]);
  const fullscreenSource=useRef<"participant"|"system">("participant");
  const actionSource=useRef<"participant"|"system"|"researcher">("participant");const [ended,setEnded]=useState(false);
  function pause(source:"participant"|"system"|"researcher"="participant"){actionSource.current=source;video.current?.pause()}
  async function play(source:"participant"|"system"|"researcher"="participant"){actionSource.current=source;setEnded(false);try{await video.current?.play();setError("")}catch{actionSource.current="participant";setError("Playback could not start. Try again.")}}
  async function toggle() {
    const el = video.current; if (!el) return;
    if(!el.paused)pause();else await play();
  }
  const pendingSeek=useRef<{method:"scrub"|"keyboard"|"jump"|"sound-navigation";from:number;source?:"participant"|"system"|"researcher"}|null>(null);
  function seek(seconds: number,method:"scrub"|"keyboard"|"jump"|"sound-navigation"="scrub") {
    if (video.current) {
      const target = Math.min(duration, Math.max(0, seconds));
      pendingSeek.current={method,from:video.current.currentTime};video.current.currentTime = target;
      // Keep the controlled slider current during the render that ends a preview.
      // Waiting for seeked can restore its old value before the next input event.
      clock.set(target);setTime(target);
      onTime(target);
    }
  }

  const events = {
    onLoadedMetadata() { if (video.current) { clock.set(video.current.currentTime); setDuration(video.current.duration); setReady(true); setError(""); } },
    onTimeUpdate() { if (video.current) { onTime(video.current.currentTime); } },
    onPlay() { setPlaying(true); onEvent({ type: "play", video_s: video.current?.currentTime || 0,source:actionSource.current });actionSource.current="participant"; },
    onPause() { setPlaying(false); onEvent({ type: "pause", video_s: video.current?.currentTime || 0,source:video.current?.ended?"system":actionSource.current });actionSource.current="participant"; },
    onEnded(){setEnded(true);setPlaying(false)},
    onRateChange(){if(video.current)onEvent({type:"rate",video_s:video.current.currentTime,value:video.current.playbackRate})},
    onVolumeChange(){if(video.current){setMuted(video.current.muted);onEvent({type:"mute",video_s:video.current.currentTime,muted:video.current.muted})}},
    onSeeked() { const seconds = video.current?.currentTime || 0; clock.set(seconds);setTime(seconds); onTime(seconds); onEvent({ type: "seek", video_s: seconds,method:pendingSeek.current?.method||"scrub",from_s:pendingSeek.current?.from??seconds,source:pendingSeek.current?.source||"participant" });pendingSeek.current=null; },
    onWaiting() { setWaiting(true); },
    onCanPlay() { setWaiting(false); },
    onError() { const message="The video could not load. Check your connection and try again.";setError(message);onEvent({type:"error",video_s:video.current?.currentTime||0,message,source:"system"}); },

  };
  function toggleMute() { if (video.current) { video.current.muted = !muted; setMuted(!muted); } }
  function changeRate(value: number) { setPlaybackRate(value); if (video.current) video.current.playbackRate = value; }
  const eventCallback=useRef(onEvent);eventCallback.current=onEvent;
  useEffect(()=>{let prior=false;const change=()=>{const enabled=document.fullscreenElement===frame.current||document.fullscreenElement===video.current;if(enabled!==prior){eventCallback.current({type:"fullscreen",video_s:video.current?.currentTime||0,enabled,source:fullscreenSource.current});prior=enabled;fullscreenSource.current="participant"}};const begin=()=>eventCallback.current({type:"fullscreen",video_s:video.current?.currentTime||0,enabled:true}),end=()=>eventCallback.current({type:"fullscreen",video_s:video.current?.currentTime||0,enabled:false,source:fullscreenSource.current});const el=video.current;document.addEventListener("fullscreenchange",change);el?.addEventListener("webkitbeginfullscreen",begin);el?.addEventListener("webkitendfullscreen",end);return()=>{document.removeEventListener("fullscreenchange",change);el?.removeEventListener("webkitbeginfullscreen",begin);el?.removeEventListener("webkitendfullscreen",end)}},[]);
  function exitNativeFullscreen(){const el=video.current as (HTMLVideoElement&{webkitDisplayingFullscreen?:boolean;webkitExitFullscreen?:()=>void})|null;if(document.fullscreenElement===el){fullscreenSource.current="system";void document.exitFullscreen().catch(()=>setError("Leave fullscreen to answer the question."))}else if(el?.webkitDisplayingFullscreen&&el.webkitExitFullscreen){fullscreenSource.current="system";el.webkitExitFullscreen()}}
  async function fullscreen() {
    try {
      await toggleFullscreen(frame.current,video.current);
    } catch { setError("Fullscreen is unavailable in this browser."); }
  }
  return { video, frame, clock, ended,pause,play,exitNativeFullscreen,time, duration, playing, muted, error, ready, waiting, playbackRate, events, toggle, seek, toggleMute, changeRate, fullscreen };
}
