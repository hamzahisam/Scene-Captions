# CapTune procedure comparison · 12 November 2026

## Finding

SceneCaptions implements substantial parts of CapTune's interface and anchor
mathematics, but its installed sample is an adapted demonstration, not an exact
procedural reproduction. Complete cache coverage does not establish fidelity to
the paper's transformation process or evaluation.

This audit inspected current source, the preserved full-paper text at
`artifacts/captune-2026-11-03/paper.txt`, the local paper at
`docs/research/huang-2025-captune.pdf`, generation evidence and replication
materials. The public [paper](https://arxiv.org/html/2508.19971v1) was also opened.
No skill, agent, inference, installation or publication was used. Application
behavior and caption data were not changed. Working tree was clean before this
audit; inspected HEAD was `4fe7016`.

## What has been done

- `/creator` supports SRT/video import, detected NSI candidates, editable lower
  and upper examples, wording locks, metadata, context and configuration export.
- `/captune` provides the bounded 10×10 grid, four parameter controls, original
  comparison, prepared captions and preference-request export/import.
- `src/lib/captune/math.ts` implements the piecewise calibration and normalized
  position/change ratios from Equations 1–3. Prompt and result helpers support
  concrete anchors, current captions, context and cross-axis assessment.
- BBB has 87 source intervals and coverage for 800 settings each. Generation
  records describe NVIDIA drafts, 67 atomic source labels and substantial
  main-session editorial changes. This is source-assisted transformation of
  existing captions, not independent discovery of a full sound track.
- All 87 context windows were prepared. Historical evidence records 86 model
  descriptions and one failed request; descriptions remain unverified drafts.
- Creator/DHH session guidance exists. No study has been conducted.

## Material differences from the paper

| Paper requirement | Current evidence | Implication |
| --- | --- | --- |
| §4.2.1: original video/SRT, NSI list and cue-timestamp ±5-second audiovisual context described by VideoLLaMA2 | Import, list and clip rule exist; NVIDIA Omni supplies draft context | Context model differs and context correctness is unfinished |
| §4.2.2: GPT-4o estimates the original detail/expression baseline | NVIDIA estimated BBB at 5/4 | A model substitution; the paper's illustrative 3/2 is not a universal baseline to copy |
| §4.2.3: creator iteratively sets two concrete anchors using generated previews, cross-axis reassessment, editing and locks | Helpers and manual request/result round trip exist; sample anchor wording and selection bands are editorial | Interface availability is not evidence that the sample underwent the complete creator session/process |
| §4.3.3: requested values, relative position and change from current text guide GPT-4o with original, both anchors and scene context | `prompts.ts` supports this, but installed sample uses atomic palette lookup | Sample generation did not follow this per-transformation mechanism |
| §4.1: expression changes evocative language; sensory mode emphasizes acoustic characteristics; genre adjusts style | `curate-palettes.py` uses three detail bands, neutral wording for sensory/default, and expression punctuation; genre mainly enables selected imitations | Most consequential semantic fidelity gap; 800 selectable settings do not mean 800 distinct transformations |
| §§4.2–4.3: interactive generated previews, viewing-time transformation and conversational interpretation | Prepared playback and exported/imported requests | Interaction timing and language workflow differ |
| §§5–6: creator tasks followed by DHH hands-on viewing, think-aloud and interviews | Protocol drafted; no recruitment, sessions or transcripts | Evaluation is pending, not reproduced |
| §§5.2, 6.3: qualitative coding, including a second researcher's independent viewer-transcript coding and consensus | Agreement utility exists | A utility cannot supply actual independent coding or reproduce published findings |

The old three-level viewer at `/` is a separate demonstration. Use `/creator`
and `/captune` when assessing paper alignment. The README also retains older
proposal/status paragraphs that conflict with its newer opening section; those
historical paragraphs are not reliable descriptions of the current workflow.

## Procedure to follow next

1. **Resolve reproduction scope.** Earlier records explicitly retain NVIDIA-only
   preparation and no inference during viewing. A current clarification was
   requested because literal reproduction conflicts with those decisions. Keep
   these constraints until resolved; do not silently install models or enable
   cloud generation. Retaining them requires describing an adapted replication.
2. **Freeze a small stimulus and source track.** Record exact media/caption
   versions and provenance. Preserve source timings and distinguish NSI from
   dialogue. CapTune transforms existing captions; it does not require our
   separate arbitrary-video sound-discovery pipeline to work first.
3. **Complete audiovisual context (§4.2.1).** Extract cue-start ±5-second clips,
   use the specified joint audio/video description step, retain outputs and
   address failed/incorrect context before using it to support sound claims.
   Exact model matching requires VideoLLaMA2.1-7B-AV; a substitute is a deviation.
4. **Assess originals (§4.2.2).** Estimate both baseline axes with the selected
   model and retain the actual request/result. Do not copy illustrative baseline
   numbers from the paper or reuse BBB's baseline for a different track.
5. **Have a creator establish anchors (§4.2.3).** Starting from originals,
   iteratively transform, preview, reassess the other axis, edit, and lock where
   necessary. Finalize concrete lower/upper captions with their numeric values.
   Export originals, anchors, values, context and metadata (§4.2.4).
6. **Use the anchored transformation path (§4.3.3).** Supply current and original
   text, both examples, context, requested settings and both r/δ ratios. Retain
   prompts/results and creator corrections. Replace the punctuation/banded
   palette approximation for this replication. Caching itself is compatible
   with reuse of an output; generating a static banded palette is a different
   transformation method. Offline preparation remains a declared runtime change.
7. **Check the four controls on actual wording (§§4.1, 4.3).** Inspect meaningful
   changes in detail, expressiveness, sound representation and genre, bounds,
   locks and original fallback. The paper does not guarantee distinct outputs
   for every neighboring cell. Avoid inventing acoustic properties merely to
   make controls visibly different. Check listening/readability separately.
8. **Evaluate the creator workflow (§5).** The reported approximately 60-minute
   remote sessions began with two five-minute introductions/demonstrations,
   followed by lower-anchor, upper-anchor and export tasks on three clips,
   think-aloud and semi-structured interviews. Its seven creators are a reported
   sample, not our completed recruitment or a power calculation.
9. **Evaluate the viewer workflow (§6).** After appropriate approval/consent and
   accommodations, follow the approximately 90-minute demonstration, hands-on
   exploration of the same clips, think-aloud and interview structure. Its 12
   DHH participants are the authors' sample. Blender films differ from Kitbull,
   the dolphin documentary and Frozen used in the paper; substituted stimuli
   must be disclosed. The paper does not confer rights to those clips.
10. **Analyze real data (§§5.2, 6.3).** Follow creator open/axial/selective coding
    and viewer Applied Thematic Analysis. Arrange genuine second-researcher
    coding and consensus for the viewer analysis. Report our actual agreement,
    themes and limitations. Keep the separate long-form comprehension experiment
    out of claims of exact reproduction. The paper's formative online analysis
    (§3) is another distinct phase; its complete historical collection cannot
    be recreated from the published description alone.

Exact historical reproduction is limited by unspecified details and versioned
models/prompts. Match documented steps, record unavailable details and disclose
every substitution rather than claiming identity from matching equations/UI.

## Verification this session

Executed:

```sh
node --experimental-strip-types --test tests/captune.test.ts tests/captune-matrix.test.ts tests/captune-prepared-data.test.ts tests/captune-review.test.ts
```

Result: **20/20 pass**, including actual 69,600 cue/setting resolutions, math,
prompt fields, snapshot checks, locks and source-text receipts. No fresh browser,
build, listening, human semantic or participant checks were performed. Earlier
49-Node/48-Python/build/browser results remain historical evidence. Structural
maps and Fallow snapshots were not refreshed or used as current coverage proof.
