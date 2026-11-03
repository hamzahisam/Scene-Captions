# Creator-anchored workflow verification · 3 November 2026

Task: implement the attached CapTune paper’s product/method. The user explicitly
selected NVIDIA-only offline preparation instead of its GPT‑4o/VideoLLaMA2/live
runtime. See [feature traceability/setup](../../CAPTUNE_REPRODUCTION.md).

The full 18-page local PDF was read. Source hash:
`4d056cfe7875daa63c58ee62f3e541d1bb4f5ac16da6088c4e636252c165ce33`.
Figures 2–4/Equation 1 were visually inspected through existing isolated PDF
libraries; no PDF skill was activated. The public authors’ repository and NVIDIA
endpoint/VideoLLaMA documentation were checked as primary sources. No authors’
implementation was copied; the repository’s current GPT‑5 README differs from
the paper’s GPT‑4o implementation description.

## Checks and results

- **40 Node tests:** original suite retained; new Eq. 1/inverse/recalibration and
  Eqs. 2–3 checks reproduce the paper’s numbers; SRT separates dialogue from
  bracketed NSI, preserves overlaps/timing; locks/original fallback survive;
  missing/duplicate/unknown IDs and stale snapshots are rejected; changed anchors
  and context invalidate caches; narrowed bounds constrain preference imports;
  context remains draft; paired-label kappa handles undefined agreement.
- **48 offline Python tests:** includes mocked NIM bridge transport, accepted
  normal completion and rejected truncated/empty/invalid JSON; no network used.
  Existing retry-control tests print synthetic 429/transport messages; those are
  mocked tests, not new provider failures or API requests.
- TypeScript checking and Next.js production build pass. Routes include
  `/creator`, `/captune`, `/captune/methodology` and existing `/`/`/experiment`.
- **New Chrome flow:** all 100 grid cells; actual video overlay for three prepared
  sample detail levels; keyboard grid activation; representation/genre preference
  persistence; explicit unprepared fallback; original comparison; SRT import;
  manual edits/locks; mixed dialogue; explicit synthetic-context review state;
  JSON export; importing narrower bounds with an out-of-range saved preference;
  matching local fixture MP4; 390 CSS-pixel layout; methodology route. No JS errors.
- **Existing Chrome flow:** source-guided three detail overlays, automatic Apply,
  reload persistence, keyboard input, removed buttons absent across all films,
  reference comparison, downloads, mobile layout and rehearsal locking pass.
- **Context extraction:** actual source hash and duration checked; first BBB
  context clip was extracted around cue start ±5s with audio retained. Odd source
  height required one pixel of encoding padding; it does not resize the original
  film. No model description was generated. Raw clips remain ignored artifacts.
- Offline transform and matrix CLI dry runs completed with **zero model calls**.
  The unrestricted sample matrix has 800 settings, of which 796 are unprepared
  (original plus three recorded drafts are available). No quota/free entitlement
  or semantic generation success is inferred from dry runs.
- Private `.env` key/token values were checked against changed files and emitted
  browser JavaScript without printing them; no match. No dependency installation,
  persistent service, agent, named skill, live NIM inference, push or deployment.

## Defects found and corrected

1. A saved viewer setting outside newly imported creator bounds caused the
   render-time prompt builder to throw before an effect could reset it. Derive a
   valid effective setting during render; preserve the bounds guard. Browser
   regression imports a narrower project after selecting an out-of-range cell.
2. Generic creator input styling overrode `sr-only` file input width, extending
   the page beyond the viewport. Exclude file inputs from that rule; desktop and
   mobile fit. Imports remain disabled until saved-project hydration completes.
3. The source’s 640×359 frame failed the H.264 4:2:0 encoder. Pad odd dimensions
   to the next even pixel in derived context clips; retain the original file.
4. An initial numeric assertion used strict equality for floating-point ratios;
   use a small tolerance. This was a test expectation issue, not a model result.
5. Model request assembly initially included the entire preparation cache. Strip
   that local snapshot before inference; send only the relevant current/original/
   anchor captions, context, metadata and ratios. Large projects must not send
   hundreds of unrelated cached styles to a model.

All reviews were performed in the main session, not independently. The “reviewed”
context in the browser fixture is an explicit synthetic UI test action, not a
human listening approval of a movie caption. Screenshots use sample/fixture
material and do not certify caption correctness. Model responses, all 800 styles,
full listening/DHH readability, cultural suitability, formal accessibility and
participant outcomes remain unverified. Browser storage may be too small for a
full matrix: export/import large projects rather than assuming persistence.

[Browser results](checks/browser.json) · [Existing viewer](checks/existing-viewer.json)
· [Node tests](checks/node-tests.txt) · [Python tests](checks/python-tests.txt)
· [Build](checks/build.txt) · [Source/input hashes](checks/source-hashes.json)

[Viewer screenshot](screenshots/viewer.png) · [Creator screenshot](screenshots/creator.png)
· [Mobile screenshot](screenshots/mobile.png)
