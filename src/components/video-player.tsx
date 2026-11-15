"use client";
import type { StudySession } from "@/lib/study-session";
import type { QuestionFile } from "@/lib/study-surveys";
import type { TelemetryRecorder } from "@/lib/telemetry-storage";
import type { TelemetryInput } from "@/lib/telemetry";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaptionExperience } from "./caption-experience";
import { useVideoPlayback } from "./hooks/use-video-playback";
import { PlayerControls } from "./player-controls";
import type { CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import type { StudyEvent } from "@/lib/session";
import { usePlayerShortcuts } from "./hooks/use-player-shortcuts";
import { ShortcutHelp } from "./shortcut-help";
import { adjacentSound } from "@/lib/sound-navigation";
import type { CueAnnotations } from "@/lib/cue-annotations";
import { Icon } from "./icon";
import { Hud } from "./ui/hud";

const SIZE_LABELS = { standard: "Standard", large: "Large", "extra-large": "Extra large" } as const;
const DETAIL_LABELS = ["", "Essential", "Balanced", "Rich"] as const;
const HINT_KEY = "scenecaptions:hint:original-hold";

function OriginalHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <span className="coach" role="note">
      <span>Hold Original to compare with the source caption.</span>
      <button type="button" className="icon-btn coach__close" aria-label="Dismiss tip" onClick={onDismiss}>
        <Icon name="close" size={18} />
      </button>
    </span>
  );
}

export function VideoPlayer({
  source,
  data,
  profile,
  condition,
  showOriginal,
  onOriginal,
  onTime,
  onEvent,
  seekTo,
  onApply,
  annotations,
  onTelemetry = () => {},
  recording = false,
  session,
  recorder,
  questions,
  settingsAllowed = true,
  showTicks = true,
  poster = "/media/bunny-poster.jpg",
  savedNonce = 0,
  storageError = "",
  demoMode = false,
}: {
  source: string;
  data: CaptionVideo | null;
  profile: CaptionProfile;
  condition: Condition;
  showOriginal: boolean;
  onOriginal: (enabled?: boolean, mode?: "toggle" | "hold") => void;
  onTime: (time: number) => void;
  onEvent: (event: StudyEvent) => void;
  seekTo: { seconds: number; nonce: number; source?: "participant" | "system" | "researcher" } | null;
  session?: StudySession;
  recorder?: TelemetryRecorder | null;
  questions?: QuestionFile;
  onTelemetry?: (event: TelemetryInput) => void;
  recording?: boolean;
  settingsAllowed?: boolean;
  showTicks?: boolean;
  annotations?: CueAnnotations;
  poster?: string;
  savedNonce?: number;
  storageError?: string;
  demoMode?: boolean;
  onApply: (p: CaptionProfile) => void;
}) {
  const playback = useVideoPlayback({ source, seekTo, onTime, onEvent });
  const { video, frame, ready, playing, error, waiting, duration, time, toggle } = playback;
  const [settingsOpen, setSettingsOpen] = useState(false),
    [narrow, setNarrow] = useState(false),
    [fullscreenActive, setFullscreenActive] = useState(false);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const [surveyActive, setSurveyActive] = useState(false);
  const surveyActiveRef = useRef(false);
  const surveyChanged = useCallback(
    (active: boolean) => {
      const wasActive = surveyActiveRef.current;
      surveyActiveRef.current = active;
      setSurveyActive(active);
      if (wasActive && !active)
        requestAnimationFrame(() => {
          if (surveyActiveRef.current) return;
          if (settingsButton.current) settingsButton.current.focus();
          else frame.current?.focus();
        });
    },
    [frame],
  );
  const [helpOpen, setHelpOpen] = useState(false),
    [shortcutNotice, setShortcutNotice] = useState("");
  const [hud, setHud] = useState({ message: "", nonce: 0 });
  const flash = useCallback((message: string) => setHud((h) => ({ message, nonce: h.nonce + 1 })), []);
  const [peeking, setPeeking] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => {
      setNarrow(el.clientWidth < 560 && !document.fullscreenElement);
      setFullscreenActive(document.fullscreenElement === el);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    document.addEventListener("fullscreenchange", measure);
    return () => {
      resize.disconnect();
      document.removeEventListener("fullscreenchange", measure);
    };
  }, [frame]);

  /* Original: toggle or hold-to-peek. A hold always arrives as a start/release pair. */
  const handleOriginal = useCallback(
    (value?: boolean, mode: "toggle" | "hold" = "toggle") => {
      if (mode === "hold") setPeeking((p) => !p);
      else {
        setPeeking(false);
        flash(value ?? !showOriginal ? "Original on" : "Original off");
      }
      onOriginal(value, mode);
    },
    [onOriginal, flash, showOriginal],
  );

  /* Demo-mode first-use hint for hold-to-peek. Never in study mode. */
  const onSoundCaption = useCallback(() => {
    if (!demoMode || condition === "baseline") return;
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch {
      return;
    }
    setHintVisible(true);
  }, [demoMode, condition]);
  const dismissHint = useCallback(() => {
    setHintVisible(false);
    try {
      localStorage.setItem(HINT_KEY, "dismissed");
    } catch {}
  }, []);
  useEffect(() => {
    if ((peeking || showOriginal) && hintVisible) dismissHint();
  }, [peeking, showOriginal, hintVisible, dismissHint]);

  usePlayerShortcuts(frame, profile.shortcuts && !surveyActive, profile.pageWideShortcuts && !surveyActive, {
    toggle: () => void toggle(),
    seek: (delta) => playback.seek((video.current?.currentTime || 0) + delta, "keyboard"),
    settings: () => {
      setHelpOpen(false);
      if (settingsAllowed) setSettingsOpen((v) => !v);
    },
    original: (value, mode) => {
      if (condition !== "baseline" && settingsAllowed) handleOriginal(value, mode);
    },
    originalEnabled: showOriginal,
    amount: (delta) => {
      if (condition === "baseline" || !settingsAllowed || !data?.cues.length) return;
      const detail = Math.max(1, Math.min(3, profile.detail + delta)) as 1 | 2 | 3;
      onApply({ ...profile, detail });
      setShortcutNotice(`Amount: ${DETAIL_LABELS[detail]}`);
      flash(`Detail: ${DETAIL_LABELS[detail]}`);
    },
    size: (delta) => {
      const sizes = ["standard", "large", "extra-large"] as const;
      const size = sizes[Math.max(0, Math.min(2, sizes.indexOf(profile.size) + delta))];
      onApply({ ...profile, size });
      setShortcutNotice(`Text size: ${size}`);
      flash(`Text size: ${SIZE_LABELS[size]}`);
    },
    fullscreen: () => void playback.fullscreen(),
    sound: (direction) => {
      const target = adjacentSound(data?.cues || [], video.current?.currentTime || 0, direction);
      if (target !== null) {
        playback.seek(target, "sound-navigation");
        flash(direction === "next" ? "Next sound" : "Previous sound");
      }
    },
    help: () => {
      setSettingsOpen(false);
      setHelpOpen(true);
    },
    close: () => {
      setHelpOpen(false);
      setSettingsOpen(false);
    },
  });
  const settingsHost = useRef<HTMLDivElement>(null);
  const settingsSource = useRef<"participant" | "system">("participant");
  const previousSettings = useRef(false);
  useEffect(() => {
    if (previousSettings.current !== settingsOpen) {
      onTelemetry({
        type: "settings",
        open: settingsOpen,
        video_s: video.current?.currentTime || 0,
        source: settingsSource.current,
      });
      previousSettings.current = settingsOpen;
      settingsSource.current = "participant";
    }
  }, [settingsOpen, onTelemetry, video]);
  const mismatch = !!data && duration > 0 && Math.abs(duration - data.duration_seconds) > 2;
  const firstLoad = !playing && time === 0;
  const modeBadge = peeking
    ? "Peeking at original"
    : condition === "baseline"
      ? "Original captions"
      : showOriginal
        ? "Showing original captions"
        : null;
  return (
    <>
      <div
        className={`video-frame ${settingsOpen ? "settings-open" : ""} ${narrow ? "settings-below" : ""}`}
        ref={frame}
        role="region"
        aria-label="Video player"
        tabIndex={0}
      >
        <div className="video-stage" inert={surveyActive}>
          <video
            ref={video}
            src={source}
            poster={source.startsWith("blob:") ? undefined : poster}
            preload="metadata"
            playsInline
            aria-label={`${data?.title || "Your video"} video player`}
            aria-describedby="video-description"
            tabIndex={0}
            {...playback.events}
          />

          {!playing && !error && (
            <div className="big-play">
              <button
                type="button"
                className="big-play__button"
                onClick={() => void toggle()}
                disabled={!ready}
                aria-label={ready ? "Play video" : "Loading video"}
              >
                <Icon name="play" size={32} />
              </button>
              {firstLoad && (
                <span className="big-play__label" aria-hidden="true">
                  {ready ? "Play" : "Loading"}
                </span>
              )}
            </div>
          )}
          {waiting && playing && (
            <span className="buffering" role="status">
              <span className="spinner" aria-hidden="true" />
              Buffering…
            </span>
          )}
          {modeBadge && (
            <span className={`mode-badge ${peeking ? "is-peeking" : ""}`}>
              <Icon name="compare" size={18} />
              {modeBadge}
            </span>
          )}
          <Hud message={hud.message} nonce={hud.nonce} />
          {hintVisible && !settingsOpen && !helpOpen && <OriginalHint onDismiss={dismissHint} />}
          <CaptionExperience
            onSurveyActive={surveyChanged}
            onSoundCaption={onSoundCaption}
            savedNonce={savedNonce}
            storageError={storageError}
            session={session}
            recorder={recorder}
            questions={questions}
            playing={playing}
            ended={playback.ended}
            pauseForSurvey={() => {
              if (settingsOpen) settingsSource.current = "system";
              setSettingsOpen(false);
              setHelpOpen(false);
              playback.pause("system");
              playback.exitNativeFullscreen();
            }}
            resumeAfterSurvey={() => void playback.play("system")}
            clock={playback.clock}
            data={data}
            duration={duration}
            profile={profile}
            condition={condition}
            original={showOriginal}
            video={video}
            host={settingsHost}
            trigger={settingsButton}
            recording={recording}
            onTelemetry={onTelemetry}
            open={settingsOpen}
            close={closeSettings}
            onApply={onApply}
            annotations={annotations}
          />
          <PlayerControls
            originalLocked={!settingsAllowed}
            showTicks={showTicks}
            cues={data?.cues}
            annotations={annotations}
            playback={playback}
            baseline={condition === "baseline"}
            hasCaptions={!!data?.cues.length}
            showOriginal={showOriginal}
            peeking={peeking}
            onOriginal={handleOriginal}
            settingsOpen={settingsOpen}
            onSettings={settingsAllowed ? () => setSettingsOpen((v) => !v) : undefined}
            settingsButton={settingsButton}
            helpButton={helpButton}
            helpOpen={helpOpen}
            onHelp={() => {
              setSettingsOpen(false);
              setHelpOpen((v) => !v);
            }}
            onSpeed={(rate) => flash(`Speed: ${rate}×`)}
            fullscreenActive={fullscreenActive}
          />
        </div>
        <div ref={settingsHost} className="settings-host" />
        <ShortcutHelp open={helpOpen} close={closeHelp} trigger={helpButton} profile={profile} onChange={onApply} />
      </div>
      {error && (
        <div role="alert" className="callout callout--danger player-message">
          <Icon name="warning" size={20} />
          <p>{error}</p>
        </div>
      )}
      {mismatch && (
        <div role="alert" className="callout callout--danger player-message">
          <Icon name="warning" size={20} />
          <p>
            Captions are hidden because their timing doesn’t match this video. Reload the page; if it keeps happening,
            tell the research team.
          </p>
        </div>
      )}
      {!data && (
        <div className="callout player-message">
          <Icon name="info" size={20} />
          <p>This film has no sound captions yet. Dialogue subtitles still show.</p>
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {shortcutNotice}
      </div>
      <p id="video-description" className="sr-only">
        Dialogue stays fixed while sound captions follow your preferences. Open Caption settings for detail, reading
        pace and appearance. Focus the player for keyboard controls; press question mark for help. Original toggles the
        source wording, or hold it to compare temporarily. The researcher console contains upcoming sound text and is
        not part of participant viewing.
      </p>
    </>
  );
}
