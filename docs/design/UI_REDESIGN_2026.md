# SceneCaptions UI redesign 2026: "Night Screening"

Branch `ui-redesign-2026`, from `bafdfb5`. One commit per phase:

| Commit | Phase |
|---|---|
| `d139e5d` | 0–1: baseline, tokens, layered CSS, fonts, icons, primitives |
| `f6b5c16` | 2: shell and watch page |
| `ed29680` | 3: player and control bar |
| `041cb1b` | 4: caption settings sheet and shortcuts dialog |
| `3f4b943` | 5: researcher and participant surfaces |
| (this commit) | 6: QA, scripts, this report |

Not pushed, merged or deployed.

## 1. Checks

- `npm run typecheck`: pass after every phase.
- `npm test`: 69/69 pass after every phase (`tests/appearance.test.ts` included; caption backdrop presets unchanged).
- `npm run build`: pass after every phase. On the Linux VM this used Next's WebAssembly SWC fallback because `node_modules` was installed on macOS. Building on the Mac is unaffected.
- Browser scripts were run headless with Chrome against a local dev server, with the old build (`bafdfb5`) and the new one side by side:

| Script | Before | After |
|---|---|---|
| `dhh-interactions.mjs` | pass | pass (after selector updates) |
| `dhh-phase2.mjs` | pass | pass |
| `dhh-fullscreen.mjs` | pass | pass |
| `dhh-surveys.mjs` | pass | pass |
| `dhh-frame-sync.mjs` | pass | pass |
| `dhh-study.mjs` | **fail** | **fail**: same assertion (`seek` with `method==='keyboard'`), so it was already failing before the redesign in this environment |

- `scripts/browser-smoke.mjs` and `fixes-2026-10-24/player-regression.mjs` were **not run**: they need `playwright-cli run-code`, which isn't installed. They also target the October preset UI (buttons `Rich`, `Apply preferences`, `Follow cue density`), which was already removed before this redesign. I updated the selectors I changed, but those older steps stay stale.

## 2. Tokens and type, as implemented

Files: `src/styles/{layers,tokens,base,layout,components,player,settings,stimulus,research,overrides}.css`, imported from `src/app/globals.css`.
Layer order: `tokens, base, layout, components, research, overrides`. The temporary `legacy` layer used during the rebuild has been deleted.

Themes: `.theme-cinema` on `/` and `.theme-paper` on the research routes, with values as in the brief. Additions: `--link` (cinema `#FFCB7D`), `--danger-surface`, `--info-surface`, `--scrim`, `--accent-border` (paper `#8A5300`).

Fonts: Anybody (variable, wdth and wght) and Atkinson Hyperlegible Next (variable, plus italic) are **self-hosted with `next/font/local`** under `src/fonts/`, with OFL licences, latin subset, taken from the Fontsource npm packages. Reason: Google Fonts was blocked from both build environments, and `next/font/google` downloads at build time. No runtime dependency was added.

Scale: 14 / 16 / 18 / 22 / 28 / 36 / display `clamp(2.5rem, 5vw, 4.5rem)`. Line height 1.5 UI, 1.65 long-form. Space 4–80, radius 20/16/14/10/pill, motion 120/200/320 ms.

### Contrast (WCAG 2.x, measured)

| Pair | Ratio |
|---|---|
| cinema text / surface | 15.8 |
| cinema text-muted / surface | 9.1 |
| cinema text-subtle / surface | 6.3 |
| cinema control-border / surface, raised | 4.1, 3.6 |
| amber accent / surface | 9.9 |
| on-accent / amber | 10.8 |
| cinema link / surface | 11.7 |
| cinema danger / surface | 7.6 |
| sound hues / surface (music, ambience, voice) | 6.0, 11.9, 6.9 |
| text / danger-surface, info-surface (cinema) | 14.0, 13.7 |
| paper text / bg | 16.5 |
| paper text-muted / bg | 7.0 |
| paper focus/link / bg, info-surface | 5.6, 5.2 |
| paper control-border / bg | 4.1 |
| paper danger / bg | 6.2 |
| paper ambience / raised | 4.4 (marks only, never text) |
| amber on paper (fill only) | 1.7: always paired with `#8A5300` border (6.0) and on-accent text |
| old focus ring `#7a934d` | 3.1 (replaced) |

## 3. Before and after screenshots

- Before: `docs/design/baseline-2026-11-15/` (live site, 24 images).
- After: `docs/design/after-2026-11-15/` (local build, 24 images, same routes and sizes).

No route scrolls horizontally at 320 px (checked with `scrollWidth`).

## 4. Changes mapped to findings and principles

| Finding | Change | Principles |
|---|---|---|
| F1 research leaks into viewing | "PHASE 01" removed. Lab becomes a Research menu. Research tools become the **Researcher console**: closed, paper theme, in a separate band after the footer, upcoming-text warning first | N2, N8, attention, mental models |
| F2 hidden film select | Poster rail as a `radiogroup` with arrow keys, coverage badges and soundprints | N6 recognition over recall, N1, information scent |
| F3 tiny type | 14 px floor (only the stimulus "Sample" label stays 13 px, see §5); Atkinson Hyperlegible Next; Anybody display | Perception, inclusiveness |
| F4 controls | 44 px targets, SVG previous/next-sound icons, Speed menu, consistent pill and icon controls | Affordance, mapping, N4/S1, target size |
| F5 invisible hold | Tooltip "Show original captions. Hold to peek." and a demo-only first-use hint (dismissal stored locally) | Gulf of execution, N10 |
| F6 sr-only feedback | Visible "Saved" status in the sheet; HUD for keyboard and quick changes; storage errors shown | N1, S3, Norman feedback |
| F7 settings panel | Sheet with option cards and live sample text, switches with plain helpers, ▿ legend chip, sound style cards, Aa, swatch and backdrop pickers, Reset appearance with Undo, Done | N2, N4, N6, S4, S6, S8 |
| F8 floating "?" | Help moved into the control bar, the same place on every screen | Attention, WCAG 3.2.6 |
| F9 mode errors | Pressed Original pill plus mode badge ("Showing original captions" / "Peeking at original" / "Original captions") | N1, gulf of evaluation |
| F10 invisible markers | Soundprint: hue and shape ticks plus density bars; tooltip shows time and kind only; sound key in sheet and help | Perception, external cognition |
| F11 loading/empty | Skeletons plus "Loading your caption settings…"; coverage badges up front | N1, N9 |
| F12 identity | Night Screening cinema theme, soundprint wordmark, faint grain on the page only | Hedonic quality |
| F13 contrast | Token palette, table above | WCAG 1.4.3 / 1.4.11 |
| F14 mobile | 56 px header with no wrapping; control bar keeps 44 px targets in two rows under the picture | Accessibility, situational impairment |
| F15 credits | One labelled credits block in the footer; one caption note with "About these captions" | N8 |
| F16 dialog consistency | Shared `Sheet` for settings and shortcuts, grouped keycaps, icon close plus Done | N4, S1 |
| F17 research routes | Reading layout with sticky TOC and progress; session setup as a one-page stepped form with review | N5, S4 |
| F18 errors | Plain cause plus next step ("Captions are hidden because their timing doesn't match this video. Reload the page…") | N9 |

## 5. Study-visible changes

All of these are identical across the baseline and personalized conditions unless noted.

1. **Caption stimulus unchanged.** `stimulus.css` reproduces the `bafdfb5` computed caption styles: size, weight, padding, radius, backdrops, colours, `▿`, `♪`, speaker chips, Sample label and outline. The caption font is **pinned to Arial/Helvetica**, because captions used to inherit the body font and the body font changed.
2. **Caption vertical position** still follows `--controls-height`. The new control bar is taller (44 px targets plus soundprint row), so bottom captions sit a little higher than before. Same in both conditions.
3. **Narrow players (< 560 px wide)**: the stage grows so the control bar sits under the picture rather than over it. Bottom captions sit at the bottom of the picture. Same in both conditions.
4. **Settings-open caption shift** uses the 380 px sheet width (was 360). Only reachable where settings are allowed (personalized and demo).
5. **Mode badge** text changed; it is still shown in baseline, as before ("Original captions").
6. **Caption note** under the player ("Sound captions generated and edited by the SceneCaptions team.") is new viewer-facing text. It depends only on the film.
7. **HUD** confirmations for keyboard changes. In baseline only the text-size keys apply, as before.
8. **Original hint** is demo mode only, never in study mode.
9. **Header in study mode**: wordmark only, as before.

## 6. Renamed selectors and updated scripts

| Old | New | Scripts updated |
|---|---|---|
| `<select id="film-choice">` | `#film-choice` is now the `radiogroup`; options are `[role=radio][data-film-id]` | `library-regression.mjs` |
| text "Research tools" | "Researcher console" (`.research-tools` kept) | `dhh-interactions.mjs` |
| select "Reading pace" | radio "Default (17)" etc. | `dhh-phase2.mjs` |
| select "Text colour" / "Backdrop" | radios "White"/"Yellow", "Solid"/"Translucent"/"Outline only" | `dhh-phase2.mjs` |
| select "Text size" | radios "Standard"/"Large"/"Extra large" in group "Text size" | `dhh-interactions.mjs`, `dhh-fullscreen.mjs`, `fixes-2026-10-24/player-regression.mjs` |
| select "Position on the video" | radios "Top"/"Bottom" | `player-regression.mjs` |
| "Reset readability" | "Reset appearance" | `dhh-interactions.mjs` (focus-trap check now includes Done) |
| "Single-key shortcuts" | "Use single-key shortcuts" | `dhh-phase2.mjs` |
| `.sound-markers`, `.sound-tick` | `.soundprint`, `.sound-shape` (`sound-markers.tsx` removed) | none referenced them |
| `main[data-render-count]` | unchanged (now set on `<main>` via closest) | — |

Unchanged on purpose: `button "Caption settings"`, `"Original captions"`, `"Play video"`, `"Keyboard shortcuts"`, `"Close caption settings"`, `dialog "Caption settings"`, `region "Video player"`, radios `/Essential|Balanced|Rich|None|Full stop/`, `"More sound options"`, `"Appearance"`, `#timeline`, `#detail`, `.caption-overlay`, `.caption-lines`, `.dialogue-lines`, `.cue-row`, `.research-tools`, `.video-frame`, `.anchor-toolbar`, `.creator-cue`, every session-setup label, and the CapTune viewer's `combobox "Sound representation"` (it belongs to `/captune`, not the main settings). `.caption-preview-notice` and the October preset buttons were already gone from the app before this redesign.

## 7. Deviations, proposals and known gaps

Deviations, with reasons:
- **Captions button visible label is "Caption settings", not "Captions".** WCAG 2.5.3 (label in name) requires the visible text to match the accessible name, which must stay "Caption settings" for the tests. Accessibility wins.
- **Original button disabled** uses `aria-disabled` so the tooltip can explain why.
- **Researcher console placed after the footer.** §5.2 and §5.8 of the brief conflict; I chose maximum separation from viewing.
- **Session setup is a one-page stepped form**, not a paged wizard. It has a sticky progress indicator, inline validation and a review step, and keeps every field interactable so the existing scripts and labels still work.
- **No "delete saved session" confirmation.** The app has no delete action, and I did not add a new data-deletion feature.
- **Type-styling border keeps its pale stimulus colour.** The optional hue border was not shipped, to avoid changing the stimulus.

Proposals for team sign-off:
- Offer Atkinson Hyperlegible Next as a caption font option.
- Hue-coded type-styling edge on captions.
- Auto-fading controls: not shipped (needs a reserved caption safe area and study-mode rules).
- A real paged wizard for session setup, with script rewrites.

Known gaps and not verified:
- No VoiceOver/NVDA pass, no physical iPhone, no Safari/Firefox, no axe run (not installed).
- `forced-colors`, `prefers-contrast: more`, 200% zoom and text-spacing were implemented but not visually verified.
- The keyboard walkthrough was covered by the scripts above and spot checks (focus returns to the trigger after Done/Esc; the focus trap includes Done), not a complete manual pass.
- Interactive after-screenshots (settings open, Original held, survey, study mode) were checked during development, not archived.
- `dhh-study.mjs` was already failing before the redesign; not investigated.
- `docs/verification/captune-2026-11-03/checks/build.txt` shows an uncommitted whitespace-only change that predates this work; left untouched.
- `src/components/rehearsal-ratings.tsx` is unused (it was before too); left in place.
