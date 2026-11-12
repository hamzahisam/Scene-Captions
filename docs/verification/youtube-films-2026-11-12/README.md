# Two full short films and viewer controls

## Sources and implementation

- [Soar — TheCGBros / Alyce Tzue](https://www.youtube.com/watch?v=UUlaseGrkLc), API duration 375 seconds; 49 sound-caption intervals.
- [Brain Divided — TheCGBros / Ringling](https://www.youtube.com/watch?v=JuyB7NO0EYY), API duration 302 seconds; 18 sound-caption intervals. Dialogue remains in the original YouTube caption track.

English transcript exports were obtained from the publisher-hosted videos. Filtered sound references, credits, transcript hashes and timing methods are pinned in `data/sources/youtube/`. Exported starts have whole-second precision and no ends: display ends are derived from the next distinct sound start, capped at six seconds. These are approximate timing drafts. No exact source timing, acoustic verification, participant approval or independent review is claimed.

Both films use the YouTube IFrame API. Generated sound captions occupy a separate strip, keeping publisher controls unobstructed. Original native captions remain available. Media is not reuploaded. Playback errors offer the publisher link; duration mismatch hides the sound track.

## Wording preparation and limits

A rejected unconstrained pilot completed two NVIDIA requests (8,558 total reported tokens); unsupported acoustic additions prevented installation. Main-session editorial preparation then supplied source-bound three-level phrases for 54 unique sound labels. One bounded NVIDIA Nemotron request selected wording (4,854 reported tokens), retaining the supplied phrases. Total: three completed requests, 13,412 reported tokens. No claim of free entitlement or zero monetary cost is made. No agents were used.

`wording-review.json` retains the approved phrases, final usage and installed track hashes. Full raw transcripts and request/response artifacts remain in ignored local artifacts. `install-viewer-styles.py` is a local, network-free installer of this specifically reviewed run and requires those saved inputs. BBB reuses its existing three-detail wording. All three prepared sound tracks use punctuation-only expression and a disclosed nearby-cue-density adaptation proxy; they do not infer emotion or audiovisual scene load.

## Verification

- `npm test`: 52/52 passed, including source identity/timing, simultaneous lines, all three SRT exports, profile detail cap and no invented movie-byte hash.
- `npm run build`: production compilation, TypeScript and static page generation passed.
- Browser checks: five film choices; both new films load; playback time advances; paused cue seeking stays paused; film switching replaces the embed; Essential/Balanced/Rich visibly change captions; expression punctuation changes; adaptation and five-second preview work; top placement and extra-large text apply; representation choices are present; main viewer has zero file inputs.
- Main-viewer upload UI removed. The separate creator authoring route is unchanged.
- Listening, fine timing, reading-speed and DHH review remain incomplete. These are source-assisted drafts, not exact reproduction of the paper's live/model procedure.
