"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { musicTrack } from "@/lib/music-wording";
import { resolveCaptionWindows } from "@/lib/captions";
import type { CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import { captionsAt, pastCaptionTime } from "@/lib/caption-sample";
import { dialogueNativeText, reviewedSpeaker, formatSoundCueText } from "@/lib/cue-annotations";
import type { CueAnnotations } from "@/lib/cue-annotations";
import { verifiedRecurrenceLabels } from "@/lib/caption-recurrence";
import type { RecurrenceAnnotation } from "@/lib/caption-recurrence";
import { selectViewerCaptionTrack } from "@/lib/viewer-caption-track";
import { viewerText } from "@/lib/viewer-language";
import type { PlaybackClock } from "@/lib/playback-clock";
import type { StudySession } from "@/lib/study-session";
import type { QuestionFile } from "@/lib/study-surveys";
import type { TelemetryRecorder } from "@/lib/telemetry-storage";
import type { TelemetryInput } from "@/lib/telemetry";
import { CaptionOverlay } from "./caption-display";
import { CaptionSettingsPanel } from "./caption-settings-panel";
import { StudySurveys } from "./study-surveys";
import { useCaptionExposure } from "./hooks/use-caption-exposure";
import type { CaptionExposure } from "./hooks/use-caption-exposure";
import { useFullscreenTextTrack } from "./hooks/use-fullscreen-text-track";
import { useViewerLanguage } from "./viewer-language";

type CaptionExperienceProps = {
  clock: PlaybackClock;
  data: CaptionVideo | null;
  urdu: CaptionVideo | null;
  recurrences?: readonly RecurrenceAnnotation[];
  duration: number;
  profile: CaptionProfile;
  condition: Condition;
  original: boolean;
  video: RefObject<HTMLVideoElement | null>;
  host: RefObject<HTMLDivElement | null>;
  dock: RefObject<HTMLDivElement | null>;
  feedback: HTMLDivElement | null;
  docked: boolean;
  trigger: RefObject<HTMLButtonElement | null>;
  open: boolean;
  close: () => void;
  onApply: (p: CaptionProfile) => void;
  annotations?: CueAnnotations;
  recording: boolean;
  onTelemetry: (event: TelemetryInput) => void;
  session?: StudySession;
  recorder?: TelemetryRecorder | null;
  questions?: QuestionFile;
  playing: boolean;
  ended: boolean;
  pauseForSurvey: () => void;
  resumeAfterSurvey: () => void;
  onSurveyActive: (active: boolean) => void;
  extendDisplay: boolean;
  soundSettingsAllowed: boolean;
};

export function CaptionExperience({ clock, data, urdu, duration, profile, condition, original, video, host, dock,
  feedback, docked, trigger, open, close, onApply, annotations, recording, onTelemetry, session, recorder,
  questions, playing, ended, pauseForSurvey, resumeAfterSurvey, onSurveyActive, extendDisplay,
  soundSettingsAllowed, recurrences }: CaptionExperienceProps) {
  const { t } = useViewerLanguage();
  const time = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);
  const track = selectViewerCaptionTrack(data, urdu, profile.captionLanguage, condition, original, !!session);
  const available = duration > 0 && !!data && Math.abs(duration - data.duration_seconds) <= 2;
  const [sampleEnabled, setSampleEnabled] = useState(false);
  const closePanel = useCallback(() => { setSampleEnabled(false); close(); }, [close]);
  const toggleSample = useCallback(() => setSampleEnabled(value => !value), []);
  useEffect(() => { if (!open) setSampleEnabled(false); }, [open]);
  const labels = useMemo(() => !track.locked && recurrences && track.data
    ? verifiedRecurrenceLabels(track.data.cues, recurrences, track.language) : undefined,
    [track.locked, track.data, track.language, recurrences]);
  const windows = useMemo(() => track.data ? resolveCaptionWindows((track.locked ? track.data : musicTrack(track.data, profile.musicWording, track.language))!, profile, condition, original, extendDisplay, labels, !session) : [],
    [track.data, profile, condition, original, extendDisplay, labels, session]);
  const dialogue = track.data?.dialogue ?? [];
  const active = captionsAt(available ? windows : [], available ? dialogue : [], time);
  const hasActive = Boolean(active.sound.length || active.dialogue.length);
  const sampleTime = available && open && !session ? pastCaptionTime(windows, dialogue, time) : undefined;
  const sampleVisible = sampleEnabled && !hasActive && sampleTime !== undefined;
  const display = sampleVisible ? captionsAt(windows, dialogue, sampleTime) : active;
  const adapted = display.sound.some(window => window.caption.adapted);
  const canAdapt = soundSettingsAllowed && !original && !track.unavailable;
  const exposure: CaptionExposure[] = [
    ...display.sound.map(({ cue, caption, source_end_s, display_end_s, extended }) => ({
      cue_id: cue.cue_id, cue_type: "sound" as const, source_end_s, display_end_s, extended,
      displayed_level: original || condition === "baseline" ? "original" as const : caption.detail,
      adapted: caption.adapted, rule: sampleVisible ? "sample" : caption.rule,
      text: formatSoundCueText(caption.text, annotations?.sounds[cue.cue_id], {
        typeStyling: profile.typeStyling, markShortened: profile.markShortened, adapted: caption.adapted, offscreenLabel: t("offscreen"),
      }), sample: sampleVisible || undefined,
    })),
    ...display.dialogue.map(cue => ({
      cue_id: cue.cue_id, cue_type: "dialogue" as const, source_end_s: cue.end_s, display_end_s: cue.end_s,
      displayed_level: "original" as const, adapted: false, rule: sampleVisible ? "sample" : "none",
      text: dialogueNativeText(cue.text, profile.speakerLabels && track.language === "en" ? reviewedSpeaker(annotations, cue.cue_id) : undefined),
      sample: sampleVisible || undefined,
    })),
  ];
  useCaptionExposure(exposure, time, recording, onTelemetry);
  const native = useFullscreenTextTrack(video, sampleVisible ? [] : [
    ...active.sound.map((window, index) => ({
      start: window.start_s, end: window.display_end_s,
      text: exposure[index].text
        + (!session && window.caption.adapted && !profile.markShortened ? " ▿" : ""),
    })),
    ...active.dialogue.map((cue, index) => ({
      start: cue.start_s, end: cue.end_s, text: exposure[active.sound.length + index].text,
    })),
  ], track.language);

  const fit = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const picture = element.closest(".viewer-picture");
    if (!picture) return;
    const update = () => {
      const image = picture.querySelector("video");
      if (image) {
        const height = picture.closest(":fullscreen") ? picture.clientHeight : image.offsetHeight;
        picture.classList.toggle("caption-needs-room", height > 0 && element.offsetHeight + 16 > height);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observer.observe(picture.querySelector("video") ?? picture);
    return () => { observer.disconnect(); picture.classList.remove("caption-needs-room"); };
  }, []);

  const settingsHost = docked ? dock.current : host.current;
  return <>
    {session && recorder && host.current && createPortal(
      <StudySurveys session={session} recorder={recorder} questions={questions} time={time} playing={playing} ended={ended}
        pause={pauseForSurvey} resume={resumeAfterSurvey} onActiveChange={onSurveyActive} trigger={trigger} />, host.current)}
    {profile.announceCaptions && <div className="sr-only" lang={track.language} aria-live="polite" aria-atomic="true">
      {!sampleVisible && active.dialogue.length > 0 && <span>{viewerText(track.language, "dialogue")}: {active.dialogue.map(cue => cue.text).join(" ")} </span>}
      {!sampleVisible && active.sound.length > 0 && <span>{viewerText(track.language, "soundCaptions")}: {active.sound.map(({ caption }) => caption.text).join(" ")}</span>}
    </div>}
    {!native && <CaptionOverlay profile={profile} annotations={annotations} sample={sampleVisible}
      language={track.language} sound={display.sound} dialogue={display.dialogue} onFitChange={fit} />}
    {!session && feedback && canAdapt && createPortal(
      <p className="adaptation-feedback"><span>{t(profile.adaptive ? "adaptOn" : "adaptOff")}</span>
        {adapted && <span className="adaptation-marker" title={t("shortenedLegend")}>▿ {t(sampleVisible ? "sampleShortened" : "shortened")}</span>}
      </p>, feedback)}
    {settingsHost && createPortal(
      <CaptionSettingsPanel docked={docked} open={open} close={closePanel} trigger={trigger}
        profile={profile} onApply={onApply} data={data} condition={condition} soundSettingsAllowed={soundSettingsAllowed}
        defaultReadingSpeed={session?.readingSpeed} languageLocked={track.locked}
        canSample={sampleTime !== undefined} sampleEnabled={sampleEnabled} onToggleSample={toggleSample}
        study={!!session} trackNotice={!track.locked && track.language === "ur" ? (track.unavailable ? "translationMissing" : "translationDraft") : undefined} />, settingsHost)}
  </>;
}
