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

Open: A3 remains a participant-session blocker; team device, screen-reader,
listening and sustained-playback checks remain below.

Team manual checks remain Safari, Firefox, physical iPhone fullscreen, VoiceOver,
NVDA and a 20–30 minute recording/playback soak. Automated checks cannot establish
sound accuracy, DHH comfort, participant consent or study approval.
