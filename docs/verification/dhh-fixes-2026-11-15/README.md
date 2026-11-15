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
