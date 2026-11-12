# Hair Love replacement — 12 November 2026

The user approved Hair Love after rejecting Brain Divided. The catalogue now contains Big Buck Bunny, Sintel, Tears of Steel, Soar and Hair Love. Brain Divided remains absent from the film selector. Hair Love is the complete Sony Pictures Animation upload: [publisher source](https://www.youtube.com/watch?v=kNw8V_Fkw28). Actual MP4 duration is 407.881723 seconds (about 6:48).

## Playback and caption source

Prepared H.264/AAC 1280×720 MP4, original English audio, full credits, faststart remux without re-encoding/trimming. The existing Vercel Blob store hosts the 26,522,877-byte file; no YouTube iframe/script or plan upgrade. `media.json` records its SHA-256, decoded duration, dimensions, HTTP 206 response and matching byte prefix.

The authored English VTT supplies 14 non-speech intervals and 26 dialogue intervals, retained at their original millisecond timestamps. A fifteenth sound cue describes singing across the source song intervals; song lyrics are omitted. The tracked VTT omits lyric blocks, and source metadata records both raw-original and filtered-file hashes. Dialogue is fixed independently of personalization. No claim of complete sound coverage or acoustic/listening approval is made.

## Wording and controls

One bounded NVIDIA Nemotron request prepared eleven unique source-bound labels using main-session editorial phrases. Reported usage: 641 prompt + 346 completion = 987 tokens. Supplied approved phrases were retained without changes. No agent, new key, model call during watching or independent review. No claim of verified free entitlement or zero monetary cost.

`approved-phrases.json` and `wording-result.json` pin the run. `scripts/generation/install-hair-love.py` rebuilds the three-level dataset/exports offline using the pinned source manifest and wording records. Expressiveness is punctuation-only; adaptation uses nearby-cue density as a disclosed proxy. Alternate sound spellings fall back to descriptive text when unavailable.

## Verification

- `npm test`: 53/53 pass, including film hash, timing/identity, dialogue preservation, the three SRT exports and detail caps.
- `npm run build`: production compilation, TypeScript and static generation pass.
- Browser: native video time advances; duration matches; zero iframes; all five film choices with Hair Love and without Brain Divided; no main-viewer file inputs. At 0:25, presets visibly resolve to Meowing / A cat meows / A cat makes a meowing sound (with each style's punctuation). Original dialogue appears at about 1:38; cue preview pauses the film and exposes return to saved settings. Detail, expression and adaptation controls are enabled.
- Listening, readability and participant review remain incomplete. Rich wording can still need reading-speed adjustment on short source intervals.
