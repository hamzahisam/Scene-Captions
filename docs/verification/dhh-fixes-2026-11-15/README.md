# Second-round DHH audit fixes — 15 November 2026

Local branch `dhh-ux-fixes`, starting from `main` at `bafdfb5`. Work is in progress.
No push, deployment, caption generation, runtime dependency, hook or participant upload
is authorized. Orca coordinates the user-requested Codex, Antigravity, OpenCode and
smaller Claude workers; they perform source engineering only. Participant test data
is synthetic and browser-local.

Decisions use the supplied defaults: display extension off, shortened markers off,
researcher code at session creation, speaker chips for reviewed annotations only,
upright sound text with symmetric styling, and Latin-square film rotation.

Run `sh scripts/verification/check-dhh-fix.sh <task>` after each task. It saves
typecheck, unit test, build and protected-hash output under
`artifacts/dhh-fixes/checks/`. The hash check covers the protected files and all
public research copies against the `bafdfb5` tree. Historical Graphify/Fallow maps predate this
work and remain stale; they are not evidence for the current implementation.

## A1 — reading pace and display windows

The Amount expectation line uses the pure playback resolver. Shortening marks are
opt-in and default off. Session setup and demo Research tools expose a default-off
`extendDisplay` switch. Derived windows use only needed time, at most one second
after the source end, within film duration and at least 0.1 seconds before another
sound or dialogue starts. Already-active intervals block extension. The overlay,
native track, research cue list and exposure events use the same window; telemetry
retains adaptation rules and both source/display ends. Baseline and Original retain
source timing. The experimental plan describes the timing trade-off.

Changed owners: `src/lib/captions.ts`, session/profile/telemetry rules, caption
display/settings/track components, player/workspace/session setup, exposure and
rehearsal hooks, and focused tests/scripts. Default decisions 1 and 2 were used.

| Film | cps | Rich shortened off → on | Rich/Balanced differences off → on | Extended |
| --- | ---: | ---: | ---: | ---: |
| Big Buck Bunny (87) | 17 | 62 → 23 | 24 → 63 | 46 |
| Big Buck Bunny (87) | 20 | 55 → 20 | 31 → 66 | 38 |
| Hair Love (15) | 17 | 9 → 2 | 6 → 13 | 9 |
| Hair Love (15) | 20 | 9 → 1 | 6 → 14 | 9 |
| Soar (49) | 17 | 14 → 14 | 35 → 35 | 0 |
| Soar (49) | 20 | 12 → 12 | 37 → 37 | 0 |
| Sintel / Tears of Steel (dialogue only) | 17/20 | 0 → 0 | 0 → 0 | 0 |

BBB pace-only fits improve from 27 to 70 of 87 at 17 cps (the requested estimate
was about 71). Actual unchanged Rich wording improves from 25 to 64 because the
existing density rule still reduces additional cues. The expectation line uses
the actual count. Four BBB cues still exceed pace at both 17 and 20 cps with
extension enabled. Soar's source windows touch, leaving no silence to extend.
These counts do not establish reading comfort or combined dialogue/sound load.

Verification: typecheck, **79 Node tests**, production build and **53 protected
hashes** pass. Installed Chrome checks the actual panel expectation, marker
off/on, overlay activity beyond source end, native VTTCue timing and saved
exposure end times. This focused integration uses a synthetic media clock and
simulated native-fullscreen events, not a physical iPhone. Compact evidence is
under `reports/`; detailed logs stay in `artifacts/dhh-fixes/`. Re-run counts with
`node --experimental-strip-types scripts/verification/dhh-fixes/A1-reading-audit.ts`.

## A2 — appearance parity

CC and its keyboard shortcut open in all five conditions. Fixed assignments show
only the common appearance and accessibility controls, with a short fixed-sounds
note. The pure `conditionProfile` helper locks sound fields while preserving every
appearance field. Effective-profile comparison logs only actual changes. Amount
and Original shortcuts/help entries follow sound-control availability; size works
in every condition. No additional decision was required.

Changed owners: study-session rules, workspace, player, caption settings,
readability, shortcut handling/help and the focused tests/Chrome script.
Typecheck, the full Node suite, build and all 53 protected hashes pass. Chrome
checks baseline, personalized, Essential, Balanced and Rich, including identical
seven appearance fields, effective announcements, persistence/reload, shortcut
availability and matching telemetry. Media time is synthetic in this interaction
test. Evidence: `reports/A2-browser.json`; runner `scripts/verification/dhh-fixes/A2-browser.ts`.

## A3 — researcher access

Session creation requires 4–8 digits; SubtleCrypto stores a random salt and SHA-256
digest only. The participant page mounts no researcher recording/export/rating/note
or leave controls. A small Researcher button after the footer opens a modal dialog;
correct code reveals those controls until close. Wrong code reveals nothing,
Escape returns focus, and reload relocks. Browser confirmation was removed.
Recovery exports are also hidden from the locked participant view. Older sessions
without a code fail closed and require fresh setup.

This deters casual access; it is not a security boundary. Browser developer tools
can bypass the registry and UI. Supervision remains necessary. This is documented
in the hash helper and experimental procedure. The supplied code-at-creation
default was used. Unlock, exports, note edits and leaving are researcher-sourced
events; audit events can be appended after recording stops without restarting
participant capture. Recording start/stop retain their existing researcher events.

Changed owners: researcher-code helper/dialog, registry/setup, workspace/screening
room/study context, recorder status/rehearsal, telemetry/storage, experimental plan,
dialog CSS, hash/audit tests and Chrome runner. Typecheck, **88 tests**, build and
all **53 protected hashes** pass. The Chrome runner uses actual local session
creation and verifies missing/wrong/correct code, modal close/reload, all three
exports, note persistence, stop, leave and researcher audit records. No upload
requests occurred. Evidence: `reports/A3-browser.json`; runner
`scripts/verification/dhh-fixes/A3-browser.ts`.

Phase A blockers are implemented. Later correctness/validity fixes and the manual
device, screen-reader, listening and sustained-playback checks remain open.

## B1 — separate rehearsals and explicit resume

Demo/lab runs use unique UUID-based IDs and a local metadata index. Research tools
lists old runs with read-only exports and deletion; legacy fixed-ID logs remain
discoverable. A closed demo run can only be followed by New rehearsal, which resets
consent and initial profile telemetry. Loading an existing demo recorder defaults
to paused/read-only; a left-open run offers Export, Discard and consent-gated Resume.
Study sessions retain automatic resume and their assignment. Index entries are
metadata only; logs are removed only through explicit deletion.

Changed owners: rehearsal hook, recorder/storage, index/list UI, main/lab integration,
procedure/data-handling docs and fake-storage/browser tests. No additional default
decision was needed. **98 tests**, typecheck, build and 53 protected hashes pass.
Chrome verifies two separate logs with one start each, fresh consent, reload
without new capture, export without writes, explicit resume and deletion; A3's
study creation/unlock/reload/export check still passes. A final visibility event
on the old page's unload is expected; the new page does not append events until
consented resume. Evidence: `reports/B1-browser.json` and per-task check logs.

Team manual checks remain Safari, Firefox, physical iPhone fullscreen, VoiceOver,
NVDA and a 20–30 minute recording/playback soak. Automated checks cannot establish
sound accuracy, DHH comfort, participant consent or study approval.

## B2 — survey interaction and response scales

Surveys no longer close on Escape: the shared dialog hook takes an `escapeDismiss`
option (default true, off for surveys) so the current answer, item and focus stay
put; only explicit Skip records a null. Child checkpoint wording is "How easy was
it to follow the captions?". Child checkpoint and all three end ratings share one
1 negative → 5 positive face scale (inline SVG with adjacent visible text, no
emoji; numeric codes unchanged). Every new survey response carries `scale`
metadata (kind, endpoints, labels, direction) including skips and system-missed
checkpoints; legacy events without it still parse, and CSV serializes it as JSON.
Adult wording/polarity and TLX wording/scoring are preserved for B3.

Changed owners: `use-dialog-focus`, `study-surveys` rules/component, `survey-face`,
telemetry schema/CSV, experiment procedure and plan, focused tests, Chrome runner.
Typecheck, tests, build and 53 protected hashes pass. Installed Chrome (synthetic
media clock) checks child and adult groups, 25 Escape cases, Skip, faces plus
accessible text and metadata; A3 regression passes. Evidence: `reports/B2-browser.json`;
runner `scripts/verification/dhh-fixes/B2-browser.mjs`.

## B3 — Raw NASA-TLX wording and native segmented controls

The six Raw TLX items use the standard task wording (mental, physical, temporal
demand, performance, effort, frustration) with the task line "The task: watching
the film with these captions." Endpoints are Very low / Very high, except
performance Perfect / Failure. Each item is a native radio group of 21 segments
(0–100, step 5) with no initial selection, so Continue stays disabled until a
choice, including an explicit 0. Radios are keyboard (Space/arrows) and screen-reader
operable, with the task and endpoints in the group description; the sliders and
"Use 50" button are gone. Scoring is unchanged: mean of six answers, missing if
any item is skipped. B2 Escape inertness and scale metadata are retained.

Chrome (synthetic media clock): desktop 1280×900 and mobile 390×844 adult sessions
check every item (initially empty, Space/arrow steps, Escape inertness, persisted
metadata) and the real exported summary (50 complete, null when skipped), now
through the A3 researcher dialog. The B2 runner still passes. Evidence:
`reports/B3-browser.json`; runner `scripts/verification/dhh-fixes/B3-browser.mjs`.

## B4 — pilot slot allocation and between-film rotation

Three-condition pilots now have exactly 18 slots: Williams condition order is
slot mod 6 and the cyclic film rotation is floor(slot / 6) mod 3. Across all 18
slots each film and condition appears six times in every position and every
film–condition pair appears six times; slot 18+ is rejected. The two-condition
pilot keeps its four crossed sequences. Pilot slots are saved as `pilot-2-N` /
`pilot-3-N` (legacy `pilot-N` still reads); setup shows the next unused slot,
derived from the saved registry (no separate counter), creates automatic
assignments, and accepts a duplicate only through an explicit override with a
required saved reason (`slotOverride`). Registry validation rejects unreasoned
duplicates; exhausted three-condition slots throw a clear error. Between-participant
sequences rotate film order by the allocation row's index within its stratum and
the rotated sequence is stored in the session.

The procedure and `docs/EXPERIMENTAL_PLAN.md` describe this. The generated public
copy `public/research/experimental-plan.md` is a protected research file and is
deliberately not updated, so it is stale relative to the docs plan (as with A1–B3).
Installed Chrome checks real setup (with the A3 researcher code) for slot
assignment, grouped schemes, reasoned override, rotation and reload stability.
Evidence: `reports/B4-browser.json`; runner `scripts/verification/dhh-fixes/B4-browser.mjs`.

## B6 — reviewed speaker attribution

Speaker chips now appear only when the dialogue attribution is reviewed:
`dialogue_status ?? status === 'reviewed'`, so a future sound-only review can mark
sounds reviewed while dialogue speakers stay draft (the optional `dialogue_status`
field is the gate; older sidecars fall back to `status`). A reviewed speaker renders
as the chip plus a visually hidden ": ", so the paragraph's accessible text reads
"Angela: Just took a little bit of work". Native text-track cues and telemetry
exposure text use the same "Speaker: text" string. Unreviewed annotations leave the
source text unchanged, including its own "Angela:" prefix, and show no chip. All
current sidecars are heuristic drafts, so no chip shows until review. No annotation
or caption data was changed.

Unit tests cover the gate, the `dialogue_status` override, prefix stripping and
native text. Installed Chrome (synthetic clock) checks Hair Love cue 1 in draft
mode (no chip, unchanged text, native cue unchanged) and, with the sidecar
temporarily flipped to reviewed and then restored, in reviewed mode (one chip,
hidden ": ", native "Angela: …"). Evidence: `reports/B6-browser.json`; runner
`scripts/verification/dhh-fixes/B6-browser.mjs`.

## C1 — sound navigation icons

The Previous/Next sound buttons use two new inline SVG icons (sound bars with a
left or right chevron) instead of the ↶/↷ glyphs, which read as undo/redo. The
accessible names, disabled logic and seek behaviour are unchanged; the icons are
`aria-hidden`. Chrome (synthetic clock) checks no text glyph remains, one SVG per
button, minimum button size, and Next/Previous seeks. Evidence: `reports/C1-browser.json`;
runner `scripts/verification/dhh-fixes/C1-browser.mjs`.

## C2 — upright, symmetric sound styling

Sound captions are upright by default; the italic and the one-sided green left
border are gone. Typed sounds (non-music) now carry a symmetric 2 px tint ring
outside the caption box, and music keeps its ♪ glyphs. Brackets stay the primary
cue that text is a sound. A new `italicSound` profile field (default false, old
profiles load false) adds "Italic sound captions" under More sound options; it is
a sound setting, so fixed conditions take the session default (off) like type
styling, while personalized sessions keep the viewer's choice.

Contrast: the ring sits outside the caption background, so it does not change
text contrast. Worst case over a white video frame: solid backdrop 19.7:1 white /
16.1:1 yellow; translucent 5.7:1 white / 4.7:1 yellow (floor 4.5:1). Outline mode
(transparent, 1 px black text shadow) has no guaranteed contrast and is an
explicit limitation over bright frames. Chrome (synthetic clock) verifies computed
upright style, the symmetric ring with no side border, opt-in italic and its
persistence. Evidence: `reports/C2-browser.json`; runner `scripts/verification/dhh-fixes/C2-browser.mjs`.

## C4 — caption settings organization

Appearance is now open by default and is the first group in the panel, with Text
size the first control. "Reset readability" is "Reset appearance" (size, position,
backdrop, colour). Announce captions, Single-key shortcuts and Use shortcuts across
this page sit in a labelled Accessibility group (labels unchanged for assistive
technology and scripts). The "Font: system sans-serif" line is removed. Reading
pace options read "15 · Slower", "17 · Standard", "20 · Faster"; in a study session
the option equal to the session's reading pace adds "(session default)" (the demo,
which has no session, marks nothing). "Help me keep up" is described by its help
text through `aria-describedby`. The A2 runner now opens Appearance only when closed.
Chrome checks the demo page and a real personalized session (default pace 15) and
that Reset restores defaults. Evidence: `reports/C4-browser.json`; runner
`scripts/verification/dhh-fixes/C4-browser.mjs`.

## B5 — laptop fold fit

At the actual baseline the 16:9 player bottom was 859 px, failing 3 of the 4 audited
viewports (1366×657, 1536×730, 1280×800; 1920×969 already fit). The desktop (≥901 px)
layout now compacts the film picker into one wide row and the heading into one
line (20–26 px, inline credit), and a small measuring helper (`use-fold-height`)
sets `--fold-h` from the live window height, the player's real top and the credit
line. The player width is `min(100%, fold height × 16/9)`, so the stage, controls and
credit fit the first screen without cropping or scaling captions. Fullscreen, narrow
(<900 px) and mobile layouts are unchanged; the helper recomputes on resize and zoom.

After integration with A3/B1/C4 (Chrome, synthetic media clock, installed Chrome):
player bottom 614 px at 1366×657, 687 at 1536×730, 757 at 1280×800 and 794 at
1920×969 (full size kept); 1000×760 fits; the left-open-rehearsal banner state, a
120 px shorter window and the tallest of 87 Rich/extra-large Big Buck Bunny cues
also fit; 820×1000 and 390×844 are unchanged; no page errors. The runner's banner
state follows B1 (explicit prior-rehearsal offer) and its Appearance step follows
C4. Evidence: `reports/B5-geometry.json`; runner `scripts/verification/dhh-fold-geometry.mjs`;
detailed before/after logs and screenshots remain in `artifacts/dhh-fixes/B5*`. Note
that very small windows (under about 400 px of fold height) shrink the player width
accordingly; no minimum is enforced.

## C5 — one keyboard stop for the player and a control-bar help button

The `<video>` element is `tabindex=-1`, so the player region is the only keyboard
stop for shortcuts; clicking the picture still lets shortcuts reach the region.
The "?" Keyboard shortcuts button moved from an absolute overlay on the picture
into the control bar beside CC (the old absolute class is removed), keeping its
name, dialog and focus return. Chrome (desktop 1280×800 and mobile 390×844) checks
Tab never lands on the video, the button lies inside the control bar and is not
positioned, click-then-`c` and `?` shortcuts work, and Escape returns focus to the
button. On mobile the control bar's right group wraps onto its own row. Evidence:
`reports/C5-browser.json`; runner `scripts/verification/dhh-fixes/C5-browser.mjs`.

## C6 — timeline follows the clock only while open

The research Sound timeline previously highlighted the current cue from a stale
`currentTime.current` value read during workspace renders. `VideoPlayer` now hands
its playback clock to the workspace (`onClock`, one state update), and `SoundTimeline`
reads it with `useSyncExternalStore` only while the Research tools drawer is open;
closed, nothing subscribes. The workspace itself still does not re-render on clock
ticks. Chrome (dev render counter, synthetic clock) shows the counter flat across
seeks with the drawer closed and across four timeline-moving seeks with it open
(the current cue changes each time), and flat again after closing. (A stash-based comparison against the previous
code also errored, but its failure reason was not inspected, so no before/after claim is made.) Evidence: `reports/C6-browser.json`;
runner `scripts/verification/dhh-fixes/C6-browser.mjs`.

## C7 — single condition event

Changing the Research-tools condition used to write a `profile_change` row for the
condition, then a `condition` study event that the rehearsal hook silently dropped
(its telemetry schema had no condition type), then an Original-off event even when
Original was off. Now a real change records exactly one typed `condition` event
(`from`, `condition`, source `researcher`) and an Original-off event only if Original
was on; choosing the already-active condition logs nothing. The hook maps the study
event and the telemetry schema accepts it; exports include it (CSV unchanged).
Note: the recorder's `assigned_condition` context is not rewritten mid-recording; use
the `condition` events for the sequence. Unit tests cover the schema, storage and CSV;
Chrome (synthetic clock, local rehearsal) covers no-op, a real switch, and Original-on
then switch. Evidence: `reports/C7-browser.json`; runner `scripts/verification/dhh-fixes/C7-browser.mjs`.

## C3 — per-line sound kinds, vocal heuristics and review CSV tooling (Gemini worker, integrated)

Sound annotations may carry `kinds` (one per source line); validation requires the
count to equal the source line count. Vocal detection uses word-boundary patterns (ah,
oof, huh, gasp, sigh, hmph, etc.) so words such as crash, flash or roof no longer match,
and all draft sidecars were regenerated (multi-line cues in Big Buck Bunny and Soar get
`kinds`). Each film has a review CSV (`cue_id,start,text,proposed kind`, RFC 4180).
`scripts/verification/apply-reviewed-csv.mjs` (with `--check`/`--dry-run`) validates the
whole file first — known unique cue ids, exact start and source text, permitted kinds, line
counts — and only then writes `status: 'reviewed'`. It keeps `dialogue_status` as
`heuristic-draft`, so reviewing sounds never certifies dialogue speakers (the B6 gate is
`dialogue_status ?? status`). Overlay, native track and exposure text share one formatter
for per-line music glyphs. Integrated with B6 and the C2 italic class; unit tests 118
pass with types, build and 53 protected hashes; B6/C2 Chrome runners re-pass. The Gemini
worker's self-reported model/effort and "no model inference" were not independently
verified beyond the committed deterministic scripts. All sidecars remain drafts: sound
wording/kind accuracy and speaker attribution still need human review.

## Final integrated verification

Installed Chrome, synthetic media clock, browser-local synthetic data; requests were
only GETs of the app and film media (no uploads). `scripts/verification/dhh-fixes/final-e2e.mjs`
creates a real two-film pilot session through `/session`, opens it, reloads, rejects a wrong
researcher code and unlocks with the right one (relocking on reload), checks `?`/`c` shortcuts,
answers the 10 end items by keyboard, finishes film one and confirms the next film and
resume, at 1280×800 and 390×844 (`reports/final-e2e.json`, screenshots in
`artifacts/dhh-fixes/screenshots/final-*`). The fold runner passes at 1366×657, 1536×730,
1280×800, 1920×969, 1000×760 and the 820/390 regressions (`artifacts/dhh-fixes/final-fold`).
Every task runner (A1–A3, B1–B4, B6, C1, C2, C4–C7) re-passed on the final tree. The reading
audit reproduces the Phase A counts in all films for extension/marker off and on.

Not established: Safari, Firefox, a physical iPhone, VoiceOver/NVDA, DHH/team review of
captions, instruments and wording, the 20–30 minute playback/recording soak, acoustic or
listening validation, and any research validity. Historical Graphify/Fallow maps remain stale.

## Follow-up audit fixes (committed after Phase C, out of task order)

These two audit follow-ups were committed after the C-series and the final report,
so they appear out of order in history; nothing was amended.

**B4 audit — fresh registry allocation and canonical film order.** Session creation
now selects the between-participants row, its stratum index and the saved rows from the
freshly read registry (`claimBetweenRow` on `r.allocations`), not React state, so a stale
second tab cannot reuse or overwrite a slot another tab consumed. Selected films are
put in catalogue order (`canonicalFilms`) before the between/pilot rotation, so
checkbox click order no longer changes the sequence. The legend is "Films to include"
with a note that the saved viewing order is rotated from catalogue order. Tests cover
reversed-checkbox equality and the stale-tab claim. B4 Chrome runner re-passes.

**C2 audit — italic sound captions as a common appearance setting.** The earlier C2
text above filed "Italic sound captions" under fixed sound settings; that is superseded.
`conditionProfile` no longer overrides `italicSound`, and the control moved from More
sound options to the Appearance group, so it is available in all five conditions,
persists, and is reset by Reset appearance (which now also clears italics). Tests add it
to the all-condition effective-appearance check; the A2 Chrome runner confirms the
control in every condition and the C2 runner confirms opt-in, persistence and reset.

**C4 acceptance re-verified (no extra commit needed).** The C4 Chrome runner passes
on the final tree: Appearance open with Text size first, Reset appearance, the
Accessibility group, pace labels 15 · Slower / 17 · Standard / 20 · Faster with the
session default marked, and `aria-describedby` on Help me keep up. These checks cover
the demo and a real personalized session.
