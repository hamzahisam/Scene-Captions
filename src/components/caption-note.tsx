import type { CaptionVideo } from "@/lib/captions";
import { Icon } from "./icon";

const tidy = (s: string) => s.split(" · ").join(", ");

/**
 * Viewer-facing line under the player: one plain sentence about the captions,
 * with source and licence behind "About these captions". Experimental tracks
 * keep a visible warning here, not only in the researcher console.
 */
export function CaptionNote({ data }: { data: CaptionVideo }) {
  const g = data.generated_with;
  const source = g.caption_source;
  const dialogueOnly = !data.cues.length;
  let line: string;
  if (g.experimental) line = "Experimental AI subtitles. Sounds or words may be wrong, missing or invented.";
  else if (dialogueOnly) line = "This film has no sound captions yet. Dialogue subtitles still show.";
  else if (g.kind === "source-assisted") line = "Sound captions generated and edited by the SceneCaptions team.";
  else if (g.kind === "sourced" && source) line = `Sound captions from ${tidy(source.author)}, with wording options by SceneCaptions.`;
  else line = "Draft sound captions. They still need review before research use.";
  return (
    <div className="caption-note">
      {g.experimental ? (
        <div className="callout callout--danger" role="note">
          <Icon name="warning" size={20} />
          <p>
            <strong>{line}</strong> They come from the film’s audio only and their timing needs review. They are not
            verified accessibility captions.
          </p>
        </div>
      ) : (
        <p className="caption-note__line">
          <Icon name="captions" size={20} />
          {line}
        </p>
      )}
      <details className="caption-note__about">
        <summary>
          <Icon name="chevron" size={16} className="disclosure-chevron" />
          About these captions
        </summary>
        <div className="caption-note__body">
          {source ? (
            <p>
              {g.kind === "source-assisted"
                ? "The wording at each detail level was written for this prototype from existing timed captions by "
                : "Timed captions by "}
              <a href={source.url} target="_blank" rel="noreferrer">
                {tidy(source.author)}
              </a>{" "}
              ({source.license}). Cue timing comes from that source and does not change with your settings.
            </p>
          ) : dialogueOnly ? (
            <p>A sound-caption track has not been prepared for this title yet. Dialogue wording stays fixed.</p>
          ) : (
            <p>These sound captions were prepared for this prototype and still need a full review.</p>
          )}
          {data.dialogue_source && (
            <p>
              Dialogue subtitles by{" "}
              <a href={data.dialogue_source.url} target="_blank" rel="noreferrer">
                {tidy(data.dialogue_source.author)}
              </a>{" "}
              ({data.dialogue_source.license}). Their wording and timing are unchanged.
            </p>
          )}
          <p>
            Captions are prepared in advance. Nothing is generated while you watch. <a href="#media-credits">All credits</a>
          </p>
        </div>
      </details>
    </div>
  );
}
