# SceneCaptions viewer accessibility implementation

Audited base `15f94cb5cb63322b14bca20d4e59d067af47ee80` from fetched origin/main. The Mac main checkout was clean at `8af68d3`; work is isolated on `codex/viewer-accessibility`. Branch names, reachable log and tracked caption/UI paths showed no existing bilingual implementation. Research summaries and existing source-caption checks ground the scope. Reported viewer needs are design input; engineering checks cannot establish participant approval, reading comfort or acoustic truth.

## Evidence-to-change checklist

| Priority | Reported need or product requirement | Implemented change and evidence |
| --- | --- | --- |
| 1 | Urdu and English access | **Implemented, Urdu review pending.** Independent local UI and caption preferences. The viewer, controls, settings, keyboard help, credits labels and media errors are bilingual. Three edit-hashed draft sidecars cover 151 sound cues and 26 dialogue cues. Captions are hidden with a localized notice if a draft is missing or stale. Live study and reference conditions keep the English source track and separate preferences. |
| 2 | Readable Urdu | **Implemented.** A local Nastaliq font, script isolation, relative sizes, extra line spacing and wrapping. Verified all sizes with real multiline Urdu and synthetic mixed-script overlap. Human reading comfort remains unmeasured. |
| 3 | Recognizable recurring sounds | **Mechanism tested, catalogue annotation pending.** Verified groups require explicit cue IDs, an evidence reference, language-specific labels and a reveal threshold. The label survives reductions and representation changes. Unverified, premature and ambiguous links stay out of playback. No catalogue-wide identity review was available. |
| 4 | Viewer-controlled adaptation | **Implemented.** Off for new/unconfigured viewers, explicit saved true/false values retain their meaning, and manual detail remains available. Fixed/maximum descriptions follow the switch. Study assignment defaults and legacy selection are preserved. |
| 5 | Picture visibility | **Implemented.** Width is bounded to 70–96%, top/bottom controls are retained, and transport stays outside the picture. Tall stacks flow next to the picture in reading order if the picture cannot contain them. Manual placement can still cover faces or action. |
| 6 | Accurate preview | **Implemented.** The main picture shows live cues. An explicit earlier sample appears during a gap. Both use the same timed windows, wording resolver, actual video scale, brackets and appearance renderer. Settings and preview leave the playback clock alone. |
| 7 | Separate dialogue and sounds | **Implemented.** Dialogue and sound stay separate in data and the accessibility tree. Brackets identify sounds independently of colour, with optional visual styling and configurable backdrop. |
| 8 | Calm feedback | **Implemented.** A quiet strip outside the picture shows whether shortening is enabled and marks actual reductions. Sample reductions are identified as samples. The settings legend explains the marker. Feedback avoids a live announcement on every cue. |

## Design route

Impeccable leads with its existing-interface adaptation and hardening guidance. Modern Web Guidance supplies browser primitives, accessibility and text scaling. Web Interface Guidelines supplies focused controls, labels and focus checks. The existing Zone Record design and components supply styling. Emil was considered for interaction timing; this work adds no motion and reuses established focus behavior. Taste and its pinned profiles, frontend-design, UI styling, Oxfords, Hairline and Awesome DESIGN.md would add competing design or system guidance. Image workflows, img2threejs and Apple Design do not fit this browser-only task. Animate UI, Mobbin, React Bits, Lenis, GSAP, VengeanceUI, Uiverse Galaxy, Watermelon UI, ForgeUI, transitions.dev and designlang were considered and add no needed component, reference, motion or extraction. No live Impeccable, workers or hooks.

The platform guidance shaped document and caption language tags, mixed-script isolation, native form controls, focus return, and relative caption sizing. The 320px reflow and target checks were scoped to the viewer. [W3C structural RTL guidance](https://www.w3.org/International/questions/qa-html-dir), [W3C media player guidance](https://www.w3.org/WAI/media/av/player/), [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [WCAG minimum target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

## Main files

- `src/lib/viewer-language.ts`, `src/components/viewer-language.tsx` and the watch route own localized interface text, structural language/direction and the persisted interface choice. The caption profile owns caption language and width. Research tools and Creator/CapTune have their own scope.
- `data/caption-translations/ur/` contains draft text bound to cue IDs, edit timings and source wording. `src/lib/caption-translations.ts` validates coverage, event-line counts and the edit digest before constructing a display track. Credits and source/reference caption files retain their audited provenance.
- `src/lib/caption-recurrence.ts` and the view-time resolver in `src/lib/captions.ts` protect reviewed recurrence labels. The test uses a synthetic known source, a later permitted reveal, and a different sound sharing the same broad key. Production occurrence annotations need listening and source review.
- `src/components/caption-experience.tsx`, `caption-display.tsx` and `caption-settings-panel.tsx` share live and sampled caption presentation. `src/app/viewer-accessibility.css` keeps the controls outside the picture and supports text reflow. The native video-only fullscreen fallback carries the selected language and text, while the operating system owns native styling and placement.
- `public/fonts/noto-nastaliq-urdu-variable.woff2` is Noto Nastaliq Urdu from the Google Fonts snapshot at commit `8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5`. The upstream variable TTF was compressed to WOFF2. SHA-256 `895a175d7f625abef8f2121129b884dfc89ee444414598cb08403d2805eb8c76`. The SIL OFL 1.1 license is adjacent. No npm dependencies were added. [Pinned font source](https://github.com/google/fonts/tree/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/notonastaliqurdu)

## Verification

- Type checking, all 126 Node tests, caption validation and the production build passed. The installed Next launchers emitted a security advisory notice. The first build returned an advisory exit after compiling and generating routes. The same build command passed on retry. Dependency versions stayed fixed. The added Node tests cover both explicit adaptation values, missing-value defaults, the edit guard, all three draft tracks, tight width bounds, reference/study locks, recurrence labels, authentic shortening and window parity. Existing provenance tests passed. The frozen BBB SRT is marked `-text`, and its working-tree Git blob matches the audited revision. Study stimulus and questionnaire files keep their audited content.
- Playwright CLI used headless Google Chrome 131 on macOS, with no film downloads. BBB, Soar and Hair Love used existing local MP4s. Their measured durations matched the prepared edits. Soar and Hair Love requests were routed to the matching local files during verification.
- Tested 360, 390, 768, 1024, 1440 and 1920 CSS px, three caption sizes, multiple width choices, top/bottom placement, fullscreen, language combinations, reload and film switching. Inspected a multiline BBB cue, an action shot and a Hair Love close-up. Manual positioning gives viewers options across scenes.
- Tested keyboard entry, Tab containment, Escape focus return, an emulated touch tap, 320px reflow at 200% root text size, forced colours and reduced motion. Verified a caption-free time before a cue plus localized loading and failed-media states. The overlap screenshot uses real Hair Love footage with a browser-only synthetic dialogue interval and mixed-script text, since the current edit has no timed sound/dialogue overlap.
- A synthetic fixed study session kept the exact English reference, locked caption language and excluded personalized sound controls. The ordinary viewer retained a separately saved Urdu preference and explicit adaptation On. Real playback displaced a sample once a current cue appeared. Synthetic native-fullscreen events produced an Urdu TextTrack.
- The production build rendered separately named Urdu dialogue and sound groups in the accessibility tree and applied RTL at the document level.
- Browser verification scripts, logs and screenshots are in `/Users/hamza/runtimes/skill-setup/scenecaptions-viewer-browser`. Rendered tests cover these cases in Chrome. Physical mobile devices, true OS-level or native video fullscreen, assistive-technology vocalization, Safari/Firefox, all scenes, independent Urdu review and acoustic/recurrence correctness still need verification. The app behavior cannot establish participant outcomes.

## Optional additions awaiting permission

1. Selectable Naskh alternative. Add a licensed font and compare rendering and reading comfort with Urdu readers.
2. Independent sound/dialogue placement. Evaluate simultaneous cues and picture obstruction across screens.
3. Separate descriptive and mood-based music wording. Needs bilingual editorial and soundtrack review.
4. Simpler detail-level names. Validate both language labels for comprehension before replacing the current names.
5. Reviewed speaker labels. Requires verified attribution and timing.
6. Named local profiles. Define shared-device privacy and safe profile switching before implementation.

These six additions remain outside the implementation branch.

