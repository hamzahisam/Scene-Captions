# DHH accessibility, UX and study-rigour upgrade — 13 November 2026

Local branch: `dhh-ux-upgrade`. User-authorized source implementation only. No push, deployment, model/API call, new runtime dependency, font download, hook installation or worker. Browser tests used the existing isolated Playwright runtime and installed Chrome; all sessions/data in tests are synthetic. Existing media GET requests are playback, not participant uploads.

## Phase results

| Phase | Changed owners | Result and verification |
| --- | --- | --- |
| 0 | `scripts/verification/reading-rates.mjs`, reports here | `npm ci`, typecheck, original 53 tests and build passed. Reading baseline and protected-data hashes recorded. |
| 1 | profile hook/helper, caption controls/dialog, Original button, player/fullscreen hooks, workspace/research drawer, header/CSS | Independent amount/punctuation, in-frame settings with mobile placement and focus management, in-place sample, click/hold original, marker, collapsed research tools and scalable fullscreen captions. Every task passed types/tests/build. Desktop/mobile interactions verify focus, Tab wrapping, Escape, persistence, keyboard/pointer Original, baseline locking and layout. |
| 2 | reading-rate rule, cue-annotation schema/sidecars/drafting script, presentation, marker/navigation/shortcut helpers, frame clock and accessibility fixes | Reading pace defaults/migration, heuristic sound kinds/speaker chips, appearance, sound navigation, scoped switchable shortcuts, frame sync, lab landmarks/grid radios and opt-in announcements. Every task passed types/tests/build. Protected caption files unchanged. |
| 3 | `/session`, allocation/session schemas/context, telemetry modules/shared recorder, checkpoint/survey components, question schema/example, plan updates | Fixed stratified allocation, pilot counterbalancing, session-specific defaults/locks, local persistence/recovery and three exports, exact caption exposure, checkpoint and end instruments. Types/tests/build and real-component session/reload/survey tests pass. |

## Defaults and research decisions

- Full stop retained (expression 2); the requested note makes clear that exclamation punctuation does not establish louder sound.
- Lab grid retained at 10×10, with radiogroup semantics and native fullscreen support. Its repeated wording is unchanged. Profiles/scales are not falsely unified; both viewers now share typed telemetry.
- Controls remain visible; dialogue-only titles are labelled; sound ticks default on and are configurable per session.
- No font/dependency added. Appearance uses the device's system sans-serif.
- Group defaults: child 17 cps/adult 20 cps; both configurable to 15/17/20. Group and instrument defaults are operational choices, not measured reading ability or validated age thresholds.
- Hash-bound captions, variants, source times and provenance guards are preserved. New kind/speaker information lives in sidecars and remains `heuristic-draft`. No off-screen claims were inferred.
- Before any cue has played, the first cue is the explicitly requested labelled sample. Later samples use current/past cues. Sample exposure is logged separately, so it is not counted as ordinary story exposure.
- Session creation includes a local technical-rehearsal acknowledgement, not formal participant consent. Ethics, participant groups, study materials and instruments still need team approval.

## Reading-rate measurements

Counts use spaces and exclude line breaks in prepared caption strings, with Full stop and descriptive representation. Timing is never extended. All tracks are in `reports/reading-before.json` and `reports/reading-after.json`.

| BBB (87 cues) | Essential | Balanced | Rich |
| --- | ---: | ---: | ---: |
| Before, >17 cps | 12 | 27 | 60 |
| With adaptation, >17 cps | 12 | 12 | 12 |
| Before, >20 cps | 5 | 20 | 53 |
| With adaptation, >20 cps | 5 | 5 | 5 |

The residual cases cannot fit using existing Essential wording. Four BBB cues are under 0.83 seconds and are flagged for researcher review. Counts do not validate reading comfort or combined dialogue/sound load.

## Test evidence and limits

Final automated result: **69/69 tests**, typecheck and production build pass (baseline: 53 tests). All protected caption hashes match.

Manual runner: `sh scripts/verification/check-dhh-task.sh <label>`. Per-task stdout is in ignored `artifacts/dhh-ux-checks/`. Test scripts are under `scripts/verification/dhh-*.mjs`; they use the installed Chrome channel because the bundled Playwright Chromium binary is absent.

- Main interactions: 1280×800 and 390×844; panel focus/Tab/Escape; independent amount/punctuation; persistent profile; Original click/hold/keyboard; baseline locks; mobile placement.
- DHH controls: reading marker/explanation, appearance, switchable shortcuts and unchanged workspace render count during playback.
- Fullscreen: settings remain inside fullscreen; Extra large stays larger; native video text tracks show while HTML overlays are removed on both main and lab players. This does not establish iOS behaviour.
- Frame timing: one 0.541-second BBB cue measured about −17.5 ms onset and −15.3 ms offset error in headless Chrome, within one 24 fps frame. This is a focused check, not an all-platform timing guarantee.
- Study: setup/assignment lock, hidden navigation/research tools, participant-scoped persistence, actual caption events, keyboard seek source, reload recovery, JSON download and a complete two-film sequence transition. No POST/PUT requests were observed in the synthetic session test.
- Surveys: automatic system-sourced pause/resume, underlying player blocked while answering, five-point child items, skipped responses stored as null and end persistence. Adult/custom/TLX item sets, omission and Raw TLX completeness/scoring are unit-tested.
- Response times run from first prompt display and may include reload/visibility interruptions. Use the recorded timeline to identify interrupted responses. Pictorial child items are adapted exploratory questions, not a validated Smileyometer.
- New question data is an example only. No real comprehension questions, sign-language clips or new participant outcomes were authored.

Screenshots and browser JSON are under ignored `artifacts/dhh-ux-browser/`; compact checked results are copied into `reports/`. Source maps/Fallow snapshots predate this structural change and are explicitly stale.

## Team manual checklist

- [ ] Chrome, Safari and Firefox on the intended study device: keyboard-only viewing, focus, zoom, contrast and readable captions with simultaneous dialogue.
- [ ] Physical iPhone: container/native fullscreen fallbacks, native text tracks, no double captions, questionnaire exit from native fullscreen.
- [ ] VoiceOver and NVDA spot checks, including optional caption announcements, grid radios and sign-language clip controls.
- [ ] 20–30 minute continuous playback soak with recording on; test reload, export, quota warning/recovery and cross-film continuity.
- [ ] Review every heuristic annotation, source/variant wording and short/over-limit interval against the media. No listening or DHH validation is claimed here.
- [ ] Approve participant groups, child wording/graphics, sign-language material, consent, checkpoint placement, instruments, allocation list and analysis before recruitment.
