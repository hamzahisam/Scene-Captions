"use client";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { CaptionVideo } from "@/lib/captions";
import type { QuestionFile } from "@/lib/study-surveys";
import type { CueAnnotations } from "@/lib/cue-annotations";
import { useStudySession } from "./study-context";
import { Workspace } from "./workspace";
import { SiteFooter } from "./site-footer";
import { Soundprint } from "./ui/soundprint";
import { Icon } from "./icon";

export type ScreeningFilm = {
  data: CaptionVideo;
  sourceAssistedData?: CaptionVideo;
  source: string;
  poster: string;
  /** Studio and year, e.g. "Blender Foundation, 2008". */
  credit: string;
  annotations?: CueAnnotations;
  questions?: QuestionFile;
};

function soundTrack(film: ScreeningFilm) {
  return film.sourceAssistedData ?? film.data;
}

function FilmRail({
  films,
  selected,
  onSelect,
  locked,
}: {
  films: ScreeningFilm[];
  selected: string;
  onSelect: (id: string) => void;
  locked: boolean;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [drawId] = useState(selected); // one orchestrated draw-in, on first load only
  function move(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (e.key in keys) next = (index + keys[e.key] + films.length) % films.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = films.length - 1;
    if (next === null) return;
    e.preventDefault();
    const id = films[next].data.video_id;
    if (!locked) onSelect(id);
    const el = refs.current[id];
    el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  return (
    <section className="film-library" aria-labelledby="film-rail-heading">
      <h2 id="film-rail-heading" className="film-library__heading">
        Choose a film
      </h2>
      <div
        id="film-choice"
        className="film-rail"
        role="radiogroup"
        aria-labelledby="film-rail-heading"
        aria-describedby={locked ? "film-lock-message" : undefined}
        aria-disabled={locked || undefined}
      >
        {films.map((film, index) => {
          const track = soundTrack(film);
          const hasSound = track.cues.length > 0;
          const checked = film.data.video_id === selected;
          return (
            <button
              key={film.data.video_id}
              ref={(el) => {
                refs.current[film.data.video_id] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-disabled={locked || undefined}
              aria-label={`${film.data.title}, ${film.credit}. ${hasSound ? "Sound captions" : "Dialogue subtitles only"}.`}
              data-film-id={film.data.video_id}
              tabIndex={checked ? 0 : -1}
              className="film-card"
              onClick={() => {
                if (!locked) onSelect(film.data.video_id);
              }}
              onKeyDown={(e) => move(e, index)}
            >
              <span className="film-card__poster">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={film.poster} alt="" loading={index < 3 ? "eager" : "lazy"} />
                <span className="film-card__check" aria-hidden="true">
                  <Icon name="check" size={18} />
                </span>
              </span>
              <span className="film-card__body">
                <span className="film-card__title">{film.data.title}</span>
                <span className="film-card__meta">{film.credit}</span>
                <span className={`chip film-card__badge ${hasSound ? "" : "chip--plain"}`}>
                  {hasSound ? "Sound captions" : "Dialogue subtitles only"}
                </span>
                {hasSound && (
                  <Soundprint
                    variant="card"
                    cues={track.cues}
                    duration={track.duration_seconds}
                    annotations={film.annotations}
                    draw={drawId === film.data.video_id}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
      {locked && (
        <p id="film-lock-message" className="film-library__lock" role="status">
          <Icon name="info" size={18} />
          Film is locked while a rehearsal is recording. Stop and export the rehearsal to switch films.
        </p>
      )}
    </section>
  );
}

function LoadingStage() {
  return (
    <main id="main" className="watch" aria-busy="true">
      <div className="film-rail film-rail--skeleton" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton film-card--skeleton" />
        ))}
      </div>
      <div className="skeleton watch__title-skeleton" aria-hidden="true" />
      <div className="skeleton video-skeleton" aria-hidden="true" />
      <p className="watch__loading" role="status">
        Loading your caption settings…
      </p>
    </main>
  );
}

export function ScreeningRoom({ films }: { films: ScreeningFilm[] }) {
  const [selected, setSelected] = useState(films[0].data.video_id);
  const [locked, setLocked] = useState(false);
  const [consoleHost, setConsoleHost] = useState<HTMLDivElement | null>(null);
  const study = useStudySession();
  const session = study.session;
  const selectedId = session?.sequence[session.sequenceIndex].filmId || selected;
  const film = films.find((item) => item.data.video_id === selectedId) || films[0];
  if (!study.ready) return <LoadingStage />;
  if (study.error)
    return (
      <main id="main" className="watch">
        <div className="callout callout--danger watch__error" role="alert">
          <Icon name="warning" size={20} />
          <p>
            {study.error} <a href="/session">Open session setup</a>
          </p>
        </div>
      </main>
    );
  return (
    <>
      <main id="main" className="watch">
        {!session && <FilmRail films={films} selected={selected} onSelect={setSelected} locked={locked} />}
        <Workspace
          questions={film.questions}
          session={session || undefined}
          annotations={film.annotations}
          key={`${session?.id || "demo"}-${session?.sequenceIndex || 0}-${film.data.video_id}`}
          initialVideo={film.data}
          sourceAssistedVideo={film.sourceAssistedData}
          demoSource={film.source}
          demoPoster={film.poster}
          demoCredit={film.credit}
          onMediaLockChange={setLocked}
          consoleHost={consoleHost}
        />
      </main>
      <SiteFooter film={film} />
      <div className="console-band theme-paper">
        <div ref={setConsoleHost} className="console-band__inner" />
        {session && (
          <details className="researcher-exit console-section">
            <summary>Leave study mode</summary>
            <p className="field__helper">For the researcher. Saved local data stays in this browser.</p>
            <button type="button" className="btn btn--secondary" onClick={study.leave}>
              Leave study mode
            </button>
          </details>
        )}
      </div>
    </>
  );
}
