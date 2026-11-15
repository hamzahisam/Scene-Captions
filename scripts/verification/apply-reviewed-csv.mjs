#!/usr/bin/env node
/**
 * CLI tool to validate and apply a reviewed CSV to cue annotation sidecars.
 *
 * Usage:
 *   node scripts/verification/apply-reviewed-csv.mjs <csv-path> [video-id] [--check]
 *   node scripts/verification/apply-reviewed-csv.mjs --film <video-id> --csv <csv-path> [--check]
 *
 * Validates BEFORE writing:
 *   1. Complete known unique cue IDs (no missing, extra, or duplicate IDs)
 *   2. Exact source start and text (rejects stale CSV)
 *   3. Permitted kinds (music, sfx, vocal, ambience)
 *   4. Exact per-line cardinality for multi-line cues
 *
 * On complete valid review:
 *   - Sets primary sound status to 'reviewed'
 *   - Keeps dialogue_status as 'heuristic-draft' (dialogue review is separate)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
  applyReviewedCsv,
  validateAnnotations
} from '../../src/lib/cue-annotations.ts';

const tracks = {
  'big-buck-bunny': 'data/source-assisted-captions/big-buck-bunny-controls.json',
  soar: 'data/source-assisted-captions/soar.json',
  'hair-love': 'data/source-assisted-captions/hair-love.json',
  sintel: 'data/captions/sintel.json',
  'tears-of-steel': 'data/captions/tears-of-steel.json'
};

const args = process.argv.slice(2);
let csvPath = '';
let videoId = '';
let checkOnly = false;
let outPath = '';

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--check' || arg === '--dry-run') {
    checkOnly = true;
  } else if (arg === '--film' && i + 1 < args.length) {
    videoId = args[++i];
  } else if (arg === '--csv' && i + 1 < args.length) {
    csvPath = args[++i];
  } else if (arg === '--out' && i + 1 < args.length) {
    outPath = args[++i];
  } else if (!arg.startsWith('-')) {
    if (!csvPath) csvPath = arg;
    else if (!videoId) videoId = arg;
  }
}

if (!csvPath) {
  console.error('Usage: node scripts/verification/apply-reviewed-csv.mjs <csv-path> [video-id] [--check]');
  process.exit(1);
}

// Infer videoId from CSV filename if not explicitly provided
if (!videoId) {
  const name = basename(csvPath, '.csv');
  for (const id of Object.keys(tracks)) {
    if (name === id || name.startsWith(`${id}-`) || name.startsWith(`${id}.`)) {
      videoId = id;
      break;
    }
  }
}

if (!videoId || !tracks[videoId]) {
  console.error(`Unknown or unspecified film ID: "${videoId}". Available films: ${Object.keys(tracks).join(', ')}`);
  process.exit(1);
}

const trackPath = tracks[videoId];
if (!existsSync(trackPath)) {
  console.error(`Track file not found: ${trackPath}`);
  process.exit(1);
}

if (!existsSync(csvPath)) {
  console.error(`CSV file not found: ${csvPath}`);
  process.exit(1);
}

try {
  const videoData = JSON.parse(readFileSync(trackPath, 'utf8'));
  const csvText = readFileSync(csvPath, 'utf8');

  const sidecarPath = outPath || `data/cue-annotations/${videoId}.json`;
  let existingAnnotations = undefined;
  if (existsSync(sidecarPath)) {
    existingAnnotations = JSON.parse(readFileSync(sidecarPath, 'utf8'));
  }

  // Validate and produce reviewed sidecar
  const reviewed = applyReviewedCsv(videoData, csvText, existingAnnotations);

  // Validate schema and line cardinality
  validateAnnotations(videoData, reviewed);

  if (checkOnly) {
    console.log(`Validation succeeded for ${videoId} (${videoData.cues.length} cues). Check only mode; no files written.`);
    process.exit(0);
  }

  writeFileSync(sidecarPath, JSON.stringify(reviewed, null, 2) + '\n');
  console.log(`Successfully applied reviewed CSV to ${sidecarPath} (status: reviewed, dialogue_status: ${reviewed.dialogue_status}).`);
} catch (err) {
  console.error(`Failed to apply reviewed CSV: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
