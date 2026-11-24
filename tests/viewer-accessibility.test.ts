import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_PROFILE, profileSchema, resolveCaption, resolveCaptionWindows, videoSchema } from "../src/lib/captions.ts";
import type { CaptionCue } from "../src/lib/captions.ts";
import { urduTrackFor } from "../src/lib/caption-translations.ts";
import { selectViewerCaptionTrack } from "../src/lib/viewer-caption-track.ts";
import { verifiedRecurrenceLabels } from "../src/lib/caption-recurrence.ts";
import type { RecurrenceAnnotation } from "../src/lib/caption-recurrence.ts";
import { captionsAt, pastCaptionTime } from "../src/lib/caption-sample.ts";
import { loadProfile } from "../src/lib/profile.ts";
import { readViewerLanguage, viewerText } from "../src/lib/viewer-language.ts";

const read = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const films = [["big-buck-bunny", "big-buck-bunny-controls", 87, 0], ["soar", "soar", 49, 0], ["hair-love", "hair-love", 15, 26]] as const;
const sourceFor = (film: string) => videoSchema.parse(read(`data/source-assisted-captions/${film}.json`));
const sidecarFor = (id: string) => read(`data/caption-translations/ur/${id}.json`);

test("legacy profiles default adaptation off and persist explicit preferences separately from interface language", () => {
  const { adaptive, width, captionLanguage, ...legacy } = DEFAULT_PROFILE;
  assert.equal(loadProfile(null).adaptive, false);
  assert.equal(loadProfile(JSON.stringify(legacy)).adaptive, false);
  for (const adaptive of [true, false]) {
    const saved = { ...legacy, adaptive, width: 96, captionLanguage: "ur" };
    assert.deepEqual(loadProfile(JSON.stringify(saved)), saved);
  }
  assert.equal(profileSchema.safeParse({ ...DEFAULT_PROFILE, width: 120 }).success, false);
  assert.equal(readViewerLanguage("ur"), "ur");
  assert.equal(readViewerLanguage("other"), "en");
  assert.notEqual(viewerText("ur", "closeSettings"), viewerText("en", "closeSettings"));
});

for (const [id, file, sounds, dialogueCount] of films) {
  test(`${id}: Urdu draft covers the edit, distinct sound/dialogue and all variants`, () => {
    const source = sourceFor(file);
    const sidecar = sidecarFor(id);
    const urdu = urduTrackFor(source, sidecar);
    assert.ok(urdu);
    assert.equal(urdu.annotation_status, "draft");
    assert.equal(urdu.cues.length, sounds);
    assert.equal(urdu.dialogue?.length, dialogueCount);
    assert.deepEqual(urdu.cues.map(c => [c.cue_id, c.start_s, c.end_s, c.reference_text]),
      source.cues.map(c => [c.cue_id, c.start_s, c.end_s, c.reference_text]));
    assert.deepEqual(urdu.dialogue?.map(c => [c.cue_id, c.start_s, c.end_s]),
      (source.dialogue ?? []).map(c => [c.cue_id, c.start_s, c.end_s]));
    assert.deepEqual(urdu.generated_with.caption_source, source.generated_with.caption_source);
    assert.deepEqual(urdu.dialogue_source, source.dialogue_source);
    for (const cue of urdu.cues) {
      const texts = [...Object.values(cue.grid), ...Object.values(cue.representations).filter(Boolean)];
      assert.ok(texts.every(text => text!.split("\n").every(line => /^\[.*\p{Script=Arabic}.*\]$/u.test(line))));
    }
    assert.ok(urdu.dialogue?.every(cue => /\p{Script=Arabic}/u.test(cue.text)));
    const changed = structuredClone(source);
    changed.cues[0].start_s += 0.001;
    assert.equal(urduTrackFor(changed, sidecar), null);
    delete sidecar.sounds[source.cues[0].cue_id];
    assert.equal(urduTrackFor(source, sidecar), null);
    assert.deepEqual(selectViewerCaptionTrack(source, null, "ur", "personalized", false, false),
      { data: null, language: "ur", locked: false, unavailable: true });
    for (const [condition, original, study] of [["baseline", false, false], ["personalized", true, false], ["personalized", false, true]] as const) {
      assert.equal(selectViewerCaptionTrack(source, urdu, "ur", condition, original, study).data, source);
    }
    assert.equal(selectViewerCaptionTrack(source, urdu, "ur", "personalized", false, false).data, urdu);
  });
}

test("only verified, revealed recurrence links carry a stable label through detail and reading conditions", () => {
  const original = sourceFor("soar").cues[20];
  const cue = (id: string, start_s: number): CaptionCue => ({
    ...original, cue_id: id, start_s, end_s: start_s + 0.7, scene_load: "dense",
  });
  const cues = [cue("early", 0), cue("first", 2), cue("second", 5), cue("other", 9), cue("uncertain", 12)];
  const annotations: RecurrenceAnnotation[] = [
    { id: "fixture-bell", evidence: "Synthetic witnessed switch operation", status: "verified",
      occurrences: ["early", "first", "second"], revealFrom: 2, labels: { en: "Control switch", ur: "کنٹرول سوئچ" } },
    { id: "fixture-uncertain", evidence: "Same sound key alone", status: "draft",
      occurrences: ["other", "uncertain"], revealFrom: 0, labels: { en: "Same switch" } },
  ];
  const labels = verifiedRecurrenceLabels(cues, annotations, "en");
  assert.deepEqual([...labels], [["first", "Control switch"], ["second", "Control switch"]]);
  assert.equal(verifiedRecurrenceLabels(cues, annotations, "ur").get("second"), "کنٹرول سوئچ");
  for (const readingSpeed of [15, 17, 20] as const) {
    const profile = { ...DEFAULT_PROFILE, detail: 3 as const, readingSpeed };
    const fixed = resolveCaption(cues[1], profile, "personalized", false, .7, labels.get("first"));
    const adapted = resolveCaption(cues[2], { ...profile, adaptive: true }, "personalized", false, .7, labels.get("second"));
    assert.match(fixed.text, /^\[Control switch — /);
    assert.match(adapted.text, /^\[Control switch — /);
    assert.equal(fixed.detail, 3);
    assert.equal(adapted.detail, 1);
    assert.equal(adapted.adapted, true);
    assert.equal(resolveCaption(cues[1], profile, "baseline", false, .7, labels.get("first")).text, original.reference_text);
  }
});

test("past preview uses playback windows, preserves overlapping Urdu dialogue and excludes future cues", () => {
  const data = urduTrackFor(sourceFor("hair-love"), sidecarFor("hair-love"))!;
  const windows = resolveCaptionWindows(data, { ...DEFAULT_PROFILE, adaptive: true, detail: 3 }, "personalized");
  // This track has no natural overlap. Give one translated line synthetic timings.
  const overlapping = windows[1];
  const dialogue = [{ ...data.dialogue![0], start_s: overlapping.start_s - 0.1, end_s: overlapping.display_end_s + 1 }];
  assert.equal(pastCaptionTime(windows, dialogue, 0), undefined);
  assert.equal(pastCaptionTime([overlapping], [], overlapping.start_s - 0.001), undefined);
  const live = captionsAt(windows, dialogue, overlapping.start_s);
  assert.ok(live.sound.length && live.dialogue.length);
  const time = overlapping.display_end_s;
  const past = pastCaptionTime([overlapping], live.dialogue, time);
  assert.equal(past, overlapping.start_s);
  assert.deepEqual(captionsAt(windows, dialogue, past!), live);
});

test("personalized viewer never marks a longer wording as shortened", () => {
  const data = sourceFor("big-buck-bunny-controls");
  const cue = data.cues.find(item => item.cue_id === "bbb-sdh-004")!;
  const profile = { ...DEFAULT_PROFILE, adaptive: true, detail: 2 as const };
  const [actual] = resolveCaptionWindows({ ...data, cues: [cue] }, profile, "personalized", false, false, undefined, true);
  assert.equal(actual.caption.text, cue.grid["2-2"]);
  assert.equal(actual.caption.adapted, false);
  const [legacy] = resolveCaptionWindows({ ...data, cues: [cue] }, profile, "personalized");
  assert.equal(legacy.caption.text, cue.grid["1-2"]);
});
