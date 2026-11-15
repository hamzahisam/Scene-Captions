"use client";
import { createPortal } from "react-dom";
import { profileNamespace, sessionDefaults } from "@/lib/study-session";
import type { QuestionFile } from "@/lib/study-surveys";
import type { StudySession } from "@/lib/study-session";
import { PROFILE_KEY } from "@/lib/profile";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionVideo, CaptionProfile, Condition } from "@/lib/captions";
import { useRehearsal } from "./hooks/use-rehearsal";
import { CaptionTrackNotice, SoundTimeline } from "./caption-track";
import { VideoPlayer } from "./video-player";
import { useCaptionProfile } from "./hooks/use-caption-profile";
import { RecorderStatus } from "./recorder-status";
import { StudyRehearsal } from "./study-rehearsal";
import type { CueAnnotations } from "@/lib/cue-annotations";
import { CaptionNote } from "./caption-note";
import { Icon } from "./icon";

export function Workspace({
  initialVideo,
  sourceAssistedVideo,
  demoSource,
  demoPoster = "/media/bunny-poster.jpg",
  demoCredit = "Blender Foundation, 2008",
  onMediaLockChange,
  annotations,
  session,
  questions,
  consoleHost,
}: {
  initialVideo: CaptionVideo;
  sourceAssistedVideo?: CaptionVideo;
  demoSource: string;
  demoPoster?: string;
  demoCredit?: string;
  questions?: QuestionFile;
  session?: StudySession;
  annotations?: CueAnnotations;
  onMediaLockChange?: (locked: boolean) => void;
  consoleHost?: HTMLElement | null;
}) {
  const {
    profile,
    update: setProfile,
    storageError,
  } = useCaptionProfile(
    session ? profileNamespace(session) : PROFILE_KEY,
    session ? sessionDefaults(session) : undefined,
  );
  const [manualCondition, setCondition] = useState<Condition>("personalized");
  const [showOriginal, setShowOriginal] = useState(false);
  const assigned = session?.sequence[session.sequenceIndex].condition;
  const condition: Condition = session ? (assigned === "baseline" ? "baseline" : "personalized") : manualCondition;
  const [seekTo, setSeekTo] = useState<{
    seconds: number;
    nonce: number;
    source?: "participant" | "system" | "researcher";
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [savedNonce, setSavedNonce] = useState(0);
  const data = sourceAssistedVideo ?? initialVideo;
  const source = demoSource;
  const rehearsal = useRehearsal({ filmId: data.video_id, session });
  const { recording, startedAt, record } = rehearsal;
  const currentTime = useRef(0);
  const seekNonce = useRef(0);
  useEffect(() => {
    onMediaLockChange?.(startedAt !== null);
  }, [startedAt, onMediaLockChange]);
  const updateTime = useCallback(
    (seconds: number) => {
      currentTime.current = seconds;
      rehearsal.setVideoTime(seconds);
    },
    [rehearsal.setVideoTime],
  );
  useEffect(() => {
    if (rehearsal.recorder?.resumed && rehearsal.recorder.resumePosition > 0)
      setSeekTo({ seconds: rehearsal.recorder.resumePosition, nonce: ++seekNonce.current, source: "system" });
  }, [rehearsal.recorder]);
  function apply(next: CaptionProfile) {
    const previous = profile;
    setProfile(next);
    for (const field of Object.keys(next) as (keyof CaptionProfile)[])
      if (previous[field] !== next[field])
        rehearsal.telemetry({
          type: "profile_change",
          video_s: currentTime.current,
          field,
          from: previous[field],
          to: next[field],
        });
    setNotice("Caption preferences saved.");
    setSavedNonce((n) => n + 1);
  }
  function original(value?: boolean, mode: "hold" | "toggle" = "toggle") {
    const enabled = value ?? !showOriginal;
    setShowOriginal(enabled);
    record({ type: "original", video_s: currentTime.current, enabled, mode });
  }
  function changeCondition(next: Condition) {
    rehearsal.telemetry({
      type: "profile_change",
      video_s: currentTime.current,
      field: "condition",
      from: condition,
      to: next,
      source: "researcher",
    });
    setCondition(next);
    setShowOriginal(false);
    record({ type: "condition", video_s: currentTime.current, condition: next });
    record({ type: "original", video_s: currentTime.current, enabled: false, source: "system" });
  }
  function jump(seconds: number) {
    setSeekTo({ seconds, nonce: ++seekNonce.current });
  }
  const time = currentTime.current;
  const renders = useRef(0);
  renders.current++;
  const diagnostic = useRef<HTMLElement>(null);
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && diagnostic.current)
      diagnostic.current.dataset.renderCount = String(renders.current);
  });
  const viewerProfile =
    session && assigned !== "personalized"
      ? {
          ...profile,
          ...sessionDefaults(session),
          size: profile.size,
          position: profile.position,
          backdrop: profile.backdrop,
          textColor: profile.textColor,
        }
      : profile;
  const rehearsalPanel = (
    <StudyRehearsal
      recorder={rehearsal.recorder}
      error={rehearsal.error}
      onStart={() => rehearsal.start(currentTime.current, condition, profile, showOriginal)}
      onStop={() => rehearsal.stop(currentTime.current)}
    />
  );
  const researcherConsole = !session ? (
    <details className="research-tools researcher-console console-section">
      <summary>
        <Icon name="chevron" size={18} className="disclosure-chevron" />
        <span className="researcher-console__title">Researcher console</span>
        {recording && (
          <span className="status-pill recording">
            <span className="rec-dot" aria-hidden="true" />
            Recording locally
          </span>
        )}
      </summary>
      <div className="researcher-console__body">
        <p className="callout callout--danger console-warning">
          <Icon name="warning" size={20} />
          <span>
            <strong>Contains upcoming caption text.</strong> Close this before a participant watches.
          </span>
        </p>
        <div className="console-block">
          <h3 id="condition-heading">Caption condition</h3>
          <div className="condition-switch" role="group" aria-labelledby="condition-heading">
            <button
              type="button"
              aria-pressed={condition === "personalized"}
              onClick={() => changeCondition("personalized")}
            >
              Personalized
            </button>
            <button type="button" aria-pressed={condition === "baseline"} onClick={() => changeCondition("baseline")}>
              Reference baseline
            </button>
          </div>
        </div>
        <CaptionTrackNotice data={data} />
        <SoundTimeline
          annotations={annotations}
          data={data}
          time={time}
          profile={profile}
          condition={condition}
          showOriginal={showOriginal}
          jump={jump}
        />
        {rehearsalPanel}
      </div>
    </details>
  ) : (
    <details className="study-recording-controls console-section">
      <summary>
        <Icon name="chevron" size={18} className="disclosure-chevron" />
        Researcher recording controls
      </summary>
      <div className="researcher-console__body">{rehearsalPanel}</div>
    </details>
  );
  return (
    <section ref={diagnostic} className="watch__film" aria-labelledby="film-title">
      <RecorderStatus recorder={rehearsal.recorder} error={rehearsal.error} />
      <div className="title-block">
        <h1 id="film-title">{data.title}</h1>
        <p className="title-block__credit">{demoCredit}</p>
      </div>
      <VideoPlayer
        session={session}
        recorder={rehearsal.recorder}
        questions={questions}
        recording={recording}
        onTelemetry={rehearsal.telemetry}
        settingsAllowed={!session || assigned === "personalized"}
        showTicks={session?.ticks ?? true}
        annotations={annotations}
        onApply={apply}
        poster={demoPoster}
        source={source}
        data={data}
        profile={viewerProfile}
        condition={condition}
        showOriginal={showOriginal}
        onOriginal={original}
        onTime={updateTime}
        onEvent={record}
        seekTo={seekTo}
        savedNonce={savedNonce}
        demoMode={!session}
      />
      <CaptionNote data={data} />
      {consoleHost && createPortal(researcherConsole, consoleHost)}
      <div className="sr-only" role="status" aria-live="polite">
        {notice || storageError}
      </div>
    </section>
  );
}
