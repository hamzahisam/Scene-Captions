# SceneCaptions research questions

Consolidated on 3 November 2026 from the earlier discussion and supplied research reports. Overlapping ideas have been merged into **43 questions**.

- **Revalidation:** check whether earlier reported findings or preferences hold for our viewers.
- **Extension:** test an existing idea in a different setting, population or duration.
- **Candidate new:** a specific comparison that may offer a contribution; novelty still needs checking.

These are proposed questions, not completed studies or demonstrated benefits. Some technical pipeline questions have preliminary test evidence; those results do not establish benefits for DHH viewers. Listing a question does not authorize experiments, model calls, participant logging or deployment.

## Earlier findings needing revalidation

These mainly follow reported preferences in [CapTune](https://arxiv.org/abs/2508.19971) and [“Choices? That’s the dream”](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1575176/full). Many findings came from interviews, rather than controlled comparisons.

| # | Research question |
| --- | --- |
| 1 | Do dense or fast captions pull viewers’ attention away from the picture? |
| 2 | Do viewers find a 10×10 customization grid difficult to understand or navigate? |
| 3 | Do viewers want to preview actual wording before choosing a caption style? |
| 4 | Do viewers want their caption preferences remembered across videos? |
| 5 | Do viewers prefer source descriptions, sound imitations such as “bang,” or descriptions of sound qualities? |
| 6 | Do viewers want more detail when the sound’s source is off screen? |
| 7 | Are captions repeating clearly visible actions distracting, or do they still provide useful sound information? |
| 8 | For sounds and music, do viewers prefer factual qualities or emotional/figurative wording? |
| 9 | How widely does the desired amount of sound information vary—from essential clues to nearly every sound? |
| 10 | Do caption authors find concrete examples, boundaries and wording locks useful for controlling AI edits? |

## More specific comparisons: candidate new contributions

| # | Research question |
| --- | --- |
| 11 | **Does consistent wording help viewers recognise a sound when it returns later, without confusing different sounds?** |
| 12 | **When captions become shorter, does preserving and foregrounding a quiet secondary sound improve story understanding?** |
| 13 | **Does clearly showing when a temporary setting expires prevent unintended changes carrying into later scenes?** |
| 14 | Does explaining why captions changed improve understanding and perceived control over automatic adaptation? |
| 15 | How does access to reference-caption comparison affect trust, confidence and recovery from confusing generated wording? |

Question 11 builds on documented wording inconsistency; the benefit to viewers still needs testing. [Sound-caption consistency study](https://link.springer.com/chapter/10.1007/978-3-031-60049-4_23).

## Older and newer ideas needing extension studies

| # | Research question |
| --- | --- |
| 16 | Do personalized captions improve understanding, comfort and control compared with a fixed caption track containing the same sound information? |
| 17 | Does automatic shortening during dense moments work better than keeping the viewer’s chosen detail level fixed? |
| 18 | Does stable wording for recurring sounds improve perceived consistency without making captions feel repetitive or less rich? |
| 19 | Do preferred detail and expressiveness change as a story progresses? |
| 20 | Does reading become more tiring during longer viewing, even when caption accuracy stays the same? |
| 21 | Does a saved profile still fit a second film or a different genre? |
| 22 | Do scene-specific adjustments work better than one global profile for the entire film? |
| 23 | Do presets or coarser controls reduce setup effort compared with a fine grid—and can viewers distinguish the available styles? |
| 24 | Do genre-based starting presets reduce the work needed to find suitable settings? |
| 25 | Does literal wording with optional expressive detail work better than showing expressive wording continuously? |
| 26 | Does separating sound captions from dialogue improve readability compared with combining them in one caption area? |
| 27 | Does placing captions near a visible sound source help identification, or cause distraction and picture obstruction? |
| 28 | Are short sound imitations useful during rapid or overlapping events compared with descriptive phrases? |
| 29 | Do sound imitations become easier to understand as viewers learn a film’s caption vocabulary? |
| 30 | What reading pace is comfortable at different richness levels, languages and amounts of dialogue overlap? |
| 31 | Do Urdu or English sound captions provide better understanding and preferred wording for particular viewers and cues? |
| 32 | Does translating expressive captions between English and Urdu preserve their meaning and emotional tone? |
| 33 | Does simpler vocabulary improve understanding while preserving the same sound details? |
| 34 | How do preferences vary with language background, caption habits, hearing history and hearing-device use? |
| 35 | How do hearing and DHH people sharing a screen negotiate different caption preferences? |

## Caption-generation and reliability research

These concern the authoring pipeline. They can produce useful engineering evidence, but do not by themselves establish benefits for DHH viewers.

| # | Research question |
| --- | --- |
| 36 | How reliably does the tested NVIDIA route distinguish silence, tones, speech, individual effects and overlapping sounds? |
| 37 | Can plot, reference captions or visual context bias a model toward sounds unsupported by the audio? |
| 38 | Can speech transcription, sound-event proposals and timestamp-matched frames improve captions without existing subtitles? |
| 39 | What errors occur when models generate richness variants: invented details, missing sounds, awkward wording or indistinguishable styles? |
| 40 | Which prompts and constraints reduce factual errors and total editing time compared with manual authoring? |
| 41 | Does listening before seeing the draft caption catch more errors than reviewing the caption first? |
| 42 | Do silence/energy thresholds and chunk boundaries miss quiet, overlapping or boundary-spanning events? |
| 43 | Which checks—local rules, model criticism and human review—best catch omissions, unsupported attributes and timing errors? |

## Suggested shortlist

- **Questions 11, 12 and 13:** focused candidate contributions about recognition, preserving story clues and predictable controls.
- **Question 6:** a smaller viewer pilot on off-screen sound detail.
- **Questions 39–41:** an authoring-reliability study if participant recruitment is limited; it does not demonstrate DHH benefit.

Choose one primary question for a study. Preserve matched sound facts, timing and dialogue across conditions; avoid changing several mechanisms at once. Candidate novelty and proposed benefits require further verification.

## Related reviews

- [Earlier evidence review](RESEARCH_DIRECTIONS_REVIEW_2026-11-03.md)
- [New research angles and proposed app improvements](RESEARCH_ANGLES_AND_APP_IMPROVEMENTS_2026-11-03.md)
