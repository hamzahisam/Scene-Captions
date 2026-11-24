"use client";

import type { CSSProperties } from "react";
import { dialogueParts, reviewedSpeaker, mapLinesToKinds } from "@/lib/cue-annotations";
import type { CueAnnotations } from "@/lib/cue-annotations";
import type { CaptionWindow, CaptionProfile } from "@/lib/captions";
import type { DialogueCue } from "@/lib/caption-sample";
import { viewerText } from "@/lib/viewer-language";
import type { ViewerLanguage } from "@/lib/viewer-language";
import { useViewerLanguage } from "./viewer-language";

export function CaptionOverlay({ sound, dialogue, profile, annotations, sample, language, onFitChange }: {
  sound: CaptionWindow[];
  dialogue: DialogueCue[];
  profile: CaptionProfile;
  annotations?: CueAnnotations;
  sample: boolean;
  language: ViewerLanguage;
  onFitChange?: (element: HTMLDivElement | null) => void;
}) {
  const { t, language: interfaceLanguage } = useViewerLanguage();
  if (!sound.length && !dialogue.length) return null;
  if (dialogue.length && profile.dialoguePosition !== "together" && profile.dialoguePosition !== profile.position) {
    return <>
      <CaptionOverlay sound={sound} dialogue={[]} profile={{...profile, dialoguePosition: "together"}} annotations={annotations} sample={sample} language={language} onFitChange={onFitChange} />
      <CaptionOverlay sound={[]} dialogue={dialogue} profile={{...profile, position: profile.dialoguePosition, dialoguePosition: "together"}} annotations={annotations} sample={false} language={language} />
    </>;
  }
  return <div ref={onFitChange} lang={language} dir={language === "ur" ? "rtl" : "ltr"}
    style={{ "--caption-width": `${profile.width}%` } as CSSProperties}
    className={`caption-overlay font-${profile.urduFont} ${profile.position} ${profile.size} backdrop-${profile.backdrop} color-${profile.textColor}${sample ? " caption-sample" : ""}`}>
    {sample && <span className="sample-label" lang={interfaceLanguage} dir="auto">{t("sample")}</span>}
    {!!dialogue.length && <div className="dialogue-lines" role="group" aria-label={viewerText(language, "dialogue")}>
      {dialogue.map(cue => {
        const part = dialogueParts(cue.text, profile.speakerLabels && language === "en" ? reviewedSpeaker(annotations, cue.cue_id) : undefined);
        return <p key={cue.cue_id} dir="auto">
          {part.speaker && <><bdi className="speaker-chip">{part.speaker}</bdi><span className="sr-only">: </span></>}
          {part.text}
        </p>;
      })}
    </div>}
    {!!sound.length && <div className="caption-lines" role="group" aria-label={viewerText(language, "soundCaptions")}>
      {sound.map(({ cue, caption }) => {
        const annotation = annotations?.sounds[cue.cue_id];
        const lines = caption.text.split("\n");
        const kinds = mapLinesToKinds(lines, annotation);
        return <p key={cue.cue_id} className={profile.italicSound && language === "en" ? "sound-italic" : undefined}>
          {lines.map((line, index) => {
            const kind = profile.typeStyling ? kinds[index] : undefined;
            return <span key={index} className={kind ? `caption-line sound-type sound-${kind}` : "caption-line"}>
              {kind === "music" && <span aria-hidden="true">♪ </span>}<bdi>{line}</bdi>{kind === "music" && <span aria-hidden="true"> ♪</span>}
            </span>;
          })}
          {profile.typeStyling && annotation?.offscreen && <span className="offscreen-tag" lang={interfaceLanguage}>{t("offscreen")}</span>}
          {profile.markShortened && caption.adapted && <span className="shortened-marker"><span aria-hidden="true"> ▿</span>
            <span className="sr-only" lang={interfaceLanguage}> ({t("screenReaderShortened")})</span></span>}
        </p>;
      })}
    </div>}
  </div>;
}
