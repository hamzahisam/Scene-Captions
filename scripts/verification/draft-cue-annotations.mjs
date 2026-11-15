import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const tracks = {
  'big-buck-bunny': 'data/source-assisted-captions/big-buck-bunny-controls.json',
  soar: 'data/source-assisted-captions/soar.json',
  'hair-love': 'data/source-assisted-captions/hair-love.json',
  sintel: 'data/captions/sintel.json',
  'tears-of-steel': 'data/captions/tears-of-steel.json'
};

const musicRe = /\b(?:music|song|singing|piano|flute|oboe|melody|tune)\b/i;
const vocalRe = /\b(?:a+h+|ah+|oof+|huh+|hmph+|gasp(?:s|ing|ed)?|sigh(?:s|ing|ed)?|laugh(?:s|ing|ed|ter)?|squeak(?:s|ing|ed|y)?|squeal(?:s|ing|ed)?|snor(?:e|es|ing|ed)?|yawn(?:s|ing|ed)?|meow(?:s|ing|ed)?|hum(?:s|ming|med)?|sniff(?:l(?:e|es|ing|ed)|s|ing|ed)?|cheer(?:s|ing|ed)?|groan(?:s|ing|ed)?|gulp(?:s|ing|ed)?|grunt(?:s|ing|ed)?|chuckle(?:s|ing|ed)?|giggle(?:s|ing|ed)?|shriek(?:s|ing|ed)?)\b/i;
const ambienceRe = /\b(?:wind|water|bird(?:s)?|rustl(?:e|es|ing|ed)?|brook|stream|rain|thunder|ocean|forest)\b/i;

export function classifyLine(text) {
  if (musicRe.test(text)) return 'music';
  if (vocalRe.test(text)) return 'vocal';
  if (ambienceRe.test(text)) return 'ambience';
  return 'sfx';
}

function escapeCsvCell(val) {
  const str = String(val ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

mkdirSync('data/cue-annotations', { recursive: true });

for (const [video_id, path] of Object.entries(tracks)) {
  const data = JSON.parse(readFileSync(path, 'utf8'));

  const sounds = Object.fromEntries(
    data.cues.map((c) => {
      const text = c.reference_text || c.original_text;
      const lines = text.split('\n');
      if (lines.length > 1) {
        const kinds = lines.map((line) => classifyLine(line));
        const cueKind = classifyLine(`${c.sound_key} ${text}`);
        return [c.cue_id, { kind: cueKind, kinds }];
      } else {
        const kind = classifyLine(`${c.sound_key} ${text}`);
        return [c.cue_id, { kind }];
      }
    })
  );

  const dialogue = Object.fromEntries(
    (data.dialogue || []).flatMap((c) => {
      const match = c.text.match(/^([A-Z][A-Za-z ]{0,40}):/);
      return match ? [[c.cue_id, { speaker: match[1] }]] : [];
    })
  );

  const sidecar = {
    video_id,
    status: 'heuristic-draft',
    dialogue_status: 'heuristic-draft',
    sounds,
    dialogue
  };

  writeFileSync(
    `data/cue-annotations/${video_id}.json`,
    JSON.stringify(sidecar, null, 2) + '\n'
  );

  // Produce review CSV per film
  const csvLines = ['cue_id,start,text,proposed kind'];
  for (const c of data.cues) {
    const text = c.reference_text || c.original_text;
    const ann = sounds[c.cue_id];
    const proposedKind = ann.kinds && ann.kinds.length > 0 ? ann.kinds.join('|') : ann.kind;
    csvLines.push(
      `${escapeCsvCell(c.cue_id)},${c.start_s},${escapeCsvCell(text)},${escapeCsvCell(proposedKind)}`
    );
  }
  writeFileSync(`data/cue-annotations/${video_id}.csv`, csvLines.join('\n') + '\n');
}
