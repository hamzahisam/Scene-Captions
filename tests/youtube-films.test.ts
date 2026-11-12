import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { videoSchema, DEFAULT_PROFILE, resolveCaption } from "../src/lib/captions.ts";
import { sourceAssistedTrackFor } from "../src/lib/source-captions.ts";
import { parseSrt } from "../src/lib/srt.ts";

for (const [id, count] of [["soar", 49], ["brain-divided", 18]] as const) {
  test(`${id}: full-film sound-caption variants retain the exported sources and disclosed reconstructed timing`, () => {
    const data = videoSchema.parse(JSON.parse(readFileSync(`data/source-assisted-captions/${id}.json`, "utf8")));
    const source = JSON.parse(readFileSync(`data/sources/youtube/${id}.json`, "utf8"));
    assert.ok(data.duration_seconds >= 300 && data.duration_seconds <= 420);
    assert.equal(data.cues.length, count);
    assert.deepEqual(data.cues.map(c => [c.cue_id, c.start_s, c.end_s, c.reference_text]), source.cues.map((c: {cue_id: string; start_s: number; end_s: number; reference_text: string}) => [c.cue_id, c.start_s, c.end_s, c.reference_text]));
    assert.match(data.generated_with.method, /not exact|not supplied/);
    assert.equal(data.annotation_status, "draft");
    assert.equal(data.generated_with.quality_gate, "unverified");
    assert.equal(data.generated_with.source_sha256, source.media.sha256, "Caption track binds the prepared MP4 bytes");
    assert.deepEqual(data.dialogue || [], source.dialogue);
    assert.ok(source.media.height >= 720);
    assert.equal(data.generated_with.caption_source?.sha256, source.transcript_sha256);
    assert.equal(data.generated_with.expression_method, "punctuation-only");
    assert.equal(data.generated_with.scene_load_method, "cue-density");
    assert.ok(data.cues.some(c => c.grid["1-1"] !== c.grid["3-1"]));
    for (const cue of data.cues) {
      for (const text of Object.values(cue.grid)) assert.equal(text.split("\n").length, cue.reference_text!.split("\n").length);
      assert.equal(resolveCaption(cue, {...DEFAULT_PROFILE, detail: 1}, "personalized").detail, 1);
      assert.equal(resolveCaption(cue, DEFAULT_PROFILE, "baseline").text, cue.reference_text);
    }
    assert.deepEqual(JSON.parse(readFileSync(`public/research/source-richness/${id}.json`, "utf8")), data);
    for (const d of [1, 2, 3]) {
      const srt = parseSrt(readFileSync(`public/research/source-richness/${id}-detail-${d}.srt`, "utf8"));
      assert.deepEqual(srt.map(c => [c.start_s, c.end_s, c.text]), data.cues.map(c => [c.start_s, c.end_s, c.grid[`${d}-2`]]));
    }
  });
}

test("BBB's enabled controls preserve its exact reference intervals and use disclosed wording/density methods", () => {
  const base = videoSchema.parse(JSON.parse(readFileSync("data/captions/big-buck-bunny.json", "utf8")));
  const data = sourceAssistedTrackFor(base, JSON.parse(readFileSync("data/source-assisted-captions/big-buck-bunny-controls.json", "utf8")));
  assert.equal(data.generated_with.expression_method, "punctuation-only");
  assert.equal(data.generated_with.scene_load_method, "cue-density");
  assert.ok(data.cues.some(c => c.scene_load === "dense"));
  assert.ok(data.cues.every(c => c.grid["2-1"] !== c.grid["2-3"]));
});

test("Hair Love keeps source sound/dialogue timing and three detail exports with song lyrics omitted", () => {
  const data = videoSchema.parse(JSON.parse(readFileSync("data/source-assisted-captions/hair-love.json", "utf8")));
  const source = JSON.parse(readFileSync("data/sources/youtube/hair-love.json", "utf8"));
  assert.ok(data.duration_seconds >= 300 && data.duration_seconds <= 420);
  assert.equal(data.cues.length, 15);
  assert.equal(data.dialogue?.length, 26);
  assert.deepEqual(data.dialogue, source.dialogue);
  assert.equal(data.generated_with.source_sha256, source.media.sha256);
  assert.equal(source.media.height, 720);
  assert.deepEqual(data.cues.map(c => [c.start_s, c.end_s, c.reference_text]), source.cues.map((c: {start_s: number; end_s: number; reference_text: string}) => [c.start_s, c.end_s, c.reference_text]));
  assert.equal(data.cues[1].start_s, 25.03);
  assert.equal(data.cues[1].end_s, 26.08);
  assert.equal(data.cues[6].start_s, 126.13);
  assert.equal(data.cues[6].end_s, 127.13);
  assert.match(data.dialogue![0].text, /^Angela:/);
  assert.ok(data.dialogue!.every(c => !c.text.includes("♪")));
  assert.equal(data.cues.at(-1)?.reference_text, "[Singing]");
  assert.equal(data.annotation_status, "draft");
  assert.equal(data.generated_with.quality_gate, "unverified");
  assert.equal(data.generated_with.expression_method, "punctuation-only");
  for (const cue of data.cues) {
    assert.notEqual(cue.grid["1-1"], cue.grid["3-1"]);
    for (const detail of [1, 2, 3] as const) for (const expression of [1, 2, 3] as const) {
      const resolved = resolveCaption(cue, {...DEFAULT_PROFILE, detail, expression}, "personalized");
      assert.ok(resolved.detail <= detail);
      assert.ok(resolved.text.startsWith("["));
    }
  }
  assert.deepEqual(JSON.parse(readFileSync("public/research/source-richness/hair-love.json", "utf8")), data);
  for (const d of [1, 2, 3]) {
    const srt = parseSrt(readFileSync(`public/research/source-richness/hair-love-detail-${d}.srt`, "utf8"));
    assert.deepEqual(srt.map(c => [c.start_s, c.end_s, c.text]), data.cues.map(c => [c.start_s, c.end_s, c.grid[`${d}-2`]]));
  }
});
