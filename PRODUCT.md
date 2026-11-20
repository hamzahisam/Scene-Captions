# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: Deaf and hard-of-hearing (DHH) viewers watching long-form film on a laptop or phone, tuning how sound captions (music, effects, vocal sounds, ambience) are described and shown to suit their own reading pace and preferences. Secondary (not the optimization target for the redesign): researchers running local participant sessions, and study participants completing surveys.

## Product Purpose
SceneCaptions provides adaptive non-speech captions for DHH viewers of long-form video. Viewers control how much sound is described, how it is expressed and how it looks. The same codebase supports local research sessions (fixed conditions, telemetry, surveys) and a CapTune-style creator/viewer workflow. Success: a DHH viewer can read sound captions comfortably and without effort while following the film.

## Positioning
Sound-caption detail, expression and reading pace are viewer-adjustable in-frame, with the original captions always one click or hold away; all data stays in the browser and no model inference runs while viewing.

## Operating Context
Watching a film in a browser, often fullscreen; the caption settings panel opens inside the fullscreen boundary. Study sessions are local and browser-only (session codes, checkpoints, end surveys). Keyboard-only use and screen readers are part of normal operation.

## Capabilities and Constraints
Next.js app: `/` viewer, `/session` study setup, `/creator` and `/captune` authoring/viewer, `/experiment`. Captions, annotation sidecars and CapTune data are protected and must not change (53 files checked against hashes at `bafdfb5`). No new runtime dependencies or fonts were permitted in the prior work; this is not confirmed for the redesign and is an open decision. No push or deploy without explicit request. Existing flows (study session creation, resume, surveys, researcher unlock, original-caption override) must keep working. Confirmed by the user for the redesign: nothing is frozen visually; study-validity implications of visual changes are the user's to manage.

## Brand Commitments
Name: SceneCaptions. Viewer-facing language talks about sounds and preferences. Existing `DESIGN.md` principles (readable captions, visible focus, always-visible playback controls, no animation needed to understand the UI) are product-level accessibility commitments carried into any redesign. The existing branch `origin/ui-redesign-2026` is treated by the user as an anti-reference, not a base.

## Evidence on Hand
Five catalogue films with prepared captions and cue sidecars; synthetic participant data only. No participant study has run. No testimonials, customers or benchmarks exist and none may be invented.

## Product Principles
1. The film and its captions are the interface; everything else recedes.
2. Caption readability and keyboard access outrank decoration.
3. Viewer control is explicit and reversible: original captions are one gesture away.
4. Research affordances never leak into the viewer's experience.

## Accessibility & Inclusion
Primary audience is DHH. Visible keyboard focus, text alternatives for sound type (not colour alone), reduced-motion support, contrast-safe caption backings, and screen-reader-compatible controls are required.
