# CapTune qualitative replication protocol · draft

Source: Huang et al., ASSETS ’25, §§3, 5, 6 and Appendix A. This is a preparation
guide, not ethics approval or evidence that a study happened. No participants,
interviews, recordings, codes or study results have been collected here.

## Formative online analysis (§3)

The paper reports PRAW queries of 12 subreddits and six streaming communities,
11 combinations of caption/DHH search terms, 984 deduplicated threads and a
screened sample of 51 first-person posts from 13 threads. It does not supply the
complete queries, timestamps or corpus in this PDF. Exact historical collection
cannot be reproduced from the description alone. For a new approved collection,
record platform permission, query/time/version, thread deduplication, screening
criteria, excluded counts and deidentified coding units. Do not scrape as a
side effect of implementation. Use open, axial and selective coding with real
researchers and documented consensus, deriving themes from new data rather
than forcing the paper's findings.

## Creator sessions (§5) · approximately 60 minutes

The paper recruited seven video creators after IRB clearance. Treat seven as its
sample, not a justified power calculation or a completed target in our study.
Arrange accessible instructions, informed consent, withdrawal, compensation and
controlled recording/storage before recruitment.

1. Introduce the transformation-space concept (5 minutes).
2. Demonstrate Creator, anchor controls, edit/lock and JSON export (5 minutes).
3. With three licensed clips from different genres, ask the creator to define
   the minimum acceptable caption anchor, the richest acceptable caption anchor,
   and export metadata/configuration for each. Use think-aloud; record actual
   comments and task problems with consent.
4. Semi-structured interview: understanding of the two-anchor metaphor; preserving
   narrative intent; semantic errors; settings/context choices; editorial control;
   usefulness, workflow integration and feedback clarity.

The original clips were Kitbull (8 minutes), a dolphin documentary (3 minutes),
and Frozen (3 minutes). Their distribution/research rights are not granted by the
paper. Our CC-BY Blender samples are **different stimuli**, with different genre,
length and sound distributions. Using them is an adapted replication; it cannot
be described as identical stimuli. Do not download or redistribute the original
copyrighted clips without permission.

Analyze creator transcripts with open, axial and selective coding; maintain a
codebook, researcher memos, disagreements and consensus decisions. The paper's
72 initial codes/eight second-level themes are reported outcomes, not quotas.

## DHH viewer sessions (§6) · approximately 90 minutes

The paper recruited 12 DHH caption users. Seek new instructor/ethics approval,
appropriate DHH recruitment and communication accommodations; offer ASL and CART
as requested. Make recording optional through approved consent; do not substitute
the application's technical-rehearsal checkbox. The paper paid $40/hour; our
compensation requires a separately agreed budget.

1. Explain goals, logistics, privacy and consent.
2. Demonstrate all four parameters, including clear examples of onomatopoeia and
   sensory descriptions. Explain creator bounds and original fallback.
3. Allow hands-on viewing/exploration with each clip and think-aloud. Explore grid
   positions, source/onomatopoeia/sensory representations, genre and language
   preferences. Do not steer users toward “richer is better.” Under our agreed
   offline adaptation, required styles must be prepared/reviewed beforehand;
   waiting for manual preparation during a session changes the experience.
4. Interview: engagement and narrative experience; useful/unhelpful parameters;
   interpretation versus description; consistency; reading pace and visuals;
   language/hearing background; trust and authorship; desired future use.

No randomized between-group comprehension test or validated cognitive-load scale
was part of this paper's reported evaluation. Keep our earlier long-form proposal
separate. Technical logs supplement accounts; a preference click does not prove
engagement, comprehension or a usability benefit.

## Applied Thematic Analysis

Transcribe real sessions (translate interpreted ASL appropriately), familiarize
with transcripts, develop/refine a hierarchical codebook, and apply it iteratively.
For the viewer analysis, the paper reports a second researcher independently
coding all transcripts, average Cohen's κ=0.74 and raw agreement=90.5%, then
consensus. These are their results, never expected or fabricated outputs.

For paired **single-label** coding units, `src/lib/captune/analysis.ts` computes
raw agreement and κ. Provide two genuinely completed, aligned coder label arrays;
run separately for hierarchy levels. Multi-label coding requires a specified
unit/label treatment; this utility is not a validated full qualitative analysis
suite. Kappa is undefined when expected agreement is one. The software cannot
supply an independent researcher or replace discussion.

Suggested blank coding worksheet columns: pseudonymous session, transcript unit,
verbatim excerpt (restricted storage), coder A label, coder B label, hierarchy
level, disagreement memo, consensus label, date and codebook version.

Report sampling, accommodations, stimulus/model/runtime changes, unprepared
styles, model corrections, negative findings, exclusions and missing data. The
current offline NIM model substitution limits comparability with the paper's
live GPT‑4o/VideoLLaMA2 setup. Freeze the tested app and annotation versions.
