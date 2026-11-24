import type { CaptionVideo, Condition } from "./captions.ts";
import type { ViewerLanguage } from "./viewer-language.ts";

export function selectViewerCaptionTrack(source: CaptionVideo | null, urdu: CaptionVideo | null,
  preferred: ViewerLanguage, condition: Condition, original: boolean, study: boolean) {
  const locked = study || original || condition === "baseline" || !!source?.generated_with.experimental;
  const language: ViewerLanguage = locked ? "en" : preferred;
  const data = language === "ur" ? urdu : source;
  return { data, language, locked, unavailable: language === "ur" && !data };
}
