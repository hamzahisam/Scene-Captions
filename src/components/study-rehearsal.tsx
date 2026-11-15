"use client";
import { useState, useSyncExternalStore } from "react";
import type { TelemetryRecorder } from "@/lib/telemetry-storage";
import { eventCsv, summaryCsv } from "@/lib/telemetry";
import { download } from "./captune/storage";
import { ratingQuestions } from "@/lib/experiment";
import { Icon } from "./icon";
export function StudyRehearsal({
  recorder,
  error,
  onStart,
  onStop,
}: {
  recorder: TelemetryRecorder | null;
  error?: string;
  onStart: () => void;
  onStop: () => void;
}) {
  const [consent, setConsent] = useState(false);
  useSyncExternalStore(recorder?.subscribe || (() => () => {}), recorder?.snapshot || (() => 0), () => 0);
  if (!recorder) return <p role="alert" className="console-count">{error || "Preparing local recorder…"}</p>;
  const name = `scenecaptions-${recorder.context.participant_id || "technical"}-${recorder.context.session_id}`;
  return (
    <section className="rehearsal console-block" aria-labelledby="rehearsal-title">
      <div className="section-title">
        <h3 id="rehearsal-title">Local technical rehearsal</h3>
        <span className={`status-pill ${recorder.recording ? "recording" : ""}`}>
          {recorder.recording && <span className="rec-dot" aria-hidden="true" />}
          {recorder.recording ? "Recording locally" : "Recording off"}
        </span>
      </div>
      <p className="field__helper">
        This is not formal research consent or an approved participant study. Data is saved only in this
        browser; export it before changing device or clearing browser storage.
      </p>
      {recorder.resumed && (
        <p role="status" className="callout">
          <Icon name="info" size={18} />
          <span>Resumed saved local recording after reload.</span>
        </p>
      )}
      {recorder.error && (
        <p role="alert" className="callout callout--danger">
          <Icon name="warning" size={18} />
          <span>{recorder.error}</span>
        </p>
      )}
      <p className="console-count">{recorder.events.length} events saved in this browser</p>
      {!recorder.recording && (
        <>
          <label className="check-field">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I agree
            to record this technical rehearsal locally.
          </label>
          <div className="button-row">
            <button type="button" className="btn btn--primary" disabled={!consent || !!recorder.error} onClick={onStart}>
              <Icon name="record" size={18} />
              Start rehearsal
            </button>
          </div>
        </>
      )}
      {recorder.recording && (
        <div className="button-row">
          <button type="button" className="btn btn--danger" onClick={onStop}>
            Stop recording
          </button>
        </div>
      )}
      <fieldset className="ratings-grid">
        <legend>Exploratory end-of-video ratings</legend>
        {ratingQuestions.map((q) => (
          <label key={q.key} className="form-field">
            {q.label}
            <select
              className="select"
              value={recorder.answers[q.key] ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                recorder.setAnswer(q.key, value);
                recorder.append({
                  type: "survey",
                  item: q.key,
                  value,
                  response_ms: 0,
                  video_s: recorder.events.at(-1)?.video_s || 0,
                });
              }}
            >
              <option value="">Unanswered</option>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
      <label className="form-field">
        Researcher note (no names or contact details)
        <textarea className="input" value={recorder.note} maxLength={2000} onChange={(e) => recorder.setNote(e.target.value)} />
      </label>
      <div className="button-row">
        <button type="button" className="btn btn--secondary" onClick={() => download(`${name}.json`, recorder.export())}>
          <Icon name="download" size={18} />
          Export full JSON
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => download(`${name}-events.csv`, eventCsv(recorder.events))}>
          <Icon name="download" size={18} />
          Export events CSV
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() =>
            download(`${name}-summary.csv`, summaryCsv(recorder.context, recorder.events, recorder.elapsed()))
          }
        >
          <Icon name="download" size={18} />
          Export summary CSV
        </button>
      </div>
    </section>
  );
}
