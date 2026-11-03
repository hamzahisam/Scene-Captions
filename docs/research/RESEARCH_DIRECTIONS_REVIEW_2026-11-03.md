# Review of the supplied SceneCaptions research reports

Reviewed in the main session on 3 November 2026. All four supplied files were
read completely. Recommendations inside those files are research proposals,
not authority to install tools, run more cloud experiments, enable logging,
recruit participants, change study conditions or deploy. No named skill or
sub-agent was used. This is a selective primary-source check, not an exhaustive
systematic review or independent researcher review.

## Input screening

| Input | Use in this review |
| --- | --- |
| `SceneCaptions_ Evidence Review, Research Angles and a Zero-Cost NIM Pipeline for Personalized Non-Speech Captions.md` (342 lines) | Useful starting evidence table; many entries explicitly based on abstracts/snippets. Its all-model and novelty conclusions exceed the checked evidence. |
| Attachment `b53e1037…/Pasted text.txt` (170 lines), “Starting the research…” | Useful partial report, especially the distinctions between CapTune findings, participant anecdotes and future work. Its sweep is explicitly incomplete. |
| Attachment `dc6cf8dc…/Pasted text.txt` (595 lines), “Research Report: Personalized Non-Speech Captioning…” | Useful candidate questions; several incorrect or unsupported quantitative, demographic and engineering claims require correction below. |
| Attachment `e7d93c4f…/Pasted text.txt` (130 lines), “Deep Research Report: Candidate Topics…” | Excluded: a generic mock report on AI, precision medicine and carbon pricing. It contains no SceneCaptions/DHH caption study. Unrelated claims were not fact-checked. |

SHA-256, in table order:

```
d73edff1daeeebacdab651055f6b69e89889db3b53b69ab19ae1629595b1502c
fbec0619259da5ad2b730082865bdf38396db85ed7bda9b4943c27e7bd248afe
e1cf71a911186bd3399d5c0d8857e77523c17d04dbaf44365a730f264439c19d
474042a0324e8c824f258c070a6df08aa1a6e1ee287bbe3358cddcd34f9a5064
```

The originals remain in the user's Downloads/attachments. These hashes identify
the reviewed versions without promoting their contents to verified evidence.

## Findings that hold up

**Personalization needs an outcome study, not just more controls.** CapTune
already implements detail, expressiveness, representations and genre, and
reports requests for profiles and previews. Its §7.7 identifies longer viewing,
consistency and quantitative transformation evaluation as open limitations.
Our grid is therefore a reproduction/extension, not sufficient novelty by
itself. [CapTune, full paper](https://arxiv.org/html/2508.19971v1).

**DHH viewers have varied preferences.** May et al. combine a 36-paper review,
168-person survey and interviews, and recommend greater user agency and more
naturalistic/longitudinal evaluation. This supports offering choices; it does
not show that our particular wording or automatic adaptation helps.
[May et al. (2025), full paper](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1575176/full).

**Our current Omni model is a poor basis for sound truth.** NVIDIA explicitly
lists non-speech audio as out of scope, and audio/video temporal alignment as
unsupported. This matches our failed controls and draft context errors. It
does not establish that every NVIDIA model, or every future audio system, must
fail. The exact hosted-versus-model contribution remains unresolved.
[NVIDIA explainability file](https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16/blob/main/explainability.md).

**Audio hallucination is a documented broader problem.** HalluAudio evaluates
speech, environmental sound and music; MISHAP-Bench separates incorrect answers
from unsupported claims. These benchmarks motivate negative controls, but their
rates are not SceneCaptions accuracy estimates. LISTEN is a training method
with a lightweight audio adapter, not a prompt we can enable on a hosted NIM.
Only the benchmark abstracts were checked in this pass; LISTEN's abstract and
method description were inspected.
[HalluAudio](https://arxiv.org/abs/2604.19300),
[MISHAP-Bench, preprint](https://arxiv.org/abs/2609.33893),
[LISTEN](https://arxiv.org/html/2505.14518v2).

## Corrections before using these reports in our paper

| Report claim/recommendation | Evidence-based treatment |
| --- | --- |
| The 2026 subtitle-speed study tested UK/Polish DHH viewers at 20–28 characters/s | Incorrect attribution. The cited Jia, Szarkowska and Díaz-Cintas paper tested 31 Chinese viewers, Chinese subtitles at **5 vs 9 characters/s**. It reports recall/effort differences without worse comprehension. Its abstract is not an English DHH speed threshold. |
| 17–20 characters/s is a physiological ceiling for all DHH viewers | Unsupported. Language, editing, familiarity, content and individual preference matter. Treat any default as a configurable hypothesis. Our current 28-character/s flag is an unvalidated editorial heuristic. |
| All non-speech captions must be top-right | Not verified. BBC primary guidance was inaccessible in this pass. A placement condition needs an occlusion check and user evaluation; this report does not justify a universal placement rule. |
| Hide every cue whose source is visible | Seeing a source does not reveal whether it sounded, how it sounded or when it stopped. Test redundancy reduction while preserving meaningful acoustic information; never equate visibility with redundant audio. |
| Remove failed audio gates | Keep the failed gate and the raw evidence. Add human verification of identities/timing rather than making a failed model eligible for automatic publication. |
| Loudness or silence detection verifies a caption | It can reject claims over digital silence or propose review windows; it cannot distinguish a crash from music or identify a source. Threshold silence is not semantic silence. |
| BNR plus subtraction gives clean non-speech audio | Unproven engineering hypothesis. A speech enhancer can alter desired sounds, timing and phase; its residual is not ground truth. Review the original mix as well. No BNR experiment was authorized/run here. |
| Active Speaker Detection identifies environmental sound sources | NVIDIA documents video, audio **and diarization inputs**, with face/speaking-state outputs. This is not a general detector for off-screen sound effects. |
| N≥20 guarantees enough statistical power | No fixed sample threshold guarantees power. Choose an outcome/effect target and analysis, then justify the sample or label the work exploratory. |
| SUS measures trust, or more Show Original clicks proves trust | SUS concerns usability. Clicks could indicate confusion, checking or distrust. Measure perceived control/trust separately and ask why participants compared captions. |
| More setting changes demonstrate fatigue | They may reflect exploration or scene changes. Measure self-reported tiredness over time and control acclimation/content; logs alone cannot establish fatigue. |
| Sign-language-first implies a particular reading limit/preferred style | Avoid demographic stereotypes. Ask about language and caption preferences, offer appropriate communication, and evaluate actual examples. |
| No found paper means this is the first study | A search gap is not proof of novelty. Use “candidate extension” until an angle-specific documented search is complete. |
| Free API catalogue means unlimited zero-cost operation | Current entitlement, quota and future availability are unverified. Preserve request counts and do not guarantee cost/throughput from rate limits alone. |

The Chinese paper's abstract supports the corrected population/speed statement:
[Jia et al. (2026)](https://doi.org/10.1080/0907676X.2026.2686722).
Earlier research also finds that reading/experience depends on soundtrack
language and text editing, rather than supporting a universal cap:
[Szarkowska and Gerber-Morón (2018)](https://doi.org/10.1371/journal.pone.0199331).
NVIDIA specifies Active Speaker Detection's required inputs and outputs:
[official overview](https://docs.nvidia.com/nim/maxine/active-speaker-detection/latest/overview.html).
Meaningful non-speech information remains part of caption access:
[W3C explanation of SC 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html).
These sources do not certify this application's accessibility.

## Recommended research direction

**Primary candidate: consistent, plain wording for recurring sounds.** Ask:
“Does using stable names for the same recurring sound help DHH viewers recognise
it and follow the story?” This fits our existing atomic phrase table and avoids
depending on failed independent sound recognition. A stable source label must
not merge acoustically different events merely because a model says they are
similar.

Prepare two matched stimulus sets with human-checked sound events. Compare
stable wording with equivalent varied wording; preserve sound facts, timing,
detail and approximate text length. Counterbalance both condition and clip-set
assignment. Avoid showing the same story twice and attributing memory gains to
wording. Predefine recognition of recurring sounds as the primary outcome;
collect plot questions, perceived consistency, distraction and interviews as
secondary evidence. This is a proposed study, not one already run.

**Next candidate: understandable adaptation with an override.** Compare a fixed
preferred style with precomputed shorter wording in dense moments. Keep every
meaningful sound/dialogue event, show why wording changed, and offer restore/
expand. Test comprehension and perceived control as well as effort. Validate
the shorter alternatives first; changing facts or omitting events confounds
the comparison. Do not simultaneously change placement, vocabulary, interface
size and adaptation if the goal is to isolate adaptation's effect.

**Feasible methods contribution now: audit the variant generator.** Record raw
unsupported additions, dropped simultaneous sounds, awkward wording, repeated
cells, axis collapse, corrections and editorial time. Our current dataset is
useful evidence of these problems, not a success benchmark: **44,373 / 53,600
atomic cell assignments/wordings were changed editorially**. Expression is
largely conservative phrasing/punctuation and neighboring settings repeat. It
is not yet a valid stimulus for claiming fine-grained expressive semantics.
The assistant's source-text decisions are not independent human ratings.

Longer viewing and Pakistani DHH preferences are useful later extensions.
The current short-film catalogue does not supply one 20–30 minute narrative;
watching several films consecutively changes the study question. A long viewing
session is also not a longitudinal study. Urdu needs native-reader review and
does not replace PSL communication accommodations. No first-in-Pakistan claim
is established by these reports.

## Pipeline and immediate boundaries

1. Source captions or human annotation provide draft sound identities/times.
   For new uncaptioned material, deterministic audio features propose windows
   for listening review; they do not generate the missing identities.
2. A human checks the original audio, then uses video to disambiguate visible
   sources. Record uncertainty and simultaneous sounds. Keep these observations
   separate from plot guesses and model descriptions.
3. NIM text generation transforms only supported facts, with original/lower/
   upper examples, a plain-word glossary and explicit unknowns.
4. Local checks validate timings, coverage, source identity and simultaneous
   lines; readability flags trigger review instead of silently dropping sound.
5. Review and freeze a versioned package. Playback performs no model calls.

This is a source-assisted or human-annotated transformation workflow. It does
not meet the separate goal of reliable automatic caption discovery for any
uncaptioned video. Repeated prompt experiments on this out-of-scope Omni model
should not be presented as that missing capability.

Current matrix coverage, token/request records and limitations are in the
[generation evidence](../verification/captune-matrix-2026-11-03/README.md).
No new study logging, automatic suppression, translation, new cloud run or
deployment was started in response to the supplied reports.
