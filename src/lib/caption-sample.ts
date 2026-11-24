import type { CaptionVideo, CaptionWindow } from "./captions.ts";

export type DialogueCue = NonNullable<CaptionVideo["dialogue"]>[number];

export function pastCaptionTime(windows: readonly CaptionWindow[], dialogue: readonly DialogueCue[], time: number) {
  let last: number | undefined;
  for (const cue of [...windows, ...dialogue]) {
    const end = "display_end_s" in cue ? cue.display_end_s : cue.end_s;
    if (end <= time && (last === undefined || cue.start_s > last)) last = cue.start_s;
  }
  return last;
}

/** A sample and live playback use the same window boundaries and resolved captions. */
export function captionsAt(windows: readonly CaptionWindow[], dialogue: readonly DialogueCue[], time: number) {
  return {
    sound: windows.filter(cue => cue.start_s <= time && time < cue.display_end_s),
    dialogue: dialogue.filter(cue => cue.start_s <= time && time < cue.end_s),
  };
}
