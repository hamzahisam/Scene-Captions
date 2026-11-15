"use client";
import { useSyncExternalStore } from "react";
import type { TelemetryRecorder } from "@/lib/telemetry-storage";
import { download } from "./captune/storage";
import { Icon } from "./icon";
export function RecorderStatus({ recorder, error }: { recorder: TelemetryRecorder | null; error?: string }) {
  useSyncExternalStore(recorder?.subscribe || (() => () => {}), recorder?.snapshot || (() => 0), () => 0);
  if (error)
    return (
      <p role="alert" className="callout callout--danger recorder-status">
        <Icon name="warning" size={18} />
        <span>{error}</span>
      </p>
    );
  return (
    <>
      {recorder?.context.participant_id &&
        !recorder.recording &&
        recorder.answers[`end:${recorder.context.film_id}:complete`] === 1 && (
          <p role="status" className="callout recorder-status">
            <Icon name="check" size={18} />
            <span>Your responses are saved locally. Ask the researcher about the next step.</span>
          </p>
        )}
      {recorder?.resumed && (
        <p role="status" className="callout recorder-status">
          <Icon name="info" size={18} />
          <span>Resumed saved local session. Your data remains in this browser.</span>
        </p>
      )}
      {recorder?.error && (
        <div role="alert" className="callout callout--danger recorder-status">
          <Icon name="warning" size={18} />
          <span>{recorder.error}</span>
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={() =>
              download(
                `recovery-${recorder.context.participant_id || "technical"}-${recorder.context.session_id}.json`,
                recorder.export(),
              )
            }
          >
            Export recovery JSON
          </button>
        </div>
      )}
    </>
  );
}
