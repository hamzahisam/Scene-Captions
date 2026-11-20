"use client";
import { useState } from "react";
import type { CaptionVideo } from "@/lib/captions";
import type {QuestionFile} from "@/lib/study-surveys";
import type {CueAnnotations} from "@/lib/cue-annotations";
import {useStudySession} from "./study-context";
import { Workspace } from "./workspace";

export type ScreeningFilm = { data: CaptionVideo; sourceAssistedData?: CaptionVideo; source: string; poster: string; credit: string; annotations?:CueAnnotations;questions?:QuestionFile };
export function ScreeningRoom({ films }: { films: ScreeningFilm[] }) {
  const [selected, setSelected] = useState(films[0].data.video_id);
  const [locked, setLocked] = useState(false);
  const study=useStudySession();const session=study.session;const selectedId=session?.sequence[session.sequenceIndex].filmId||selected;
  const film = films.find(item => item.data.video_id === selectedId) || films[0];
  if(!study.ready)return <main id="main" className="workspace"><p>Loading saved settings…</p></main>;
  if(study.error)return <main id="main" className="workspace"><p role="alert">{study.error}</p><a href="/session">Research session setup</a></main>;
  return <>
    {!session&&<section className="film-library" aria-label="Film library">
      <fieldset id="film-choice" className="film-cards" disabled={locked}><legend>Choose a film</legend>
        {films.map(item => <label key={item.data.video_id} className="film-card"><input type="radio" name="film" value={item.data.video_id} checked={selected===item.data.video_id} onChange={() => setSelected(item.data.video_id)} /><img src={item.poster} alt="" loading="lazy" decoding="async" /><span className="film-card-title">{item.data.title}</span><span className="film-card-meta">{item.credit}</span>{item.data.cues.length>0?<span className="film-tag">Sound captions</span>:<span className="film-tag film-tag-plain">Dialogue only</span>}</label>)}
      </fieldset>
      {locked && <p role="status">Film selection stays fixed after a rehearsal starts. Export, then reload to choose another.</p>}
    </section>}
    <Workspace onLeaveStudy={study.leave} questions={film.questions} session={session||undefined} annotations={film.annotations} key={`${session?.id||"demo"}-${session?.sequenceIndex||0}-${film.data.video_id}`} initialVideo={film.data} sourceAssistedVideo={film.sourceAssistedData} demoSource={film.source} demoPoster={film.poster} demoCredit={film.credit} onMediaLockChange={setLocked} />
  </>;
}
