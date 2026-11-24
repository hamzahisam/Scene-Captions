"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import type { ViewerLanguage } from "@/lib/viewer-language";

export type NativeCaption = { start: number; end: number; text: string };
type NativeVideo = HTMLVideoElement & { webkitDisplayingFullscreen?: boolean };
const tracks = new WeakMap<HTMLVideoElement, Map<ViewerLanguage, TextTrack>>();
const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function useFullscreenTextTrack(video: RefObject<HTMLVideoElement | null>, captions: NativeCaption[], language: ViewerLanguage = "en") {
  const [native, setNative] = useState(false);
  const key = JSON.stringify(captions);

  useEffect(() => {
    const element = video.current as NativeVideo | null;
    if (!element) return;
    let byLanguage = tracks.get(element);
    if (!byLanguage) {
      byLanguage = new Map();
      tracks.set(element, byLanguage);
    }
    let existing = byLanguage.get(language);
    if (!existing) {
      existing = element.addTextTrack("captions", language === "ur" ? "اردو" : "SceneCaptions", language);
      byLanguage.set(language, existing);
    }
    const track = existing;
    const begin = () => { setNative(true); track.mode = "showing"; };
    const end = () => { setNative(false); track.mode = "hidden"; };
    const change = () => document.fullscreenElement === element || element.webkitDisplayingFullscreen ? begin() : end();
    change();
    element.addEventListener("webkitbeginfullscreen", begin);
    element.addEventListener("webkitendfullscreen", end);
    document.addEventListener("fullscreenchange", change);
    return () => {
      track.mode = "disabled";
      element.removeEventListener("webkitbeginfullscreen", begin);
      element.removeEventListener("webkitendfullscreen", end);
      document.removeEventListener("fullscreenchange", change);
    };
  }, [video, language]);

  useEffect(() => {
    const element = video.current;
    const track = element && tracks.get(element)?.get(language);
    if (!track) return;
    track.mode = "hidden";
    for (const cue of Array.from(track.cues ?? [])) track.removeCue(cue);
    if (typeof VTTCue !== "undefined") {
      for (const cue of JSON.parse(key) as NativeCaption[]) {
        if (cue.end > cue.start) track.addCue(new VTTCue(cue.start, cue.end, escapeText(cue.text)));
      }
    }
    track.mode = native ? "showing" : "hidden";
  }, [key, native, video, language]);
  return native;
}
