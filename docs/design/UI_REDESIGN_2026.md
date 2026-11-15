# SceneCaptions UI redesign 2026: "Night Screening"

Branch `ui-redesign-2026`, cut from `bafdfb5` (same commit as `origin/main` and
`origin/dhh-ux-upgrade` on 15 November 2026). This file is the running design
record. It grows one section per phase.

---

## Phase 0: audit check, baseline, tokens, wireframe

Status: awaiting sign-off on tokens and wireframe before any component work.

### 0.1 Baseline

- `npm run typecheck`: pass. `npm test`: 69 of 69 pass.
- `npm run build` not run in Phase 0 (no code changed). It runs at the end of every phase.
- Screenshots: `docs/design/baseline-2026-11-15/{1440x900,1024x768,390x844,360x740}-{watch,experiment,session,creator,captune,methodology}.jpg`.
  These come from the live deployment (https://scene-captions.vercel.app), which
  matches this commit's UI. The shell on the dev machine has no browser, so they
  were taken in the desktop app's browser with viewport emulation. The pane scales
  large viewports down, so 1440 and 1024 images are reduced resolution. They are
  layout evidence, not pixel-level contrast evidence.
- Not captured yet: interactive states (settings open, Original held, study mode,
  surveys, fullscreen). These are captured for before/after in Phase 6, from the
  same live build, so the comparison is like for like.

### 0.2 Audit check against the code

All 18 findings are confirmed in source at `bafdfb5`.

| ID | Confirmed by |
|---|---|
| F1 | `header.tsx`: `phase-label` "PHASE 01 / Research prototype", `<details className="lab-nav">` with Session setup / Creator / Anchored viewer, "Experimental plan" link. `video-player.tsx` sr-only description says research tools hold upcoming sound text. |
| F2 | `screening-room.tsx`: `<select id="film-choice">`, " (dialogue only)" appended to option text. |
| F3 | `globals.css`: body 14 px, Georgia h1, many 8–11 px rules (`.film-kicker` 9 px, `.page-footer p` 9 px, `.time-code` 10 px, `.transport select` 10 px, mobile down to 8 px). |
| F4 | `player-controls.tsx`: `↶`/`↷` as button content; `.icon-button` 34 px (28×30 under 500 px); speed `<select>` transparent 10 px; `CC` (`.cc-button`) vs `.original-video` styled differently. |
| F5 | `original-button.tsx`: 350 ms hold timer; no visible hint. |
| F6 | `workspace.tsx` sets "Caption preferences saved."; `video-player.tsx` sets "Amount: …", "Text size: …" into notices rendered only in live regions. |
| F7 | Settings panel structure and labels as described (checked in `caption-settings-panel.tsx`, `caption-style-controls.tsx`, `caption-readability.tsx`). |
| F8 | `video-player.tsx`: `<button className="shortcut-help-trigger">?</button>` positioned over the picture. |
| F9 | Original state shown only by the small top-left badge. |
| F10 | `sound-markers.tsx` markers are `aria-hidden`, white, shape varies by kind. Visible in the 390 px screenshot as a white strip over the timeline. |
| F11 | "Loading saved settings…" as bare text. |
| F12 | Sage/cream palette, Arial body, Georgia display. |
| F13 | `#7e8d72` (TOC numbers), `#75855c` (brand period), `#7a934d` (focus ring) measure about 3.1–3.6:1 on the page background. |
| F14 | At 390 px the header measures about 101 px tall with nav on a second row; transport targets 28×30 px; speed text 9 px. |
| F15 | Credit repeated in h1 block, `.film-footnote` with leaf icon, and footer, joined with middle dots. |
| F16 | Shortcut help uses the settings panel class, closes with text button. |
| F17 | Session setup is one long form (see 1440 screenshot). |
| F18 | Viewer-facing timing mismatch message as quoted. |

Additional observations, not new findings:

- CSS is minified onto very long lines in `globals.css` (one rule block per line,
  some lines over 20 KB). `.watch-layout` is defined in three places (lines 2, 4, 29)
  plus a fourth override for the narrow breakpoint, and the empty
  `.caption-overlay.large p{}` / `.extra-large p{}` blocks appear in four places.
  Phase 1 replaces this with layered, readable CSS.
- In `.lab-nav` the `<summary>` text renders larger than sibling links (14 px vs
  12–13 px), visible in all mobile screenshots.

### 0.3 Selectors

- `#film-choice` is used by `scripts/verification/library-regression.mjs` and
  `scripts/verification/dhh-study.mjs`. Both will be updated when the rail replaces
  the select (Phase 2).
- "Apply preferences", "Follow cue density" and "Choose caption JSON" appear in
  eight older scripts (`browser-smoke.mjs`, `audit-2026-10-24/*`,
  `fixes-2026-10-24/player-regression.mjs`, `source-richness-regression.mjs`,
  `media-only-regression.mjs`, `library-regression.mjs`,
  `nim-phase1-comparison.mjs`) but in no file under `src/`. Those flows were removed
  in the 13 November upgrade, so those script steps were already dead before this
  redesign. Recommendation: leave the historical scripts as recorded evidence and
  don't count them as regressions. `player-regression.mjs` and `browser-smoke.mjs`
  are named in the acceptance criteria. I'll report which of their steps still run
  rather than rewrite them.
- "Sound representation" combobox: will become a radio group "Sound style"
  (brief 5.5). That needs a script update (3 references) in Phase 4.

### 0.4 Fonts

Both are available through `next/font/google` in Next 16.4.2, so no self-hosting
is needed:

- **Anybody**: variable, `wdth` 50–150, `wght` 100–900.
- **Atkinson Hyperlegible Next**: variable, `wght` 200–800.

Caveat: `next/font/google` downloads the files during `next build`. Vercel builds
are fine. A fully offline local build would fail at the font step. `DESIGN.md`
currently says "No new font is bundled". That line will be superseded and the
change recorded.

### 0.5 Token sheet (proposed for Phase 1)

Contrast was recomputed with the WCAG 2.x relative-luminance formula. All values
are as in the brief, with measured ratios.

**Cinema theme (viewer `/`)**

| Token | Value | on `--bg` #100D22 | on `--surface` #1A1633 | on `--surface-raised` #252047 | Use |
|---|---|---|---|---|---|
| `--text` | #F5F2FF | 17.3 | 15.8 | 13.8 | body, titles, played progress |
| `--text-muted` | #BDB6E0 | 9.9 | 9.1 | 7.9 | secondary text, credits |
| `--text-subtle` | #9C95C8 | 6.8 | 6.3 | 5.5 | meta, 14 px minimum |
| `--control-border` | #7A73AD | 4.4 | 4.1 | 3.6 | input/toggle boundaries (needs 3:1) |
| `--accent` / `--focus` | #FFB547 | 10.8 | 9.9 | 8.7 | primary action, selection, focus |
| `--on-accent` | #100D22 | 10.8 on amber | | | text on amber |
| `--danger` | #FF8A7A | 8.3 | 7.6 | 6.7 | errors |
| `--sound-effect` ◆ | #FFB547 | 10.8 | 9.9 | 8.7 | |
| `--sound-music` ● | #FF5C9A | 6.6 | 6.0 | 5.3 | |
| `--sound-ambience` ■ | #5BE7FF | 13.0 | 11.9 | 10.4 | |
| `--sound-voice` ▲ | #8F9CFF | 7.6 | 6.9 | 6.1 | |
| `--hairline` | rgb(245 242 255 / .10) | decorative only | | | |

**Paper theme (research routes)**

| Token | Value | on `--bg` #FAF8FF | on `--surface` #FFF | on `--surface-raised` #F1EEFA | Use |
|---|---|---|---|---|---|
| `--text` | #1A1633 | 16.5 | 17.4 | 15.2 | |
| `--text-muted` | #575080 | 7.0 | 7.3 | 6.4 | |
| `--control-border` | #7A73AD | 4.1 | 4.3 | 3.8 | |
| `--focus` / `--link` | #4A55D6 | 5.6 | 5.9 | 5.2 | |
| `--danger` | #B3261E | 6.2 | 6.5 | 5.7 | |
| `--sound-effect` | #8A5300 | 6.0 | 6.3 | 5.5 | also the amber-button border |
| `--sound-music` | #C2185B | 5.6 | 5.9 | 5.1 | |
| `--sound-ambience` | #007A8C | 4.8 | 5.1 | 4.4 | marks only; never 14 px text on raised |
| `--sound-voice` | #4A55D6 | 5.6 | 5.9 | 5.2 | |
| `--accent` | #FFB547 | 1.7 | | | fill only, always with #8A5300 1 px border and `--on-accent` text |

Old values for comparison: `#7a934d` focus ring 3.1:1, `#7e8d72` 3.2:1,
`#75855c` 3.6:1.

**Caption stimulus (unchanged):** `#080c08` solid, `rgba(0,0,0,.6)` translucent,
white, `#ffeb3b`. System sans. Container-query sizes. `tests/appearance.test.ts`
covers these and is not touched.

**Type scale** (16 px root): 0.875rem (14, meta floor) · 1rem (16, UI/body) ·
1.125rem (18, long-form) · 1.375rem · 1.75rem · 2.25rem · display
`clamp(2.5rem, 5vw, 4.5rem)`. Line height 1.5 UI, 1.65 long-form, measure ≤ 70ch.
Display: Anybody, wordmark wght 750 / wdth 125, card titles wght 700 / wdth 85.
Text/UI: Atkinson Hyperlegible Next. Tabular figures for time codes.

**Space:** 4 8 12 16 20 24 32 40 56 80.
**Radius:** player 20, sheet 16, card 14, control 10, chip/toggle pill, caption backdrop unchanged.
**Elevation:** lightness steps plus `inset 0 1px 0 rgb(255 255 255 / .06)`; floating sheet `0 24px 48px -12px rgb(5 3 15 / .6)`.
**Motion:** 120 / 200 / 320 ms, `cubic-bezier(.2,.8,.2,1)`, all off under reduced motion.
**Focus over video:** 3 px amber outline + 3 px `--bg` halo.

CSS layer order: `@layer tokens, base, layout, components, research, overrides;`
split into `src/styles/*.css` imported from `globals.css`.

### 0.6 Watch page wireframe (demo mode)

Desktop, 1440 wide, content max ~1200:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [▮▮▮▮] scenecaptions                                   Watch   Research ▾    │ 64px
├──────────────────────────────────────────────────────────────────────────────┤
│ Choose a film                                                                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────  │
│ │   poster     │ │   poster     │ │   poster     │ │   poster     │ │ poste  │ ← scroll-snap,
│ │          ✓   │ │              │ │              │ │              │ │        │   next card
│ ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤ ├─────── │   peeks
│ │Big Buck Bunny│ │Sintel        │ │Tears of Steel│ │Soar          │ │Hair Lo │
│ │Blender, 2008 │ │Blender, 2010 │ │Blender, 2012 │ │…             │ │…       │
│ │[Sound capt.] │ │[Dialogue subt│ │[Dialogue subt│ │[Sound capt.] │ │[Sound  │
│ │▁▃◆▂●▅■▁▲▂◆▃  │ │ only]        │ │ only]        │ │▂◆▁●▃■▂▁◆     │ │▁●▂◆    │ ← soundprint
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └─────── │   (none for
│  amber 2px outline = selected     role=radiogroup "Choose a film", ←/→ keys   │   dialogue-only)
│                                                                              │
│ Big Buck Bunny                                    ← h1, Anybody              │
│ Blender Foundation, 2008                          ← --text-muted, one line   │
│ ╭──────────────────────────────────────────────────────────────────────────╮ │
│ │ ┌──────────────────────────┐                                             │ │
│ │ │◑ Showing original captions│  (only when Original on)  ┌ Detail: Rich ┐ │ │ ← HUD top-centre
│ │ └──────────────────────────┘                            └──────────────┘ │ │   1.2 s
│ │                                                                          │ │
│ │                              ( ▶ )  72px amber                           │ │
│ │                               Play                                       │ │
│ │                                                                          │ │
│ │                    ┌───────────────────────────┐                         │ │
│ │                    │   [soft piano music]      │  ← caption overlay,     │ │
│ │                    └───────────────────────────┘    unchanged stimulus   │ │
│ │░░░░░░░░░░░░░░░░░░░░░░░░ solid scrim, ~92% velvet ░░░░░░░░░░░░░░░░░░░░░░░░│ │
│ │ ◆  ●   ■ ◆ ▲    ●●  ◆  ■   ▲ ◆     ●  ◆ ■      ← ticks: hue + shape      │ │
│ │ ▁▂▃▂▁▁▃▅▃▂▁▂▂▁▃▄▂▁▁▂▃▂▁ density bars (low opacity)                       │ │
│ │ ━━━━━━━━━━━━━━━━━━●───────────────────────────────────────────  #timeline │ │
│ │ [▶] [|◀♪] [♪▶|] [🔊]  1:02 / 9:56          [1×▾] [◑ Original] [CC Captions] [?] [⛶] │
│ │  44×44 targets, 16px tabular time          ≥900px player: labels shown    │ │
│ ╰──────────────────────────────────────────────────────────────────────────╯ │
│ Sound captions generated and edited by the SceneCaptions team                │
│ ▸ About these captions        (source + licence; experimental warning here)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ More of the story. On your terms.                                            │
│ Film     Big Buck Bunny, Blender Foundation, 2008, CC BY 3.0 (link)          │
│ Captions Demuxed big-buck-captions (link), licence (link)                    │
│ A research prototype. Captions are prepared in advance; nothing is generated │
│ while you watch.                                                             │
╞══════════════════════════════════════════════════════════════════════════════╡
│ PAPER THEME BAND                                                             │
│ ▸ Researcher console                                                         │
│   Contains upcoming caption text. Close this before a participant watches.   │
│   (closed by default; inside: Personalized | Reference baseline, provenance  │
│    + SRT/JSON downloads, sound timeline .cue-row list, rehearsal controls)   │
└──────────────────────────────────────────────────────────────────────────────┘
```

Settings open on a wide player (≥ 560 px): the sheet sits inside the frame on
the right and captions shift left, as they do now.

```
╭──────────────────────────────────────────────────────────────────────────╮
│                                        ┌────────────────────────────────┐│
│                                        │ Caption settings   ✓Saved  [✕] ││
│   ┌───────────────────────┐            │ Amount of detail               ││
│   │ Sample                │            │ ┌────────────────────────────┐ ││
│   │ [birds chirping]      │            │ │ Essential  Just the sound  │ ││
│   └───────────────────────┘            │ │   [birds]                  │ ││
│                                        │ ├────────────────────────────┤ ││
│                                        │ │ Balanced ✓ Sound + source  │ ││
│                                        │ │   [birds chirping]         │ ││
│                                        │ ├────────────────────────────┤ ││
│                                        │ │ Rich       More context    │ ││
│                                        │ └────────────────────────────┘ ││
│                                        │ Help me keep up        (●──)   ││
│                                        │  [▿ shortened]                 ││
│                                        │ ▸ More sound options           ││
│                                        │ ▸ Appearance                   ││
│                                        │            [ Done ]            ││
│ ━━━━━━━●──────────────────────────────  └────────────────────────────────┘│
│ [▶][|◀♪][♪▶|][🔊] 1:02 / 9:56     [1×▾][◑ Original][CC Captions●][?][⛶]   │
╰──────────────────────────────────────────────────────────────────────────╯
```

Mobile, 390 wide:

```
┌──────────────────────────────────┐
│[▮▮▮▮] scenecaptions   [≡ Research]│ 56px, no wrap
├──────────────────────────────────┤
│ Choose a film                    │
│ ┌──────────────────────┐ ┌────── │ cards ~70vw
│ │ poster             ✓ │ │ post  │
│ │ Big Buck Bunny       │ │ Sinte │
│ │ Blender, 2008        │ │ Blend │
│ │ [Sound captions]     │ │ [Dial │
│ │ ▁◆▂●▃■▁▲             │ │       │
│ └──────────────────────┘ └────── │
│ Big Buck Bunny                   │
│ Blender Foundation, 2008         │
│╭────────────────────────────────╮│
││        video 16:9              ││
││   ┌──────────────────┐         ││
││   │ [birds chirping] │         ││
││   └──────────────────┘         ││
│├────────────────────────────────┤│ controls below picture
││ ◆ ●  ■ ◆ ▲  ●  (ticks)         ││ on narrow players so
││ ━━━━━━━●─────────────────────  ││ they don't cover it
││ [▶][|◀♪][♪▶|][🔊] 1:02 / 9:56  ││ row 1, 44px
││ [◑][CC][?][⛶][⋯ speed]         ││ row 2, 44px
│╰────────────────────────────────╯│
│ ┌ Caption settings (bottom sheet)┐│ below video when open
│ └────────────────────────────────┘│
│ Sound captions generated and …   │
│ ▸ About these captions           │
└──────────────────────────────────┘
```

The narrow layout moves the control bar below the picture. Right now on phones
the controls cover about a third of the picture (390 px baseline). Below the
picture, captions and controls never collide and the whole frame stays visible.
Fullscreen keeps the overlay bar. This changes where captions sit relative to the
picture edge on phones, so it goes under "Study-visible changes" and needs your
OK (see decisions).

### 0.7 Decisions needed before Phase 1

1. Tokens and type scale as above: approve or adjust.
2. Mobile control bar below the picture (non-fullscreen, player width < 560 px):
   yes, or keep it overlaid with 44 px targets as the brief describes.
3. Committing: git on the shared folder can't delete its own lock files until
   file deletion is allowed for `Scene-Captions`. The per-phase commits need that
   permission once. Branch creation already worked.
