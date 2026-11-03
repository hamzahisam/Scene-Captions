# BBB matrix generation and source-text review · 3 November 2026

After the user replaced the key, NVIDIA generation succeeded. `/creator` and
`/captune` now load a hash-bound compact BBB matrix. All configuration
combinations have output; acoustic/DHH validation and semantic quality remain
separate, unfinished questions. The earlier `/` viewer is unchanged.

| Item | Recorded result |
| --- | --- |
| Coverage | 800 settings × 87 source intervals: 69,513 generated-and-edited + 87 original-baseline combinations, zero missing |
| Atomic sounds | 67 source labels; simultaneous sounds remain separate lines |
| Baseline | NVIDIA-assessed detail 5 / expression 4; a model estimate |
| Editorial review | Main-session assistant; all atomic phrases and 1,317 exact cue/text/context groups |
| Corrections | 44,373 / 53,600 atomic cell assignments/wordings changed editorially |
| Effective granularity | Detail bands 1–3 / 4–6 / 7–10; expression bands 1–3 / 4–7 / 8–10 |
| Reading flags | 10,568 cue/settings exceed the unvalidated 28-character/s editing heuristic; many repeated phrases |
| Unfinished validation | Full listening, original-creator approval, independent human ratings and DHH evaluation |

Neighboring settings repeat. Expression mainly changes conservative phrasing
and punctuation; animation styling can select approved conventional imitations.
Sensory wording adds no unverified acoustic qualities. This is **not 800
distinct semantic styles**, untouched model output, the paper's exact generation
engine or successful sound discovery from uncaptioned video. The failed
independent audio gate remains failed.

## Preparation and evidence

1. All 87 cue-start ±5s audiovisual clips pass manifest/hash/stream checks
   below. These are file/timing checks, not listening validation.
2. The [new baseline](requests/baseline-v1-attempt-02.json) completed after the
   key update. Initial HTTP403 records remain intact below.
3. [Full context run](context-full.json): 86 completions, one HTTP422 screening
   rejection. Unsupported scene/sound claims keep every completion a draft.
4. Palette pilots v1–v7 tested vocabulary constraints, indexed maps, rectangles
   and reasoning. Errors included invented traits, awkward grammar and collapsed
   axes. A medium-reasoning pilot took about 151 seconds; RPM is not throughput.
5. Full v9 generation requested all 67 labels with Ultra; one timeout was
   replaced by a recorded Super VL completion. Prompts included original source
   labels, prior source-guided meanings, examples, allowed words and explicitly
   unverified related context. This is source-assisted work.
6. Read all unique phrases against source facts and wrote
   [editorial decisions](editorial-decisions.json). Rejected unsupported music/
   wind imitations, fixed grammar/confusions and remapped flat selections into
   declared bands. [Change summary](editorial-change-summary.json) and
   [approved palettes](approved-palettes.json) preserve the corrections.
7. `scripts/captune/install-matrix.ts` binds approved inputs to the exact project
   and validates the [complete source-text receipt](final-source-text-review.json).
   Atomic approvals transfer to exact separate-line compositions. This is
   main-session editorial review, not independent human or acoustic review.

The server dataset and public project export are byte-identical. Use **Open
prepared sample** to replace an older locally saved project. Lock/manual
overrides preserve the matrix; source anchors, context, baseline and boundary
changes invalidate it. Data/model keys never enter viewing code.

## Usage and technical checks

[Request accounting](request-summary.json): **166 recorded requests**, counting
the context pilot subset once: 162 HTTP200, two earlier HTTP403, one timeout,
one HTTP422. Responses reporting usage total **489,984 tokens** (407,996 prompt,
81,988 completion). This includes pilots, baseline/anchor and context work.
Free entitlement, remaining quota and charges were not verified. No API key,
authorization header or media base64 is stored in evidence.

**49 Node and 48 offline Python tests pass**, along with type checking and the
production build. Real-data tests resolve every one of 69,600 cue/settings and
check coverage, bindings, locks, originals and simultaneous sounds. Browser
checks pass for actual overlays, eight mode/genre profiles, immediate choices,
keyboard grid, saved profiles, 87-interval SRT, original comparison, creator
locks/cache invalidation/sample restore, imports/exports, mixed dialogue,
bounds, quota warning and 390 CSS-pixel layout. No page errors or viewing-time
model requests. The earlier three-level viewer regression also passes.
Compact results are saved here; logs/screenshots remain in
`artifacts/captune-matrix-2026-11-03/`. These are technical/source-text checks,
not an accuracy score, accessibility certification or evidence of DHH benefit.

No named skills, agents, installations, paid provider, participant study, push
or deployment. Temporary local test serving was stopped after verification.
The [supplied-report review](../../research/RESEARCH_DIRECTIONS_REVIEW_2026-11-03.md)
records research proposals separately from product requirements.

## Historical record: initial authorization failure

The user explicitly requested generation and review of the remaining caption-style
matrix on NVIDIA NIM, preserving the paper-derived workflow and precomputed viewing.

Two requests were made:

| Request | Model | Result |
| --- | --- | --- |
| Original-caption baseline assessment | Nemotron 3 Ultra 550B A55B | HTTP 403, Authorization failed |
| Tiny independent-of-media text-only authorization control | Nemotron 3.5 Super VL 120B A12B | HTTP 403, Authorization failed |

[Baseline request/response](requests/baseline-v1.json) ·
[Text-only control](requests/authorization-text-control-v1.json).
The control was designed/performed in the same main session; it is not an
independent researcher review. The failure occurs before a model completion;
it is not evidence of bad caption-model capabilities or a caption prompt failure.

The private loader reads the single NVIDIA_API_KEY in local .env. No environment
variable overrides it; its prefix/whitespace format checks pass. No key value or
authorization header was printed or stored. We cannot distinguish an inactive
key from an account/authorization restriction solely from this error. An active
replacement NVIDIA API Catalog key was requested. No paid fallback or repeated
authentication retries were used. **No new captions were generated or installed.**

## Work completed while waiting

- All **87 context clips** were extracted around each original cue's start ±5s,
  clamped to the film, preserving audio/video and the source movie. Every clip
  file hash matches its [manifest](context-manifest.json). Clips stay ignored
  locally, under `artifacts/captune-matrix-2026-11-03/context/`.
- [FFprobe/hash/window checks](context-checks.json) pass for all 87. Maximum
  container-duration deviation is 36.655 ms from derived encoding. No listening
  or audiovisual-description correctness is claimed.
- [Protocol/coverage](protocol.json): 800 potential settings per cue. Across 87
  cues, 261 prior generated combinations plus 87 original-baseline combinations
  are present; **69,252 remain unprepared**. Do not relabel the previous three
  drafts as a complete generated matrix.
- `scripts/captune/review.ts` creates a pending source-text review packet grouped
  by exact original/anchors/context/text. Every generated combination must be
  covered, and all groups must have explicit review checks and notes. Missing,
  duplicate or stale reviews fail validation. Reading-rate flags remain an
  unvalidated editing heuristic, not a DHH reading-speed limit.
- Review acceptance means declared source-text editorial review only; it does
  not attest audio accuracy, original creator approval, independent review or
  a participant study. The generated pending packet is an ignored artifact.
- **42 Node tests** pass, including incomplete/snapshot-bound review receipts;
  [type checking](typecheck.txt) passes. No app rendering code changed in this
  follow-up, so the previous browser/build checks were not rerun or relabeled.

## Resume after authentication is restored

```sh
/Users/hamza/runtimes/scenecaptions-nim-asr/bin/python \
  scripts/captune/matrix.py --stage baseline --retry-failed
```

This makes a new explicit attempt while preserving the initial failed request.
A successful baseline is required before model-based anchor calibration and
large matrix generation. Check audiovisual context rather than treating the
known unreliable Omni descriptions as verified sound evidence. The full review
and real participant study remain unfinished, not silently declared complete.

Pending review packet:

```sh
node --experimental-strip-types scripts/captune/review.ts \
  --project project.json --output pending-review.json
```

Check an actually completed, matching source-text receipt:

```sh
node --experimental-strip-types scripts/captune/review.ts \
  --project project.json --check completed-review.json
```

No hooks, named skills, agents, persistent services, new package/model installs,
paid providers, push or deployment were used. Generation cannot proceed until
NVIDIA authorizes the selected models. Source material and API responses were
handled as data, not instructions.
