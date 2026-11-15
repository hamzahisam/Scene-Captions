"use client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from "react";
import { formatTime } from "@/lib/captions";
import { adjacentSound } from "@/lib/sound-navigation";
import type { CaptionCue } from "@/lib/captions";
import type { CueAnnotations } from "@/lib/cue-annotations";
import { OriginalButton } from "./original-button";
import { Icon } from "./icon";
import { Tooltip } from "./ui/tooltip";
import type { useVideoPlayback } from "./hooks/use-video-playback";

const SPEEDS = [0.75, 1, 1.25] as const;

function SpeedMenu({ rate, onChange }: { rate: number; onChange: (rate: number) => void }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") || [])];
    (items.find((i) => i.getAttribute("aria-checked") === "true") || items[0])?.focus();
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function key(e: ReactKeyboardEvent<HTMLDivElement>) {
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") || [])];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      items[(index + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    }
  }
  const label = `${rate}×`;
  return (
    <span className="speed-menu">
      <Tooltip text="Playback speed">
        <button
          ref={button}
          type="button"
          className="control control--text"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Playback speed, ${label}`}
          onClick={() => setOpen((v) => !v)}
        >
          {label}
          <Icon name="chevronDown" size={16} />
        </button>
      </Tooltip>
      {open && (
        <div ref={menu} role="menu" aria-label="Playback speed" className="popover-menu" onKeyDown={key}>
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              role="menuitemradio"
              aria-checked={rate === speed}
              className="popover-menu__item"
              onClick={() => {
                onChange(speed);
                setOpen(false);
                button.current?.focus();
              }}
            >
              <span>{speed}×</span>
              {rate === speed && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function Timeline({
  time,
  duration,
  ready,
  seek,
  cues,
  annotations,
  showTicks,
  video,
}: {
  time: number;
  duration: number;
  ready: boolean;
  seek: (seconds: number) => void;
  cues: CaptionCue[];
  annotations?: CueAnnotations;
  showTicks: boolean;
  video?: RefObject<HTMLVideoElement | null>;
}) {
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null);
  const [focused, setFocused] = useState(false);
  const [buffered, setBuffered] = useState(0);
  useEffect(() => {
    const el = video?.current;
    if (!el || !duration) return;
    let end = 0;
    for (let i = 0; i < el.buffered.length; i++)
      if (el.buffered.start(i) <= el.currentTime + 0.5) end = Math.max(end, el.buffered.end(i));
    setBuffered(Math.min(1, end / duration));
  }, [time, duration, video]);
  const played = duration ? Math.min(1, time / duration) : 0;
  const tip = hover ?? (focused ? { x: played * 100, t: time } : null);
  return (
    <div
      className="timeline-track"
      onPointerMove={(e) => {
        if (!duration || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        setHover({ x: ratio * 100, t: ratio * duration });
      }}
      onPointerLeave={() => setHover(null)}
    >
      <label className="sr-only" htmlFor="timeline">
        Seek video
      </label>
      <input
        id="timeline"
        className="timeline"
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={Math.min(time, duration || 1)}
        disabled={!ready}
        onChange={(e) => seek(Number(e.target.value))}
        onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setFocused(false);
        }}
        aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
        style={
          {
            "--played": `${played * 100}%`,
            "--buffered": `${Math.max(played, buffered) * 100}%`,
          } as CSSProperties
        }
      />
      {tip && duration > 0 && (
        <span
          className="timeline-tip"
          aria-hidden="true"
          style={{ left: `clamp(48px, ${tip.x}%, calc(100% - 48px))` }}
        >
          {formatTime(tip.t)}
        </span>
      )}
    </div>
  );
}

export function PlayerControls({
  playback,
  baseline,
  hasCaptions,
  showOriginal,
  peeking = false,
  onOriginal,
  settingsOpen = false,
  onSettings,
  settingsButton,
  helpButton,
  helpOpen = false,
  onHelp,
  cues = [],
  annotations,
  showTicks = true,
  originalLocked = false,
  originalHint,
  onSpeed,
  fullscreenActive = false,
}: {
  playback: Pick<
    ReturnType<typeof useVideoPlayback>,
    | "time"
    | "duration"
    | "ready"
    | "playing"
    | "muted"
    | "playbackRate"
    | "toggle"
    | "seek"
    | "toggleMute"
    | "changeRate"
    | "fullscreen"
    | "video"
  >;
  baseline: boolean;
  hasCaptions: boolean;
  originalLocked?: boolean;
  cues?: CaptionCue[];
  annotations?: CueAnnotations;
  showTicks?: boolean;
  showOriginal: boolean;
  peeking?: boolean;
  onOriginal: (enabled?: boolean, mode?: "toggle" | "hold") => void;
  settingsOpen?: boolean;
  onSettings?: () => void;
  settingsButton?: RefObject<HTMLButtonElement | null>;
  helpButton?: RefObject<HTMLButtonElement | null>;
  helpOpen?: boolean;
  onHelp?: () => void;
  originalHint?: ReactNode;
  onSpeed?: (rate: number) => void;
  fullscreenActive?: boolean;
  /** Kept for API compatibility; provenance now lives in the caption note. */
  generatedBaseline?: boolean;
  experimental?: boolean;
}) {
  const controls = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = controls.current;
    if (!el) return;
    const update = () =>
      el.closest<HTMLElement>(".video-frame")?.style.setProperty("--controls-height", `${el.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, []);
  const { time, duration, ready, playing, muted, playbackRate, toggle, seek, toggleMute, changeRate, fullscreen, video } =
    playback;
  const previous = adjacentSound(cues, time, "previous");
  const next = adjacentSound(cues, time, "next");
  const originalDisabledReason = baseline
    ? "Original captions are fixed in this condition"
    : !hasCaptions
      ? "This film has no sound captions"
      : originalLocked
        ? "Original captions are fixed in this condition"
        : null;
  return (
    <div ref={controls} className="video-controls">
      <Timeline
        time={time}
        duration={duration}
        ready={ready}
        seek={(t) => seek(t)}
        cues={cues}
        annotations={annotations}
        showTicks={showTicks}
        video={video}
      />
      <div className="transport">
        <div className="transport__group">
          <Tooltip text={playing ? "Pause" : "Play"} shortcut="K" align="start">
            <button
              type="button"
              className="control"
              onClick={() => void toggle()}
              disabled={!ready}
              aria-label={playing ? "Pause video" : "Play video"}
              aria-keyshortcuts="K Space"
            >
              <Icon name={playing ? "pause" : "play"} size={24} />
            </button>
          </Tooltip>
          <Tooltip text="Previous sound" shortcut="P">
            <button
              type="button"
              className="control"
              aria-label="Previous sound"
              aria-keyshortcuts="P"
              disabled={previous === null}
              onClick={() => {
                if (previous !== null) seek(previous, "sound-navigation");
              }}
            >
              <Icon name="previousSound" size={24} />
            </button>
          </Tooltip>
          <Tooltip text="Next sound" shortcut="N">
            <button
              type="button"
              className="control"
              aria-label="Next sound"
              aria-keyshortcuts="N"
              disabled={next === null}
              onClick={() => {
                if (next !== null) seek(next, "sound-navigation");
              }}
            >
              <Icon name="nextSound" size={24} />
            </button>
          </Tooltip>
          <Tooltip text={muted ? "Unmute" : "Mute"}>
            <button type="button" className="control" onClick={toggleMute} aria-label={muted ? "Unmute video" : "Mute video"}>
              <Icon name={muted ? "mute" : "volume"} size={24} />
            </button>
          </Tooltip>
          <span className="time-code">
            {formatTime(time)} <span>/ {formatTime(duration)}</span>
          </span>
        </div>
        <div className="transport__group transport__group--end">
          <SpeedMenu
            rate={playbackRate}
            onChange={(rate) => {
              changeRate(rate);
              onSpeed?.(rate);
            }}
          />
          <span className="original-anchor">
            <Tooltip
              text={originalDisabledReason || "Show original captions. Hold to peek."}
              shortcut={originalDisabledReason ? undefined : "O"}
            >
              <OriginalButton
                enabled={showOriginal || baseline}
                peeking={peeking}
                disabled={baseline || originalLocked || !hasCaptions}
                onChange={(value, mode) => onOriginal(value, mode)}
              />
            </Tooltip>
            {originalHint}
          </span>
          {onSettings && (
            <Tooltip text="Caption settings" shortcut="C">
              <button
                ref={settingsButton}
                type="button"
                className="control control--labelled captions-button"
                onClick={onSettings}
                aria-label="Caption settings"
                aria-keyshortcuts="C"
                aria-expanded={settingsOpen}
                aria-controls="caption-settings"
              >
                <Icon name="captions" size={24} />
                {/* Visible text matches the accessible name (WCAG 2.5.3 label in name). */}
                <span className="control__label" aria-hidden="true">
                  Caption settings
                </span>
              </button>
            </Tooltip>
          )}
          {onHelp && (
            <Tooltip text="Keyboard shortcuts" shortcut="?" align="end">
              <button
                ref={helpButton}
                type="button"
                className="control"
                aria-label="Keyboard shortcuts"
                aria-keyshortcuts="Shift+?"
                aria-expanded={helpOpen}
                onClick={onHelp}
              >
                <Icon name="help" size={24} />
              </button>
            </Tooltip>
          )}
          <Tooltip text={fullscreenActive ? "Exit fullscreen" : "Fullscreen"} shortcut="F" align="end">
            <button
              type="button"
              className="control"
              aria-label="Fullscreen player"
              aria-keyshortcuts="F"
              onClick={() => void fullscreen()}
            >
              <Icon name={fullscreenActive ? "collapse" : "expand"} size={24} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
