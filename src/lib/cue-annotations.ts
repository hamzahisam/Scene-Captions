import { z } from 'zod';
import type { CaptionVideo } from './captions.ts';

export const cueKindSchema = z.enum(['music', 'sfx', 'vocal', 'ambience']);
export type CueKind = z.infer<typeof cueKindSchema>;

export const annotationStatusSchema = z.enum(['heuristic-draft', 'reviewed']);
export type AnnotationStatus = z.infer<typeof annotationStatusSchema>;

export const soundAnnotationSchema = z.object({
  kind: cueKindSchema,
  kinds: z.array(cueKindSchema).optional(),
  offscreen: z.boolean().optional(),
});
export type SoundAnnotation = z.infer<typeof soundAnnotationSchema>;

export const cueAnnotationsSchema = z.object({
  video_id: z.string(),
  status: annotationStatusSchema,
  dialogue_status: annotationStatusSchema.optional(),
  sounds: z.record(z.string(), soundAnnotationSchema),
  dialogue: z.record(
    z.string(),
    z.object({
      speaker: z.string().min(1).max(80).optional(),
    })
  ),
});
export type CueAnnotations = z.infer<typeof cueAnnotationsSchema>;

export function validateAnnotations(video: CaptionVideo, raw: unknown): CueAnnotations {
  const a = cueAnnotationsSchema.parse(raw);
  if (a.video_id !== video.video_id) {
    throw Error('Annotations belong to another film.');
  }

  const sounds = new Set(video.cues.map((c) => c.cue_id));
  const dialogue = new Set(video.dialogue?.map((c) => c.cue_id));

  if (
    Object.keys(a.sounds).some((id) => !sounds.has(id)) ||
    Object.keys(a.dialogue).some((id) => !dialogue.has(id))
  ) {
    throw Error('Annotations reference unknown cues.');
  }

  // Validate exact per-source-line cardinality for kinds array
  for (const cue of video.cues) {
    const ann = a.sounds[cue.cue_id];
    if (!ann || !ann.kinds) continue;
    const sourceText = cue.reference_text || cue.original_text;
    const lineCount = sourceText.split('\n').length;
    if (ann.kinds.length !== lineCount) {
      throw Error(
        `Cue ${cue.cue_id} kinds array length (${ann.kinds.length}) does not match source line count (${lineCount}).`
      );
    }
  }

  return a;
}

export function speakerText(text: string, speaker?: string): string {
  const prefix = speaker && `${speaker}:`;
  return prefix && text.startsWith(prefix) ? text.slice(prefix.length).trimStart() : text;
}

/**
 * Shared pure helper to map actual displayed lines to sound kinds.
 * Only uses per-line kinds if displayed line count matches kinds array cardinality.
 * If displayed line count does not match (e.g. text was merged), avoids asserting
 * a mixed type for merged text as a safe fallback.
 */
export function mapLinesToKinds(
  lines: string[],
  annotation?: { kind: CueKind; kinds?: CueKind[] }
): (CueKind | undefined)[] {
  if (!annotation) return lines.map(() => undefined);

  if (annotation.kinds && annotation.kinds.length === lines.length) {
    return [...annotation.kinds];
  }

  if (annotation.kinds && annotation.kinds.length > 0) {
    const first = annotation.kinds[0];
    const isUniform = annotation.kinds.every((k) => k === first);
    if (!isUniform) {
      // Mixed kinds: safe fallback to avoid asserting mixed type for merged text
      return lines.map(() => undefined);
    }
    return lines.map(() => first);
  }

  return lines.map(() => annotation.kind);
}

/**
 * Shared pure formatting function providing parity across overlay,
 * native fullscreen text track, and exposure telemetry logs.
 * Preserves musical glyphs per line for lines classified as music.
 */
export function formatSoundCueText(
  text: string,
  annotation?: { kind: CueKind; kinds?: CueKind[]; offscreen?: boolean },
  options?: {
    typeStyling?: boolean;
    markShortened?: boolean;
    adapted?: boolean;
    offscreenLabel?: string;
  }
): string {
  const typeStyling = options?.typeStyling ?? true;
  const lines = text.split('\n');
  const kinds = mapLinesToKinds(lines, annotation);

  const formattedLines = lines.map((line, i) => {
    if (typeStyling && kinds[i] === 'music') {
      return `♪ ${line} ♪`;
    }
    return line;
  });

  let result = formattedLines.join('\n');
  if (typeStyling && annotation?.offscreen) {
    result += ` ${options?.offscreenLabel ?? 'off-screen'}`;
  }
  if (options?.markShortened && options?.adapted) {
    result += ' ▿';
  }
  return result;
}

/**
 * RFC 4180 compliant CSV row parser supporting multiline quoted strings.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentCell);
        currentCell = '';
        rows.push(currentRow);
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentCell);
        currentCell = '';
        rows.push(currentRow);
        currentRow = [];
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

export function escapeCsvCell(val: unknown): string {
  const str = String(val ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Produces an RFC 4180 review CSV string for a film:
 * Columns: cue_id,start,text,proposed kind
 */
export function generateReviewCsv(video: CaptionVideo, annotations?: CueAnnotations): string {
  const header = ['cue_id', 'start', 'text', 'proposed kind'].join(',');
  const lines = [header];

  for (const cue of video.cues) {
    const text = cue.reference_text || cue.original_text;
    const ann = annotations?.sounds[cue.cue_id];
    let proposedKind = '';
    if (ann?.kinds && ann.kinds.length > 0) {
      proposedKind = ann.kinds.join('|');
    } else if (ann?.kind) {
      proposedKind = ann.kind;
    } else {
      proposedKind = 'sfx';
    }

    const row = [
      escapeCsvCell(cue.cue_id),
      escapeCsvCell(cue.start_s),
      escapeCsvCell(text),
      escapeCsvCell(proposedKind),
    ].join(',');
    lines.push(row);
  }

  return lines.join('\n') + '\n';
}

/**
 * Validates and applies a reviewed CSV to produce an updated reviewed CueAnnotations sidecar.
 *
 * Validates BEFORE returning/writing:
 * - Complete known unique cue IDs
 * - Exact source start and text (rejects stale CSV)
 * - Permitted kinds (music, sfx, vocal, ambience)
 * - Exact line counts matching source text
 *
 * Sound review status is updated to 'reviewed'.
 * Dialogue speakers are NOT automatically certified: dialogue_status remains
 * 'heuristic-draft' (or existing dialogue_status) during sound-only review.
 */
export function applyReviewedCsv(
  video: CaptionVideo,
  csvText: string,
  existingAnnotations?: CueAnnotations
): CueAnnotations {
  const rows = parseCsvRows(csvText).filter((r) => r.length > 0 && r.some((c) => c.trim().length > 0));
  if (rows.length === 0) {
    throw Error('CSV file is empty.');
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const cueIdIdx = header.indexOf('cue_id');
  const startIdx = header.indexOf('start');
  const textIdx = header.indexOf('text');
  let kindIdx = header.indexOf('proposed kind');
  if (kindIdx === -1) kindIdx = header.indexOf('proposed_kind');
  if (kindIdx === -1) kindIdx = header.indexOf('kind');
  if (kindIdx === -1) kindIdx = header.indexOf('reviewed kind');
  if (kindIdx === -1) kindIdx = header.indexOf('reviewed_kind');

  if (cueIdIdx === -1 || startIdx === -1 || textIdx === -1 || kindIdx === -1) {
    throw Error('CSV header must contain cue_id, start, text, and proposed kind.');
  }

  const knownCues = new Map(video.cues.map((c) => [c.cue_id, c]));
  const seenCueIds = new Set<string>();
  const allowedKinds = new Set<CueKind>(['music', 'sfx', 'vocal', 'ambience']);
  const newSounds: Record<string, SoundAnnotation> = {};

  for (let rowNum = 2; rowNum <= rows.length; rowNum++) {
    const row = rows[rowNum - 1];
    const cueId = (row[cueIdIdx] || '').trim();
    const rawStart = (row[startIdx] || '').trim();
    const rawText = row[textIdx] ?? '';
    const rawKind = (row[kindIdx] || '').trim();

    if (!cueId) {
      throw Error(`Row ${rowNum}: cue_id is empty.`);
    }

    if (seenCueIds.has(cueId)) {
      throw Error(`Duplicate cue_id "${cueId}" at row ${rowNum}.`);
    }
    seenCueIds.add(cueId);

    const sourceCue = knownCues.get(cueId);
    if (!sourceCue) {
      throw Error(`Unknown cue_id "${cueId}" at row ${rowNum} not in film ${video.video_id}.`);
    }

    // Exact source start validation (reject stale CSV)
    const rowStart = parseFloat(rawStart);
    if (isNaN(rowStart) || Math.abs(rowStart - sourceCue.start_s) > 0.001) {
      throw Error(
        `Stale CSV at row ${rowNum} for cue "${cueId}": start time ${rawStart} does not match source start ${sourceCue.start_s}.`
      );
    }

    // Exact source text validation (reject stale CSV)
    const sourceText = sourceCue.reference_text || sourceCue.original_text;
    if (rawText !== sourceText) {
      throw Error(
        `Stale CSV at row ${rowNum} for cue "${cueId}": text does not match source text.\nCSV:    ${JSON.stringify(rawText)}\nSource: ${JSON.stringify(sourceText)}`
      );
    }

    // Permitted kinds and line counts validation
    const lineCount = sourceText.split('\n').length;
    const kindParts = rawKind.split('|').map((s) => s.trim()) as CueKind[];

    if (kindParts.length === 0 || kindParts.some((k) => !allowedKinds.has(k))) {
      throw Error(
        `Invalid kind "${rawKind}" at row ${rowNum} for cue "${cueId}". Allowed kinds: music, sfx, vocal, ambience.`
      );
    }

    if (kindParts.length !== lineCount) {
      throw Error(
        `Line count mismatch at row ${rowNum} for cue "${cueId}": kind "${rawKind}" specifies ${kindParts.length} line(s) but source text has ${lineCount} line(s).`
      );
    }

    const existingSound = existingAnnotations?.sounds[cueId];
    if (kindParts.length > 1) {
      newSounds[cueId] = {
        kind: kindParts[0],
        kinds: kindParts,
        ...(existingSound?.offscreen !== undefined ? { offscreen: existingSound.offscreen } : {}),
      };
    } else {
      newSounds[cueId] = {
        kind: kindParts[0],
        ...(existingSound?.offscreen !== undefined ? { offscreen: existingSound.offscreen } : {}),
      };
    }
  }

  // Validate complete coverage of all known cues
  for (const cue of video.cues) {
    if (!seenCueIds.has(cue.cue_id)) {
      throw Error(`Incomplete review CSV: missing cue_id "${cue.cue_id}".`);
    }
  }

  // Preserve dialogue; do NOT certify dialogue when sound CSV reviewed
  const dialogue = existingAnnotations?.dialogue ?? {};

  const reviewedAnnotations: CueAnnotations = {
    video_id: video.video_id,
    status: 'reviewed', // Primary root status for sounds
    dialogue_status: existingAnnotations?.dialogue_status ?? 'heuristic-draft', // Keep dialogue_status heuristic-draft
    sounds: newSounds,
    dialogue,
  };

  return cueAnnotationsSchema.parse(reviewedAnnotations);
}
// Speaker names are shown only when the dialogue attribution itself is reviewed.
// `dialogue_status` lets a sound-only review leave dialogue speakers as drafts; older sidecars fall back to `status`.
export function reviewedSpeaker(annotations:CueAnnotations|undefined,cueId:string){const speaker=annotations?.dialogue[cueId]?.speaker;return speaker&&(annotations.dialogue_status??annotations.status)==='reviewed'?speaker:undefined;}
// Reviewed attribution: chip text plus a spoken ": " separator. Unreviewed: the source text is unchanged.
export function dialogueParts(text:string,speaker?:string){return speaker?{speaker,text:speakerText(text,speaker)}:{text};}
export function dialogueNativeText(text:string,speaker?:string){const p=dialogueParts(text,speaker);return p.speaker?`${p.speaker}: ${p.text}`:p.text;}
