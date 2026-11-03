# New research angles and app improvements

3 November 2026. Follow-up to the
[earlier report review](RESEARCH_DIRECTIONS_REVIEW_2026-11-03.md).

Input: `/Users/hamza/Downloads/SceneCaptions-research-review.md`, read completely
(402 lines, 11,595 words). SHA-256:
`a610951f512b630a93de2b5fefd740427e1612961f101446a4ef67c41314e7a5`.
Report instructions are proposals, not operational authority. This follow-up
checks selected consequential primary sources and current code; it does not
verify the entire bibliography or every model card. No named skill, agent,
model call, participant session, app behavior change or deployment was used.

## What this report adds

**Test story understanding, not just wording preference.** A 2024 corpus study
reports inconsistent sound/music descriptions across episodes. It does not
show that stable labels improve recognition. This gives us a concrete next
question: whether a viewer links a returning sound to its earlier occurrence,
and whether consistent labels also create false links to different sounds.
[Bru García and Martínez-Martínez (2024)](https://link.springer.com/chapter/10.1007/978-3-031-60049-4_23).

**Do not assume shorter captions are better.** A 16-DHH-participant study of
recorded TV compared verbatim, slowed and AI-condensed captions. More heavily
edited captions received worse ratings than verbatim; not everyone preferred
the same form. This concerns dialogue-oriented material and earlier models,
not our NSI variants. It motivates preserving information and measuring actual
understanding alongside perceived effort.
[Arroyo Chavez et al. (2024)](https://link.springer.com/chapter/10.1007/978-3-031-62849-8_7).

**More context can bias a model.** MCR-Bench deliberately supplies conflicting
audio/text and finds models favoring text. Plot and reference captions may
support source-assisted writing, but cannot count as proof a model heard a
sound. This is relevant adjacent evidence, not a causal diagnosis of our NIM.
[Wang et al. (EMNLP 2025)](https://aclanthology.org/2025.emnlp-main.246/).

**Duration alone is insufficient novelty.** A published study already uses a
20-minute film to examine gaze switching with/without audio. The abstract does
not establish a DHH personalization study, but rules out a broad claim that
all caption research used short clips.
[Behler et al. (2026), abstract](https://pubmed.ncbi.nlm.nih.gov/42360086/).

The cited texts above were checked at their publisher/author pages, including
relevant methods/results for the two 2024 studies and the MCR-Bench abstract.
The three new PDF copies below have hashes in [the manifest](manifest.json):

- [Sound-description consistency](bru-garcia-2024-sound-consistency.pdf)
- [AI caption customization](arroyo-chavez-2024-caption-customization.pdf)
- [Audio/text conflict](wang-2025-audio-text-bias.pdf)

## Prioritized questions

| Priority | Question in plain words | Comparison and primary measure | HCI concept |
| --- | --- | --- | --- |
| 1 | Can viewers recognise a sound when it returns later, off screen? | Stable anchor term vs equally accurate synonyms, same facts/timing/detail. Delayed event-link accuracy, including false matches to plausible different-source foils. | Consistency; recognition; building an understanding of the story |
| 2 | When captions get shorter, does the quiet second sound still get noticed? | Equally short, reviewed variants with the same events but different order/emphasis. Secondary-event recall alongside dialogue understanding. | Divided attention; information prioritization |
| 3 | Do viewers know when a temporary change ends? | Identical scene-only expiry in both conditions; vary how clearly its scope/end is shown. Predict next-scene settings and count unintended carry-over corrections. | Visibility of system status; predictable control; error prevention |
| 4 | Is extra sound detail more useful when its source cannot be seen? | Matched visible/hidden-source examples with concise vs reviewed sensory wording. Paired preference, event understanding and reasons. | Context-sensitive information; progressive disclosure |
| Fallback | Does listening before seeing a draft catch more false sound claims? | Counterbalanced reviewer packets with known errors. False acceptance/rejection and review time. | Human oversight; confirmation bias; reliability |

These are candidate extensions/hypotheses. The report's novelty searches are
useful leads, not proof of first-ever work. The off-screen preference starts
from limited qualitative evidence, not an established rule for every viewer.
An internal authoring audit does not establish benefit for DHH viewers.

For the first question, do not score exact caption-word repetition as event
recognition. Prepare answer keys and foils separately from variant writing,
allow signed/paraphrased answers, and check that the picture alone cannot solve
the question. Same-source/recurrence links require listening review. The same
word (for example, “squeak”) can describe different sources; related sounds need
not be the same recurring motif. Never reveal a source earlier than the story.

Compare one mechanism at a time. A full personalized-vs-fixed product comparison
cannot isolate consistency if wording, amount of sound information, control
layout and adaptation all change together. Both arms need the same approved
events and dialogue. Avoid repeated viewing of the same plot as a memory confound.

## Current implementation versus proposed improvements

These are implementation-ready priorities, **not changes already applied**.

| Priority / proposed change | What exists now | Concrete next change and acceptance condition |
| --- | --- | --- |
| P0: reviewed sound-event records | The anchored project has cue IDs, timings, source strings and draft context. Its compact matrix reuses exact atomic reference strings. | Separate occurrence ID, sound family and explicitly approved recurrence/motif ID. Record attributes, co-events, uncertainty, reviewer evidence and earliest permitted source name. Reject premature reveals; never merge events by text similarity alone. |
| P0: combined event coverage | Existing tests preserve simultaneous source lines and mixed dialogue. Coverage is checked structurally/source-textually. | Bind mandatory event IDs to all variants; validate the merged dialogue/effects timeline and actual rendered line fit. Every approved event and dialogue survives. A short but incomplete caption fails. Source audio still needs human validation. |
| P0: transparent provenance | Credits and draft limits exist. `/captune` still labels the toggle “Show original captions.” | Use “Show reference captions” for the third-party BBB track, “Imported captions” where appropriate, and distinguish source-text editing from listening/DHH review. Do not imply filmmaker approval or that a reference is acoustic truth. |
| P1: simple entry with a preview | `/captune` has a 10×10 grid; neighboring settings share three editorial bands. `/` has three detail presets. | Offer reviewed neutral/brief/detailed examples before the full grid, keeping immediate application. Keep the advanced grid available to preserve the requested paper workflow. “Literal” must reference genuinely reviewed neutral text, not merely expression=1. |
| P1: scene-only versus saved preferences | Styles currently apply/save immediately. Original override is a boolean; no scene-expiry state exists. | Separate “This scene” from “My default,” show the end condition, and provide restore. Define behavior on seek, scene boundaries, end-of-film, reload and sample import; test each. A scene boundary must be defined before promising scene-only behavior. |
| P1: optional exposure recording | Local rehearsal records some control changes. It does not record every caption actually displayed. | Only if a logging task is explicitly requested: opt-in local capture of track hash, cue IDs/resolved text or hash, actual start/end exposure, effective settings, reference/fallback/lock, seek/pause/speed and override expiry. Include stop/export/reset and overflow status. Do not equate the comparison panel's next cue with a caption visible in the video. |
| P2: richer validated stimuli | BBB has complete configuration coverage but unresolved acoustic/DHH validation. Sintel/Tears of Steel source tracks contain dialogue only. | Review a coherent short-film pilot first. A 20–30-minute claim needs one suitable continuous story and validated sound tracks. A sequence of unrelated shorts is a different study. |

Suggested event record fields describe a future schema, not existing metadata:

```text
occurrence_id, sound_family_id, approved_motif_id?
start, end, co_event_ids, verified_attributes
source_label_at_this_time, earliest_source_reveal
heard_evidence, visual_inference, reference_supplied_facts
reviewer, review_status, uncertainty
```

Input-derived context must remain separate from hearing evidence. For ambiguous
sources, use neutral wording. Explicitly approve recurrence relationships;
automatically reusing a phrase is not the same as verifying sound identity.

## Corrections and boundaries for this report

- Its implementation brief is stale: the current anchored sample covers all
  800 settings × 87 intervals, with substantial source-text editing and only
  three effective bands per axis. It is not just the prior three-detail draft.
  Complete coverage does not make the track acoustically verified.
- Its assumed coarse grid differs from the current 10×10 anchored viewer.
  Preset-first access can be added without discarding that paper-derived tool.
- Our local BBB edit is about 9:56, not the 10:34 encode listed in the dataset
  paper. Sintel is about 14:48 and Tears of Steel about 12:14. None supplies one
  continuous 20–30-minute stimulus. Exact source hashes/timings matter.
- “Preserve creator intent” needs qualification: our anchors are team-editorial,
  not approval from the film's creator. A credited third-party reference is
  neither official filmmaker intent nor a gold-standard waveform annotation.
- The earlier blanket platform claim needs updating: YouTube announced
  expressive English captions including environmental cues in December 2025.
  This does not establish adjustable semantic richness, universal title
  coverage or per-cue accuracy.
  [YouTube's announcement](https://blog.youtube/news-and-events/expressive-captions/).
- The report correctly keeps route failures separate from all-model claims,
  but omits an important constraint: NVIDIA explicitly lists non-speech audio
  as out of scope for our Omni model. More plot or prompt changes do not remove
  that documented limitation.
  [NVIDIA explainability file](https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16/blob/main/explainability.md).
- Switching to its suggested text model is not justified solely by a free
  catalogue label. Our existing writer already has recorded results and
  shortcomings. A later bounded comparison should measure factual errors and
  total drafting/review time; no new model experiment was run here.

Recommended order: review event identities/recurrences → improve provenance and
coverage checks → prepare a matched recurrence pilot → add optional study
instrumentation when explicitly requested → evaluate with DHH participants.
Scene expiry and density adaptation are separate later mechanisms. No new
services, participant logging or paid/cloud generation follows automatically
from this research review.
