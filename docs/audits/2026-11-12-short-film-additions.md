# Short-film additions and viewer wording · 12 November 2026

## Current request

User ended further CapTune reproduction work and requested two additional complete
story films, each 5–7 minutes, with existing timed sound-effect captions and three
generated detail levels. Six-minute excerpts and narrated explanatory films were
explicitly rejected. Existing NVIDIA-only/offline constraints were not revoked.

## Completed

Viewer notice, selection button and selection announcement now say “Our generated
subtitles.” The notice offers Essential/Balanced/Rich and existing downloads.
Caption provenance, original references, source credits and validation metadata
remain intact. This wording does not establish independent audio recognition.
The browser regression now targets the new wording.

Verification: 49 Node tests pass; type checking and production build pass. The
existing source-richness browser regression passes, covering actual overlays at
all three levels, original comparison, profile persistence, downloads, switching
existing titles, rehearsal restrictions and narrow layout. Screenshots remain
in ignored `artifacts/source-richness-ui/`. No new-film playback was tested.

## Unfinished: film sourcing and generation

No new video or caption dataset has been added. No generation request was made.
The existing catalogue still contains BBB, Sintel and Tears of Steel. Do not
describe the requested two additions as completed.

The essential unresolved input is two obtainable, matching video and timed SDH
tracks with non-speech cues. A subtitle listing, untimed transcript or a page's
static “caption” field does not establish such a pair.

Sources inspected include:

- [Hair Love, publisher's full film](https://www.youtube.com/watch?v=kNw8V_Fkw28):
  a promising approximately 6:48 story film. Its public watch-page metadata lists
  an English caption track. An ordinary request to that track returned an empty
  response. A separate [untimed transcript](https://www.springfieldspringfield.co.uk/movie_script.php?movie=hair-love)
  includes non-speech labels, but cannot supply exact timings. SUBDL lists an
  English subtitle; its download page returned an access challenge. No challenge
  was bypassed, and no timings were guessed from the transcript.
- [Borrowed Time, creator's page](https://vimeo.com/187257744): story film reported
  as 6:45 in festival material. The creator explicitly prohibits copying and
  re-uploading; this page is not a source authorizing a hosted movie copy. A
  matching obtainable timed English SDH track was not established.
- [Monkaa](https://commons.wikimedia.org/wiki/File:Monkaa.webm): complete 6:02
  story animation with a reusable movie source; an existing timed English
  sound-effect caption track was not established.
- [Colourful](https://commons.wikimedia.org/wiki/File:Seryung_Lee_-_Colourful_(2018).webm):
  reusable 5:33 story animation; usable timed English sound captions not established.
- Spring, Wing It!, Sprite Fright and several Pixar shorts do not fit the stated
  full-film duration, or lack an obtainable matching sound-caption source.
- Get Creative (6:37) and Reticulum Rex (5:42) have existing English timed
  narration subtitles; user rejected this substitution for story sound captions.

Next: obtain two matching pairs, retain originals/provenance, generate three
sound-detail variants without changing dialogue or source timing, integrate the
films with their actual duration/credits, export three SRTs each, and verify
actual playback and title isolation. Source-captions and import helpers already
exist. Do not fabricate captions, silently trim a longer film, reuse another
film's captions or present dialogue-only subtitles as sound-effect coverage.

No named skills, agents, package/model installations, sign-in, cloud inference,
publication, push or deployment occurred. No structural map refresh was run;
older maps remain historical. Temporary research HTTP responses are under the
system temporary directory and were not installed as project data.
