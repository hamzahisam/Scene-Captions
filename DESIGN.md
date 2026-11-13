# SceneCaptions design foundation

The player is the primary surface: a quiet, readable viewing workspace for DHH viewers, not a marketing landing page. A warm-neutral canvas, muted green controls and a dark video frame keep attention on the story and captions. Serif headings add character without changing the highly legible caption and control text.

The design workflow considered a cinema-wide player with controls below and a player with a right-hand settings panel. The latter gives immediate preview and explicit application of preferences while preserving the video's space; on small screens it stacks beneath the player. Controls and longer content remain left-aligned; caption text is centered inside an opaque high-contrast backing.

Reuse the CSS variables in src/app/globals.css for color, borders, type and surfaces. Keep viewer-facing language about sounds and preferences. Distinguish the fixed baseline, saved profile and unapplied preview. Never redesign these patterns merely to add a feature.

Caption readability, visible keyboard focus, original-caption override and explanatory disclosure outrank decorative effects. Playback controls are always visible. Readability controls exist in both conditions. Sound cues are also available as a navigable text timeline. No animation is needed to understand the interface; reduced-motion preferences disable transitions and smooth scrolling.

Demo notes must remain visible until verified study material replaces the illustrative cues. Rehearsal recording stays opt-in, local and separate from actual approved study consent.

## DHH upgrade — 13 November 2026

The current viewer uses a single-column film surface. CC opens caption settings inside the fullscreen boundary; narrow layouts place the panel below the picture. Amount, punctuation and appearance are independent. Changes apply immediately; a labelled sample stays in place without a seek or pause. Research controls and future sound text are in a collapsed drawer and hidden in study mode. Original supports click and temporary hold comparison.

Caption size follows the player container, with reserved space for wrapped transport controls. Sound type uses glyphs/shapes alongside colour. Preset backdrops preserve contrast; outline mode explicitly cannot guarantee it against every picture. Existing palette and visible controls remain. No new font is bundled. These supersede the older sidebar/draft-preview descriptions above.
