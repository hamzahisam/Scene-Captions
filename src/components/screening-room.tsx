"use client";
import { useState } from "react";
import type { CaptionVideo } from "@/lib/captions";
import type {QuestionFile} from "@/lib/study-surveys";
import type {CueAnnotations} from "@/lib/cue-annotations";
import {useStudySession} from "./study-context";
import { Workspace } from "./workspace";
import { useViewerLanguage } from "./viewer-language";
import type { RecurrenceAnnotation } from "@/lib/caption-recurrence";

export type ScreeningFilm = { data: CaptionVideo; sourceAssistedData?: CaptionVideo; urdu?: CaptionVideo | null; recurrences?: readonly RecurrenceAnnotation[]; source: string; poster: string; credit: string; annotations?:CueAnnotations;questions?:QuestionFile };
export function ScreeningRoom({ films }: { films: ScreeningFilm[] }) {
  const { t } = useViewerLanguage();
  const [selected, setSelected] = useState(films[0]?.data.video_id);
  const [locked, setLocked] = useState(false);
  const study=useStudySession();const session=study.session;const selectedId=session?.sequence[session.sequenceIndex].filmId||selected;
  const film = films.find(item => item.data.video_id === selectedId) || films[0];
  if(!study.ready)return <main id="main" className="workspace"><p>{t("loadingSettings")}</p></main>;
  if(study.error)return <main id="main" className="workspace"><p role="alert">{t("studyError")}</p><a href="/session">{t("sessionSetup")}</a></main>;
  if(!film)return <main id="main" className="workspace"><p>{t("noFilms")}</p></main>;
  return <>
    {!session&&<section className="film-library" aria-label={t("filmLibrary")}>
      <fieldset id="film-choice" className="film-cards" disabled={locked}><legend>{t("chooseFilm")}</legend>
        {films.map(item => <label key={item.data.video_id} className="film-card" data-watching={t("nowWatching")}><input type="radio" name="film" value={item.data.video_id} checked={selected===item.data.video_id} onChange={() => setSelected(item.data.video_id)} /><img src={item.poster} alt="" loading="lazy" decoding="async" /><span className="film-card-title"><bdi lang="en">{item.data.title}</bdi></span><span className="film-card-meta"><bdi lang="en">{item.credit}</bdi></span>{item.data.cues.length>0?<span className="film-tag">{t("soundCaptions")}</span>:<span className="film-tag film-tag-plain">{t("dialogueOnly")}</span>}</label>)}
      </fieldset>
      {locked && <p role="status">{t("filmLocked")}</p>}
    </section>}
    <Workspace onLeaveStudy={study.leave} questions={film.questions} session={session||undefined} annotations={film.annotations} key={`${session?.id||"demo"}-${session?.sequenceIndex||0}-${film.data.video_id}`} initialVideo={film.data} urdu={film.urdu ?? null} recurrences={film.recurrences} sourceAssistedVideo={film.sourceAssistedData} demoSource={film.source} demoPoster={film.poster} demoCredit={film.credit} onMediaLockChange={setLocked} />
  </>;
}
