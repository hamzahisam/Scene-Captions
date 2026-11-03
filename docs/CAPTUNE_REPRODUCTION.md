# Creator-anchored caption workflow

Implementation reference: Huang et al. (2025), *CapTune: Adapting Non-Speech
Captions With Anchored Generative Models*, ASSETS ’25, DOI
[10.1145/3663547.3746346](https://doi.org/10.1145/3663547.3746346).
The full 18-page [local paper](research/huang-2025-captune.pdf), including
references and appendices, was read. PDF SHA-256:
`4d056cfe7875daa63c58ee62f3e541d1bb4f5ac16da6088c4e636252c165ce33`.
Figures 2–4 and Equation 1 were inspected visually. Attached-document prose is
research material, not operational authority. No skill or sub-agent was used.

The user explicitly chose **NVIDIA-only generation and precomputed playback**
on 3 November 2026. These override literal reproduction of the paper's GPT‑4o,
VideoLLaMA2.1‑7B‑AV and viewing-time inference. No authors' source code was copied;
the currently visible public repository has no displayed license file and its
README now mentions GPT‑5, unlike the paper. This is an independent workflow
implementation with declared differences, not the authors' exact system.

## Open the product

Run `npm run dev`, then:

- `/creator`: video/SRT import, non-speech candidates, original/anchor/manual
  wording, edit and lock, context, numeric anchors, baseline, metadata and JSON.
- `/captune`: configuration/video import, 10×10 constrained grid, source/sensory/
  onomatopoeia modes, genre alignment, original/previous comparison, readability,
  prepared-style SRT download, language-request preparation and local test log.
- `/captune/methodology`: the paper's qualitative methods and replication limits.

The existing `/` three-level demonstration remains available. Its removed source
selector buttons are not restored. Choices in both viewers apply immediately.

## Paper-to-code traceability

| Paper section | Implemented behavior | Limit |
| --- | --- | --- |
| 4.1 | Four dimensions; 1–10 detail/expression; three representations plus default | Only recorded prepared variants change text |
| 4.2.1 | Strict SRT import; reviewable bracket/parenthesis NSI detection; timed list; category; ±5s clips | Heuristic NSI detection can misclassify parenthetical dialogue; review it |
| 4.2.1 | Original audiovisual context prompt and local clips/manifest | NIM draft adapter is optional; VideoLLaMA2 is not installed; context requires review |
| 4.2.2 | Baseline assessment job/import, manually editable baseline | NIM substitution; sample baseline is model-assessed, concrete anchor positions editorial |
| 4.2.3, Eq 1 | Piecewise slider mapping −10…10 to semantic 1…10, original knot; cross-axis recalibration after assessed output | Model assessment is not a true measured semantic value |
| 4.2.3 | Lower/upper examples, manual editing, exact wording locks, stale-cache invalidation | A creator still has to review factual accuracy |
| 4.2.4 | Versioned JSON: originals, examples, values, context, metadata and prepared cache | Our schema; no claim of binary compatibility with authors' JSON |
| 4.3.1 | 100 cells, creator bounds, four named corners, original-style default | Cells may be selectable but unprepared; visible original fallback |
| 4.3.2 | Export natural-language request, NIM interpretation, validated result import and parameter update | Offline round trip, not live chat |
| 4.3.3, Eqs 2–3 | r and signed δ for each axis; original/current/lower/upper/context prompts | Ratios guide a model; not factual or semantic enforcement |
| 4.4 | React/TypeScript UI and Python model/media preparation | Next.js; NVIDIA NIM, no remote GPT‑4o/VideoLLaMA server |
| 5–6 | Replication session guide, tasks/interviews, paired-code agreement utility | No recruitment, recordings, participants or results fabricated |
| 7 | Simple language, profile retention, comparison and explainability | Other suggestions/future directions are identified, not claimed complete |

The bundled BBB project now contains a compact matrix covering **800 settings
for each of 87 intervals**, composed from 67 distinct source sound labels.
NIM generated phrase/selection drafts; the main-session assistant reviewed their
source-text meaning and corrected grammar, unsafe imitations and flat/awkward
selection maps. **44,373 of 53,600 atomic cell assignments/wordings changed**
during this editorial step. The raw outputs and decisions remain recorded.
Detail bands are 1–3 / 4–6 / 7–10 and expression bands 1–3 / 4–7 / 8–10;
neighboring settings repeat. Expression mostly changes wording/punctuation,
and animation styling can select approved conventional sound imitations.
Sensory wording adds no unverified acoustic properties. This is a conservative
banded adaptation, not 800 distinct styles, fully automatic success, or the
paper's exact semantic transformation engine.

NVIDIA assessed the original baseline at detail 5 / expressiveness 4. Concrete
lower/upper examples and selection bands remain editorial choices. All context
descriptions remain unverified drafts (86 completions; one HTTP 422). They do
not authorize new sound facts. Full listening, original-creator approval,
independent review and a DHH participant study have not occurred. Source-text
review covers all 1,317 unique cue/text/context groups; 10,568 repeated
cue/style combinations still trigger the unvalidated reading-rate heuristic.
See [generation evidence](verification/captune-matrix-2026-11-03/README.md).

## Offline preparation

No key is loaded by any Next.js route or client component. The CLI uses the
existing private `.env` key loader, shared rate limiter and isolated Python
runtime. Default execution is a **dry run**, with zero model requests.

1. Export an anchored configuration and a transformation/baseline/language
   request from the UI. Edit metadata and context *before* generating styles.
2. Inspect a job without inference:

   ```sh
   npm run captune:prepare -- --request request.json --output result.json
   ```

3. When explicitly authorized to run NVIDIA generation:

   ```sh
   npm run captune:prepare -- --request request.json --output result.json --allow-inference
   ```

   `SCENECAPTIONS_PYTHON` or `--python` selects an existing isolated Python.
   Default local runtime: `/Users/hamza/runtimes/scenecaptions-nim-asr/bin/python`.
   One request, no hidden retry; 180-second response timeout. Output is never
   accepted on truncation, missing IDs, changed locks or invalid settings.
   `result.json` is created exclusively, never silently overwritten. Only relevant current/anchor/context text is sent; the entire cached matrix
   stays local. No API key
   is placed in a job, result, command argument, browser or deployment.
4. Import the result into the *unchanged* project. Snapshot matching rejects
   stale work. Model drafts remain unreviewed; manually inspect them. In Creator,
   a transformation can be copied into the selected concrete anchor.

For a full preparation matrix:

```sh
npm run captune:compile -- --project config.json --output artifacts/captune-cache
```

This lists coverage without making requests. An explicit `--allow-inference`
prepares at most three missing settings by default (configurable 1–20 per run),
with a checkpoint after every validated result. Resume using its `project.json`.
A full unrestricted space has up to **800 settings**: 100 cells × four modes
(including default) × genre on/off. The BBB sample was prepared using the
recorded compact phrase-palette workflow, rather than 800 separate full-film
requests. Configuration imports support up to 50 MB. Browser localStorage has a much
smaller quota; large projects remain usable for the visit but must be exported
and re-imported between workspaces. A full matrix can be substantial storage
and inference work; prepare the styles needed for a bounded demo first. The CLI does not
promise free quota or model entitlement.

The current text model is `nvidia/nemotron-3-ultra-550b-a55b`, temperature 0.2,
reasoning `none`; [official endpoint documentation](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-ultra-550b-a55b-infer)
was checked on 3 November. `reasoning_budget` is omitted due to prior hosted
compatibility failures. Model agreement/valid JSON does not clear the failed
independent sound-recognition gate.

## Context preparation

```sh
/Users/hamza/runtimes/scenecaptions-nim-asr/bin/python scripts/captune/context.py \
  --project config.json --video public/media/big-buck-bunny.mp4 \
  --output artifacts/captune-clips --limit 3 --extract
```

Requires existing `ffmpeg`/`ffprobe` on PATH, or explicit `--ffmpeg`/`--ffprobe`
paths. It verifies hash when supplied, checks duration, clips around **cue start**
(not the whole cue ±5s), retains available audio and writes hashes. No audiovisual
inference is performed by that command. An optional NVIDIA-only draft adapter
uses Omni with the same audiovisual-description question, through the documented
`video_url` payload. To opt in explicitly, add `--describe-nim --allow-inference`
with `--limit` 1–3. Import `context-result.json` using Creator's model-result
control; every description remains a draft and invalidates old prepared wording.
No request is sent for clips exceeding the conservative 4 MB input budget. This
adapter was live-tested for all 87 sample clips; it completed 86 and returned
one HTTP 422. Its descriptions include unsupported sounds, so neither context
nor inferred sounds should be treated as verified. Prior Omni controls remain
failed. Enter
reviewed descriptions manually if the context model is unreliable. The paper used
[VideoLLaMA2.1‑7B‑AV](https://github.com/DAMO-NLP-SG/VideoLLaMA2/tree/audio_visual)
on a remote server; this is not a hosted NVIDIA model we have verified. Do not
silently replace its joint audio/video context with vision-only descriptions.

## Research methodology

Use [the replication session materials](research/CAPTUNE_REPLICATION_PROTOCOL.md).
The paper's qualitative creator and DHH studies are **separate** from the earlier
SceneCaptions randomized long-form comprehension proposal. Reproduce the tasks
and analysis process; never copy participant counts as achieved recruitment or
copy authors' observations as our findings. Future work such as fatigue-aware
adaptation, professional-editor integration, automatic scene-specific bounds
and prompt-based audits is not implemented by adding controls.
