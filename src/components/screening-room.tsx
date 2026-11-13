"use client";
import { useState } from "react";
import type { CaptionVideo } from "@/lib/captions";
import type {CueAnnotations} from "@/lib/cue-annotations";
import {useStudySession} from "./study-context";
import { Workspace } from "./workspace";

export type ScreeningFilm = { data: CaptionVideo; sourceAssistedData?: CaptionVideo; source: string; poster: string; credit: string; annotations?:CueAnnotations };
export function ScreeningRoom({ films }: { films: ScreeningFilm[] }) {
  const [selected, setSelected] = useState(films[0].data.video_id);
  const [locked, setLocked] = useState(false);
  const study=useStudySession();const session=study.session;const selectedId=session?.sequence[session.sequenceIndex].filmId||selected;
  const film = films.find(item => item.data.video_id === selectedId) || films[0];
  if(!study.ready)return <main id="main" className="workspace"><p>Loading saved settings…</p></main>;
  if(study.error)return <main id="main" className="workspace"><p role="alert">{study.error}</p><a href="/session">Research session setup</a></main>;
  return <>
    {!session&&<section className="film-library" aria-label="Film library">
      <div><label htmlFor="film-choice">Choose a film</label><p>Each film opens with its own captions and credits.</p></div>
      <select id="film-choice" value={selected} disabled={locked} onChange={event => setSelected(event.target.value)}>
        {films.map(item => <option key={item.data.video_id} value={item.data.video_id}>{item.data.title}{!item.data.cues.length?" (dialogue only)":""}</option>)}
      </select>
      {locked && <p role="status">Film selection stays fixed after a rehearsal starts. Export, then reload to choose another.</p>}
    </section>}
    <Workspace session={session||undefined} annotations={film.annotations} key={`${session?.id||"demo"}-${session?.sequenceIndex||0}-${film.data.video_id}`} initialVideo={film.data} sourceAssistedVideo={film.sourceAssistedData} demoSource={film.source} demoPoster={film.poster} demoCredit={film.credit} onMediaLockChange={setLocked} />
    {session&&<details className="researcher-exit"><summary>Researcher controls</summary><button onClick={study.leave}>Leave study mode</button></details>}
  </>;
}
