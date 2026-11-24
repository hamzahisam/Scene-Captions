import type { CaptionVideo, CaptionProfile } from "./captions.ts";
import type { ViewerLanguage } from "./viewer-language.ts";

// Both alternatives retain information explicitly present in the source captions.
const alternatives: Record<string, Record<ViewerLanguage, [string, string]>> = {
  "soar-sound-009": {en: ["[Piano music plays.]", "[Sad music plays.]"], ur: ["[پیانو کی موسیقی بجتی ہے۔]", "[اداس موسیقی بجتی ہے۔]"]},
  "soar-sound-014": {en: ["[Oboe music plays.]", "[Curious music plays.]"], ur: ["[اوبو کی موسیقی بجتی ہے۔]", "[تجسس بھری موسیقی بجتی ہے۔]"]},
  "soar-sound-037": {en: ["[Piano music plays.]", "[Sad music plays.]"], ur: ["[پیانو کی موسیقی بجتی ہے۔]", "[اداس موسیقی بجتی ہے۔]"]},
  "soar-sound-049": {en: ["[Piano music plays.]", "[Happy music plays.]"], ur: ["[پیانو کی موسیقی بجتی ہے۔]", "[خوشگوار موسیقی بجتی ہے۔]"]},
};

export function musicTrack(data: CaptionVideo | null, choice: CaptionProfile["musicWording"], language: ViewerLanguage): CaptionVideo | null {
  if (!data || choice === "source") return data;
  return {...data, cues: data.cues.map(cue => {
    const options = alternatives[cue.cue_id]?.[language];
    if (!options) return cue;
    const text = options[choice === "descriptive" ? 0 : 1];
    return {...cue, grid: Object.fromEntries(Object.keys(cue.grid).map(key => [key, text])), representations: {plain: text}};
  })};
}
