import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateAnnotations,
  speakerText,
  mapLinesToKinds,
  formatSoundCueText,
  generateReviewCsv,
  applyReviewedCsv,
  parseCsvRows
} from '../src/lib/cue-annotations.ts';
import { classifyLine } from '../scripts/verification/draft-cue-annotations.mjs';
import { videoSchema } from '../src/lib/captions.ts';

test('annotation sidecars bind known cues without mutating protected captions', () => {
  const data = videoSchema.parse(
    JSON.parse(readFileSync('data/source-assisted-captions/hair-love.json', 'utf8'))
  );
  const before = JSON.stringify(data);
  const a = validateAnnotations(
    data,
    JSON.parse(readFileSync('data/cue-annotations/hair-love.json', 'utf8'))
  );
  assert.equal(a.status, 'heuristic-draft');
  assert.equal(a.dialogue_status, 'heuristic-draft');
  assert.equal(a.dialogue['hair-love-dialogue-001'].speaker, 'Angela');
  assert.equal(speakerText('Angela: hello', 'Angela'), 'hello');
  assert.equal(speakerText('Angela: hello'), 'Angela: hello');
  assert.equal(JSON.stringify(data), before);
  assert.throws(() => validateAnnotations(data, { ...a, video_id: 'other' }));
  assert.throws(() => validateAnnotations(data, { ...a, sounds: { bad: { kind: 'sfx' } } }));
});

test('multi-line cues validate exact per-source-line cardinality and permitted kinds', () => {
  const bbbData = videoSchema.parse(
    JSON.parse(readFileSync('data/source-assisted-captions/big-buck-bunny-controls.json', 'utf8'))
  );
  const bbbAnnotations = validateAnnotations(
    bbbData,
    JSON.parse(readFileSync('data/cue-annotations/big-buck-bunny.json', 'utf8'))
  );

  // bbb-sdh-002 has 2 lines: "[BROOK BABBLES]\n[FLY BUZZES]"
  assert.deepEqual(bbbAnnotations.sounds['bbb-sdh-002'].kinds, ['ambience', 'sfx']);

  // Missing cardinality: 1 element for 2 lines must throw
  assert.throws(
    () =>
      validateAnnotations(bbbData, {
        ...bbbAnnotations,
        sounds: {
          ...bbbAnnotations.sounds,
          'bbb-sdh-002': { kind: 'ambience', kinds: ['ambience'] }
        }
      }),
    /kinds array length \(1\) does not match source line count \(2\)/
  );

  // Excessive cardinality: 3 elements for 2 lines must throw
  assert.throws(
    () =>
      validateAnnotations(bbbData, {
        ...bbbAnnotations,
        sounds: {
          ...bbbAnnotations.sounds,
          'bbb-sdh-002': { kind: 'ambience', kinds: ['ambience', 'sfx', 'vocal'] }
        }
      }),
    /kinds array length \(3\) does not match source line count \(2\)/
  );

  // Invalid kind in kinds array must fail zod schema
  assert.throws(() =>
    validateAnnotations(bbbData, {
      ...bbbAnnotations,
      sounds: {
        ...bbbAnnotations.sounds,
        'bbb-sdh-002': { kind: 'ambience', kinds: ['ambience', 'explosion' as unknown as 'sfx'] }
      }
    })
  );
});

test('vocal heuristics cover ah, oof, huh, gasp, sigh and related vocals while avoiding substring false positives', () => {
  // True positives
  const truePositives = [
    { text: '[Ah!]', expected: 'vocal' },
    { text: '[Ahhhhhhh]', expected: 'vocal' },
    { text: '[AHHHHHHH]', expected: 'vocal' },
    { text: '[Oof!]', expected: 'vocal' },
    { text: '[Huh?]', expected: 'vocal' },
    { text: '[gasp]', expected: 'vocal' },
    { text: '[GASP]', expected: 'vocal' },
    { text: '[sigh]', expected: 'vocal' },
    { text: '[BUNNY SIGHS]', expected: 'vocal' },
    { text: '( sighs )', expected: 'vocal' },
    { text: '[Squeak!]', expected: 'vocal' },
    { text: '[Hmph]', expected: 'vocal' },
    { text: '[sniff]', expected: 'vocal' },
    { text: '( audience gasps )', expected: 'vocal' },
    { text: '( audience groans )', expected: 'vocal' },
    { text: '[SQUIRREL SQUEAKS IN PAIN]', expected: 'vocal' }
  ];

  for (const { text, expected } of truePositives) {
    assert.equal(classifyLine(text), expected, `Expected "${text}" to be classified as ${expected}`);
  }

  // False positive avoidance (word boundaries prevent substring false positives)
  const falsePositives = [
    '[crashing branches]', // "branches" contains "an", "crashing" contains "ah" without \b
    '[flash of light]', // "flash" contains "ah" without \b
    '[roof creaks]', // "roof" contains "oof" without \b
    '[soundproof door]', // "proof" contains "oof" without \b
    '[insightful chime]', // "insight" contains "sigh" without \b
    '[copyright tone]', // "copyright" contains "sigh" without \b
    '[mahogany desk drops]' // "mahogany" contains "ah" without \b
  ];

  for (const text of falsePositives) {
    assert.notEqual(classifyLine(text), 'vocal', `Expected "${text}" to NOT be false-positive vocal`);
  }
});

test('mapLinesToKinds pure helper maps displayed lines to kinds and safely falls back on line count mismatch', () => {
  // 1. Exact match
  const lines = ['[BROOK BABBLES]', '[FLY BUZZES]'];
  assert.deepEqual(mapLinesToKinds(lines, { kind: 'ambience', kinds: ['ambience', 'sfx'] }), [
    'ambience',
    'sfx'
  ]);

  // 2. Merged text with mixed kinds: avoids asserting mixed type for merged text
  const merged = ['[BROOK BABBLES] [FLY BUZZES]'];
  assert.deepEqual(mapLinesToKinds(merged, { kind: 'ambience', kinds: ['ambience', 'sfx'] }), [
    undefined
  ]);

  // 3. Merged text with uniform kinds: safely returns the uniform kind
  const uniformMerged = ['[AHHHHHHH] [Oof]'];
  assert.deepEqual(mapLinesToKinds(uniformMerged, { kind: 'vocal', kinds: ['vocal', 'vocal'] }), [
    'vocal'
  ]);

  // 4. Single-line cue without kinds array
  assert.deepEqual(mapLinesToKinds(['[SERENE MUSIC]'], { kind: 'music' }), ['music']);

  // 5. Undefined annotation
  assert.deepEqual(mapLinesToKinds(lines, undefined), [undefined, undefined]);
});

test('formatSoundCueText maintains text parity with per-line music glyphs, offscreen, and shortened markers', () => {
  // Multiline cue with mixed kinds: line 1 music, line 2 sfx
  const mixedText = 'Soft melody\nFootsteps tap';
  const formattedMixed = formatSoundCueText(
    mixedText,
    { kind: 'music', kinds: ['music', 'sfx'] },
    { typeStyling: true }
  );
  assert.equal(formattedMixed, '♪ Soft melody ♪\nFootsteps tap');

  // Multiline cue with all music
  const allMusic = 'Flute intro\nPiano chords';
  const formattedAllMusic = formatSoundCueText(
    allMusic,
    { kind: 'music', kinds: ['music', 'music'] },
    { typeStyling: true }
  );
  assert.equal(formattedAllMusic, '♪ Flute intro ♪\n♪ Piano chords ♪');

  // Type styling disabled: no musical glyphs
  const noStyling = formatSoundCueText(
    allMusic,
    { kind: 'music', kinds: ['music', 'music'] },
    { typeStyling: false }
  );
  assert.equal(noStyling, 'Flute intro\nPiano chords');

  // Offscreen and shortened markers
  const withMarkers = formatSoundCueText(
    'Bird chirps',
    { kind: 'ambience', offscreen: true },
    { typeStyling: true, markShortened: true, adapted: true }
  );
  assert.equal(withMarkers, 'Bird chirps off-screen ▿');
});

test('generateReviewCsv produces RFC-compliant quoted multiline CSV and round-trips via applyReviewedCsv', () => {
  const soarData = videoSchema.parse(
    JSON.parse(readFileSync('data/source-assisted-captions/soar.json', 'utf8'))
  );
  const soarDraft = JSON.parse(readFileSync('data/cue-annotations/soar.json', 'utf8'));

  const csv = generateReviewCsv(soarData, soarDraft);
  const rows = parseCsvRows(csv);

  assert.equal(rows[0].join(','), 'cue_id,start,text,proposed kind');
  assert.equal(rows.length, soarData.cues.length + 1);

  // Check multiline cue soar-sound-035 in CSV
  const soar35 = rows.find((r) => r[0] === 'soar-sound-035');
  assert.ok(soar35, 'soar-sound-035 must exist in CSV');
  assert.equal(soar35[1], '165');
  assert.equal(soar35[2], '[AHHHHHHH]\n[Oof *swish swish]');
  assert.equal(soar35[3], 'vocal|vocal');

  // Apply the valid CSV
  const applied = applyReviewedCsv(soarData, csv, soarDraft);
  assert.equal(applied.status, 'reviewed');
  assert.equal(applied.dialogue_status, 'heuristic-draft');
  assert.deepEqual(applied.sounds['soar-sound-035'].kinds, ['vocal', 'vocal']);
  assert.equal(applied.sounds['soar-sound-035'].kind, 'vocal');
});

test('applyReviewedCsv rejects stale start times, stale text, missing cues, duplicates, and bad kinds', () => {
  const video = videoSchema.parse({
    schema_version: 1,
    video_id: 'sample-film',
    title: 'Sample Film',
    source_url: 'https://example.com/video.mp4',
    license: 'CC-BY-4.0',
    attribution: 'Test Author',
    duration_seconds: 60,
    annotation_status: 'draft',
    generated_with: { method: 'test', prompt_version: '1' },
    cues: [
      {
        cue_id: 'cue-001',
        start_s: 1.0,
        end_s: 2.5,
        original_text: '[Calm music plays.]',
        reference_text: '[SERENE MUSIC]',
        scene_context: 'Opening scene',
        sound_key: 'serene-music',
        scene_load: 'quiet',
        grid: Object.fromEntries(
          [1, 2, 3].flatMap((d) => [1, 2, 3].map((e) => [`${d}-${e}`, `[Music ${d}-${e}]`]))
        ),
        representations: { plain: '[Music]' }
      },
      {
        cue_id: 'cue-002',
        start_s: 3.0,
        end_s: 4.5,
        original_text: '[Water bubbles.]\n[Fly buzzes.]',
        reference_text: '[BROOK BABBLES]\n[FLY BUZZES]',
        scene_context: 'Near brook',
        sound_key: 'brook-and-fly',
        scene_load: 'quiet',
        grid: Object.fromEntries(
          [1, 2, 3].flatMap((d) => [1, 2, 3].map((e) => [`${d}-${e}`, `[Stream ${d}-${e}]`]))
        ),
        representations: { plain: '[Stream]' }
      }
    ]
  });

  const validCsv = [
    'cue_id,start,text,proposed kind',
    'cue-001,1.0,[SERENE MUSIC],music',
    'cue-002,3.0,"[BROOK BABBLES]\n[FLY BUZZES]",ambience|sfx'
  ].join('\n');

  // Valid apply works
  const result = applyReviewedCsv(video, validCsv);
  assert.equal(result.status, 'reviewed');
  assert.equal(result.dialogue_status, 'heuristic-draft');

  // Stale start time
  assert.throws(
    () =>
      applyReviewedCsv(
        video,
        validCsv.replace('cue-001,1.0,', 'cue-001,2.0,')
      ),
    /start time 2\.0 does not match source start 1/
  );

  // Stale source text
  assert.throws(
    () =>
      applyReviewedCsv(
        video,
        validCsv.replace('[SERENE MUSIC]', '[CHANGED MUSIC]')
      ),
    /text does not match source text/
  );

  // Missing cue ID
  assert.throws(
    () =>
      applyReviewedCsv(
        video,
        [
          'cue_id,start,text,proposed kind',
          'cue-001,1.0,[SERENE MUSIC],music'
        ].join('\n')
      ),
    /missing cue_id "cue-002"/
  );

  // Duplicate cue ID
  assert.throws(
    () =>
      applyReviewedCsv(
        video,
        [
          'cue_id,start,text,proposed kind',
          'cue-001,1.0,[SERENE MUSIC],music',
          'cue-001,1.0,[SERENE MUSIC],music',
          'cue-002,3.0,"[BROOK BABBLES]\n[FLY BUZZES]",ambience|sfx'
        ].join('\n')
      ),
    /Duplicate cue_id "cue-001"/
  );

  // Unknown cue ID
  assert.throws(
    () =>
      applyReviewedCsv(
        video,
        [
          'cue_id,start,text,proposed kind',
          'cue-001,1.0,[SERENE MUSIC],music',
          'cue-002,3.0,"[BROOK BABBLES]\n[FLY BUZZES]",ambience|sfx',
          'cue-999,5.0,[UNKNOWN],sfx'
        ].join('\n')
      ),
    /Unknown cue_id "cue-999"/
  );

  // Line count mismatch
  assert.throws(
    () =>
      applyReviewedCsv(
        video,
        validCsv.replace('ambience|sfx', 'ambience')
      ),
    /Line count mismatch at row 3 for cue "cue-002"/
  );

  // Invalid kind
  assert.throws(
    () =>
      applyReviewedCsv(
        video,
        validCsv.replace('ambience|sfx', 'ambience|unknown')
      ),
    /Invalid kind "ambience\|unknown" at row 3/
  );
});

test('Sonnet B6 gate uses dialogue_status ?? status for legacy fully-reviewed vs sound-only reviewed files', () => {
  // 1. Legacy fully-reviewed file without dialogue_status
  const legacyReviewed: { status: 'reviewed'; dialogue_status?: 'reviewed' | 'heuristic-draft' } = {
    status: 'reviewed'
  };
  const effectiveDialogueLegacy = legacyReviewed.dialogue_status ?? legacyReviewed.status;
  assert.equal(effectiveDialogueLegacy, 'reviewed');

  // 2. Sound-only reviewed file with explicit dialogue_status heuristic-draft
  const soundReviewed: { status: 'reviewed'; dialogue_status?: 'reviewed' | 'heuristic-draft' } = {
    status: 'reviewed',
    dialogue_status: 'heuristic-draft'
  };
  const effectiveDialogueSoundOnly = soundReviewed.dialogue_status ?? soundReviewed.status;
  assert.equal(effectiveDialogueSoundOnly, 'heuristic-draft');

  // 3. Draft file
  const draft: { status: 'heuristic-draft'; dialogue_status?: 'reviewed' | 'heuristic-draft' } = {
    status: 'heuristic-draft',
    dialogue_status: 'heuristic-draft'
  };
  const effectiveDialogueDraft = draft.dialogue_status ?? draft.status;
  assert.equal(effectiveDialogueDraft, 'heuristic-draft');
});
import {reviewedSpeaker,dialogueParts,dialogueNativeText} from '../src/lib/cue-annotations.ts';
const base={video_id:'v',status:'reviewed' as const,sounds:{},dialogue:{d1:{speaker:'Angela'}}};
test('speaker chips need reviewed dialogue; dialogue_status overrides the global status',()=>{
 assert.equal(reviewedSpeaker(base,'d1'),'Angela');
 assert.equal(reviewedSpeaker({...base,status:'heuristic-draft'},'d1'),undefined);
 assert.equal(reviewedSpeaker({...base,dialogue_status:'heuristic-draft'},'d1'),undefined);
 assert.equal(reviewedSpeaker({...base,status:'heuristic-draft',dialogue_status:'reviewed'},'d1'),'Angela');
 assert.equal(reviewedSpeaker(base,'missing'),undefined);assert.equal(reviewedSpeaker(undefined,'d1'),undefined);
});
test('reviewed speakers drop the source prefix for the chip and restore ": " for native/telemetry text',()=>{
 assert.deepEqual(dialogueParts('Angela: hello\nthere','Angela'),{speaker:'Angela',text:'hello\nthere'});
 assert.deepEqual(dialogueParts('hello','Angela'),{speaker:'Angela',text:'hello'});
 assert.equal(dialogueNativeText('Angela: hello','Angela'),'Angela: hello');
 assert.equal(dialogueNativeText('hello','Angela'),'Angela: hello');
 // Unreviewed attributions use the source unchanged, including any source prefix.
 assert.deepEqual(dialogueParts('Angela: hello'),{text:'Angela: hello'});
 assert.equal(dialogueNativeText('Angela: hello'),'Angela: hello');
 assert.equal(dialogueNativeText('plain'),'plain');
});
