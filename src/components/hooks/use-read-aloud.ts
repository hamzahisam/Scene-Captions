"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";

/*
 * "Read captions aloud": speaks each new caption with a voice built into the
 * viewer's device (Web Speech API). No network service, no new dependency,
 * nothing generated: it only voices the prepared caption text on screen.
 * The on/off choice is a device preference kept outside the caption profile,
 * so study profiles, telemetry and src/lib are unchanged.
 */
const KEY = "scenecaptions:read-aloud";
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
};
export function setReadAloud(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  if (!on && typeof window !== "undefined") window.speechSynthesis?.cancel();
  listeners.forEach((l) => l());
}
export function useReadAloudPreference() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => false,
  );
}
export const readAloudSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

/* Calm female voices commonly installed on macOS/iOS, Windows, Android and Chrome. */
const PREFERRED = [
  "Samantha", "Ava", "Allison", "Susan", "Karen", "Moira", "Tessa", "Serena", "Fiona",
  "Microsoft Aria", "Microsoft Jenny", "Microsoft Sonia", "Microsoft Libby", "Microsoft Zira",
  "Google UK English Female", "Google US English",
];
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  for (const name of PREFERRED) {
    const match = voices.find((v) => v.name.startsWith(name) && v.localService) || voices.find((v) => v.name.startsWith(name));
    if (match) return match;
  }
  return voices.find((v) => /female|woman/i.test(v.name)) || voices.find((v) => v.localService) || voices[0];
}

export function useReadAloud(lines: string[], enabled: boolean) {
  const text = lines.join(". ").replace(/[\[\]▿♪]/g, " ").replace(/\s+/g, " ").trim();
  const last = useRef("");
  useEffect(() => {
    if (!enabled || !readAloudSupported()) {
      last.current = "";
      return;
    }
    if (!text || text === last.current) return;
    last.current = text;
    const synth = window.speechSynthesis;
    synth.cancel(); // never queue behind an older caption
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || "en-US";
    u.rate = 0.92;
    u.pitch = 1.05;
    u.volume = 1;
    synth.speak(u);
  }, [text, enabled]);
  useEffect(() => () => {
    if (readAloudSupported()) window.speechSynthesis.cancel();
  }, []);
}
