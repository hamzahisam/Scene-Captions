import { createHash } from "node:crypto";
import { z } from "zod";
import { videoSchema } from "./captions.ts";
import type { CaptionVideo } from "./captions.ts";

const translatedText = z.string().trim().min(1).refine(text => /\p{Script=Arabic}/u.test(text));
const sidecarSchema = z.object({
  video_id: z.string(),
  language: z.literal("ur"),
  status: z.literal("draft"),
  source_edit_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sounds: z.record(z.string(), z.union([
    z.tuple([translatedText, translatedText, translatedText]),
    z.tuple([translatedText, translatedText, translatedText, translatedText]),
  ])),
  dialogue: z.record(z.string(), translatedText),
});

function editDigest(source: CaptionVideo) {
  const edit = {
    id: source.video_id,
    duration: source.duration_seconds,
    cues: source.cues.map(cue => [cue.cue_id, cue.start_s, cue.end_s, cue.grid, cue.representations]),
    dialogue: (source.dialogue ?? []).map(cue => [cue.cue_id, cue.start_s, cue.end_s, cue.text]),
  };
  return createHash("sha256").update(JSON.stringify(edit)).digest("hex");
}

function bracket(text: string, punctuation = "") {
  return text.split("\n").map(line => `[${line}${line.endsWith("؟") && punctuation === "۔" ? "" : punctuation}]`).join("\n");
}

/** Construct a complete, edit-matched display track. Missing or stale text makes Urdu unavailable. */
export function urduTrackFor(source: CaptionVideo, raw: unknown): CaptionVideo | null {
  const result = sidecarSchema.safeParse(raw);
  if (!result.success || source.generated_with.experimental || source.generated_with.quality_gate === "failed") return null;
  const sidecar = result.data;
  if (sidecar.video_id !== source.video_id || sidecar.source_edit_sha256 !== editDigest(source)
    || Object.keys(sidecar.sounds).length !== source.cues.length
    || Object.keys(sidecar.dialogue).length !== (source.dialogue?.length ?? 0)) return null;

  const cues = [];
  for (const cue of source.cues) {
    const translation = sidecar.sounds[cue.cue_id];
    if (!translation) return null;
    const [essential, balanced, rich, spelling] = translation;
    const grid: Record<string, string> = {};
    for (const [index, wording] of [essential, balanced, rich].entries()) {
      const level = index + 1;
      if (wording.split("\n").length !== cue.grid[`${level}-1`].split("\n").length) return null;
      ["", "۔", "!"].forEach((mark, expression) => { grid[`${level}-${expression + 1}`] = bracket(wording, mark); });
    }
    if (Boolean(spelling) !== Boolean(cue.representations.onomatopoeic)) return null;
    cues.push({ ...cue, grid, representations: { plain: bracket(essential), onomatopoeic: spelling ? bracket(spelling) : undefined } });
  }

  const dialogue = [];
  for (const cue of source.dialogue ?? []) {
    const text = sidecar.dialogue[cue.cue_id];
    if (!text) return null;
    dialogue.push({ ...cue, text });
  }

  const track = videoSchema.safeParse({ ...source, annotation_status: "draft", cues, dialogue });
  return track.success ? track.data : null;
}
