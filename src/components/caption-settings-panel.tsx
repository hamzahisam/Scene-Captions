"use client";
import type { RefObject } from "react";
import type { CaptionProfile, CaptionVideo, CaptionCue, Condition } from "@/lib/captions";
import { CaptionStyleControls } from "./caption-style-controls";
import { CaptionReadability } from "./caption-readability";
import { Sheet } from "./ui/sheet";
import { Icon } from "./icon";

/** Visible twin of the "Caption preferences saved." live region. Replays on each change. */
function SavedStatus({ nonce, error }: { nonce: number; error?: string }) {
  if (error)
    return (
      <span className="saved-status saved-status--error" aria-hidden="true">
        <Icon name="warning" size={16} />
        Not saved
      </span>
    );
  if (!nonce) return null;
  return (
    <span key={nonce} className="saved-status" aria-hidden="true">
      <Icon name="check" size={16} />
      Saved
    </span>
  );
}

export function CaptionSettingsPanel({
  open,
  close,
  trigger,
  profile,
  onApply,
  data,
  condition,
  sample,
  explanation,
  savedNonce = 0,
  storageError = "",
}: {
  open: boolean;
  close: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
  profile: CaptionProfile;
  onApply: (p: CaptionProfile) => void;
  data: CaptionVideo | null;
  condition: Condition;
  sample?: CaptionCue;
  explanation: string;
  savedNonce?: number;
  storageError?: string;
}) {
  const unavailable = !data?.cues.length,
    baseline = condition === "baseline";
  const done = () => {
    close();
    trigger.current?.focus();
  };
  return (
    <Sheet
      open={open}
      close={close}
      trigger={trigger}
      id="caption-settings"
      title="Caption settings"
      closeLabel="Close caption settings"
      className="caption-settings"
      status={<SavedStatus nonce={savedNonce} error={storageError} />}
      footer={
        <button type="button" className="btn btn--primary btn--block" onClick={done}>
          Done
        </button>
      }
    >
      {storageError && (
        <p className="callout callout--danger">
          <Icon name="warning" size={18} />
          <span>{storageError}</span>
        </p>
      )}
      {baseline && (
        <p className="callout">
          <Icon name="info" size={18} />
          <span>
            <strong>Original sound captions are fixed.</strong> You can still change how they look under Appearance.
          </span>
        </p>
      )}
      {unavailable && !baseline && (
        <p className="callout">
          <Icon name="info" size={18} />
          <span>
            <strong>This film has dialogue subtitles only.</strong> Sound settings don’t apply. You can still change how
            subtitles look under Appearance.
          </span>
        </p>
      )}
      <fieldset className="settings-sound" disabled={baseline || unavailable}>
        <legend className="sr-only">Sound settings</legend>
        <CaptionStyleControls
          profile={profile}
          onChange={onApply}
          sample={sample}
          explanation={explanation}
          conservative={data?.generated_with.expressiveness === "conservative"}
        />
      </fieldset>
      <CaptionReadability profile={profile} onApply={onApply} />
    </Sheet>
  );
}
