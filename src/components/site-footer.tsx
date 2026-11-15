import type { CaptionVideo } from "@/lib/captions";

const LICENCE_LINKS: Record<string, string> = {
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
};

function Licence({ name }: { name: string }) {
  const href = LICENCE_LINKS[name];
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {name}
    </a>
  ) : (
    <>{name}</>
  );
}

/** One credits block per film: labelled lines, no middle-dot strings. */
export function FilmCredits({ data, track, credit }: { data: CaptionVideo; track: CaptionVideo; credit: string }) {
  const captionSource = track.generated_with.caption_source;
  const dialogue = track.dialogue_source ?? data.dialogue_source;
  return (
    <dl className="credits">
      <div>
        <dt>Film</dt>
        <dd>
          <a href={data.source_url} target="_blank" rel="noreferrer">
            {data.title}
          </a>
          , {credit}
        </dd>
      </div>
      <div>
        <dt>Licence</dt>
        <dd>
          <Licence name={data.license} />
          <br />
          {data.attribution.split(" · ").join(", ")}
        </dd>
      </div>
      <div>
        <dt>Sound captions</dt>
        <dd>
          {captionSource ? (
            <>
              {track.generated_with.kind === "source-assisted"
                ? "Wording generated and edited by the SceneCaptions team, based on timed captions by "
                : "Timed captions by "}
              <a href={captionSource.url} target="_blank" rel="noreferrer">
                {captionSource.author.split(" · ").join(", ")}
              </a>{" "}
              (<Licence name={captionSource.license} />)
              {track.generated_with.kind === "source-assisted" ? "." : ", with wording variants by SceneCaptions."}
            </>
          ) : track.cues.length ? (
            "Prepared by the SceneCaptions team."
          ) : (
            "None yet for this film."
          )}
        </dd>
      </div>
      {dialogue && (
        <div>
          <dt>Dialogue subtitles</dt>
          <dd>
            <a href={dialogue.url} target="_blank" rel="noreferrer">
              {dialogue.author.split(" · ").join(", ")}
            </a>{" "}
            (<Licence name={dialogue.license} />). Source wording and timing kept.
          </dd>
        </div>
      )}
    </dl>
  );
}

export function SiteFooter({
  film,
}: {
  film: { data: CaptionVideo; sourceAssistedData?: CaptionVideo; credit: string };
}) {
  return (
    <footer id="media-credits" className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__tagline">More of the story. On your terms.</p>
          <p className="site-footer__note">
            A research prototype. Captions are prepared in advance; nothing is generated while you watch.
          </p>
        </div>
        <div className="site-footer__credits">
          <h2 className="site-footer__heading">Credits</h2>
          <FilmCredits data={film.data} track={film.sourceAssistedData ?? film.data} credit={film.credit} />
        </div>
      </div>
    </footer>
  );
}
