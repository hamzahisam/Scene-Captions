// Demo/lab technical rehearsals: unique per-run IDs, a small persistent index, legacy detection and deletion.
// Pure over a key-value store (no React). Study sessions never use this module; they keep their session.id key.
import {TelemetryRecorder} from './telemetry-storage.ts';
import type {TelemetryContext} from './telemetry.ts';

export type RehearsalKind = 'demo' | 'lab';
export type RehearsalStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & {keys: () => string[]};

export type RehearsalIndexEntry = {id: string; kind: RehearsalKind; filmId: string; createdAt: string | null; legacy: boolean};
export type RehearsalLogSummary = RehearsalIndexEntry & {recording: boolean; available: boolean; chunks: number; elapsed_ms: number};

export const REHEARSAL_INDEX_KEY = 'scenecaptions.rehearsal-index.v1';
const MANIFEST_PREFIX = 'scenecaptions.telemetry.v2.';
const UUID_SUFFIX = /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHUNK_SUFFIX = /\.\d+$/;

export function randomUuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const prefixOf = (kind: RehearsalKind) => (kind === 'lab' ? 'lab' : 'rehearsal');

/** A new rehearsal ID is unique per run: `<prefix>-<film>-<uuid>`. */
export function newRehearsalId(kind: RehearsalKind, filmId: string, uuid: string): string {
  return `${prefixOf(kind)}-${filmId}-${uuid}`;
}

/** Parses an ID written by this module or by the earlier fixed `rehearsal-<film>` / `lab-<film>` scheme. */
export function parseRehearsalId(id: string): {kind: RehearsalKind; filmId: string; legacy: boolean} | null {
  const m = /^(rehearsal|lab)-(.+)$/.exec(id);
  if (!m) return null;
  const rest = m[2];
  const uuid = UUID_SUFFIX.exec(rest);
  const filmId = uuid ? rest.slice(0, -uuid[0].length) : rest;
  if (!filmId) return null;
  return {kind: m[1] === 'lab' ? 'lab' : 'demo', filmId, legacy: !uuid};
}

export function rehearsalContext(id: string, filmId: string, appVersion: string): TelemetryContext {
  return {session_id: id, participant_id: null, design: 'rehearsal', assigned_condition: 'personalized', sequence_index: 0, film_id: filmId, app_version: appVersion};
}

export function browserRehearsalStore(): RehearsalStore {
  return {
    getItem: k => localStorage.getItem(k),
    setItem: (k, v) => localStorage.setItem(k, v),
    removeItem: k => localStorage.removeItem(k),
    keys: () => Object.keys(localStorage),
  };
}

const manifestKey = (id: string) => MANIFEST_PREFIX + id;

/** IDs that have a manifest in storage (chunk keys excluded), restricted to rehearsal/lab IDs. */
export function scanRehearsalIds(store: RehearsalStore): string[] {
  return store.keys()
    .filter(k => k.startsWith(MANIFEST_PREFIX))
    .map(k => k.slice(MANIFEST_PREFIX.length))
    .filter(id => !CHUNK_SUFFIX.test(id) && parseRehearsalId(id) !== null);
}

function isEntry(x: unknown): x is RehearsalIndexEntry {
  const e = x as RehearsalIndexEntry;
  return !!e && typeof e.id === 'string' && (e.kind === 'demo' || e.kind === 'lab') && typeof e.filmId === 'string' && typeof e.legacy === 'boolean' && (e.createdAt === null || typeof e.createdAt === 'string');
}

export function readIndex(store: RehearsalStore): {entries: RehearsalIndexEntry[]; corrupt: boolean; raw: string | null} {
  const raw = store.getItem(REHEARSAL_INDEX_KEY);
  if (raw === null) return {entries: [], corrupt: false, raw};
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isEntry)) return {entries: parsed, corrupt: false, raw};
  } catch { /* fall through to corrupt */ }
  return {entries: [], corrupt: true, raw};
}

function writeIndex(store: RehearsalStore, entries: RehearsalIndexEntry[]) {
  store.setItem(REHEARSAL_INDEX_KEY, JSON.stringify(entries));
}

/** Adds or keeps an index entry. An unreadable index is backed up before it is replaced, never silently dropped. */
export function touchIndexEntry(store: RehearsalStore, entry: RehearsalIndexEntry) {
  const {entries, corrupt, raw} = readIndex(store);
  if (corrupt && raw !== null) store.setItem(`${REHEARSAL_INDEX_KEY}.corrupt`, raw);
  const existing = entries.find(e => e.id === entry.id);
  const next = entries.filter(e => e.id !== entry.id);
  next.push(existing ? {...existing, ...entry, createdAt: existing.createdAt ?? entry.createdAt} : entry);
  writeIndex(store, next);
}

export function removeIndexEntry(store: RehearsalStore, id: string) {
  const {entries, corrupt, raw} = readIndex(store);
  if (corrupt && raw !== null) store.setItem(`${REHEARSAL_INDEX_KEY}.corrupt`, raw);
  if (entries.some(e => e.id === id)) writeIndex(store, entries.filter(e => e.id !== id));
}

/** Adds index entries for legacy or unindexed logs already in storage. Nothing is rewritten or removed. Returns how many were added. */
export function migrateLegacyLogs(store: RehearsalStore): number {
  const {entries} = readIndex(store);
  const known = new Set(entries.map(e => e.id));
  let added = 0;
  for (const id of scanRehearsalIds(store)) {
    if (known.has(id)) continue;
    const parsed = parseRehearsalId(id)!;
    touchIndexEntry(store, {id, kind: parsed.kind, filmId: parsed.filmId, createdAt: null, legacy: parsed.legacy});
    added++;
  }
  return added;
}

function summarize(store: RehearsalStore, entry: RehearsalIndexEntry): RehearsalLogSummary {
  const base = {...entry, recording: false, chunks: 0, elapsed_ms: 0};
  const raw = store.getItem(manifestKey(entry.id));
  if (raw === null) return {...base, available: false};
  try {
    const m = JSON.parse(raw) as {recording?: unknown; chunks?: unknown; elapsed_ms?: unknown};
    return {...base, available: true, recording: m.recording === true, chunks: Number.isInteger(m.chunks) ? Number(m.chunks) : 0, elapsed_ms: typeof m.elapsed_ms === 'number' ? m.elapsed_ms : 0};
  } catch {
    return {...base, available: false};
  }
}

/** All demo or lab logs (indexed plus detected), newest first. Detected logs are listed even if the index lost them. */
export function listRehearsalLogs(store: RehearsalStore, kind: RehearsalKind): RehearsalLogSummary[] {
  const {entries} = readIndex(store);
  const known = new Set(entries.map(e => e.id));
  const detected: RehearsalIndexEntry[] = scanRehearsalIds(store).filter(id => !known.has(id)).map(id => {
    const p = parseRehearsalId(id)!;
    return {id, kind: p.kind, filmId: p.filmId, createdAt: null, legacy: p.legacy};
  });
  return [...entries, ...detected]
    .filter(e => e.kind === kind)
    .map(e => summarize(store, e))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || a.id.localeCompare(b.id));
}

/** A same-film log left open. The caller must show it and never resume it automatically. */
export function findOpenRehearsal(store: RehearsalStore, kind: RehearsalKind, filmId: string): RehearsalLogSummary | null {
  return listRehearsalLogs(store, kind).find(l => l.available && l.recording && l.filmId === filmId) ?? null;
}

/**
 * Loads a saved log. 'resume' continues it after explicit consent (appends session_resume);
 * 'read' is for export only and never writes or appends.
 */
export function openRehearsalRecorder(store: RehearsalStore, id: string, mode: 'resume' | 'read', now?: () => number): TelemetryRecorder {
  const raw = store.getItem(manifestKey(id));
  if (raw === null) throw Error('This saved rehearsal is no longer in browser storage.');
  const m = JSON.parse(raw) as {context: TelemetryContext};
  return new TelemetryRecorder(m.context, store, now, mode);
}

/** Removes every chunk, the manifest and the index entry for one log. Other logs are untouched. */
export function deleteRehearsalLog(store: RehearsalStore, id: string) {
  const manifest = manifestKey(id);
  const doomed = store.keys().filter(k => k === manifest || (k.startsWith(manifest + '.') && /^\d+$/.test(k.slice(manifest.length + 1))));
  // Delete only this run. Storage failures are surfaced by the caller; deletion can be retried.
  for (const k of doomed.filter(k => k !== manifest)) store.removeItem(k);
  if (doomed.includes(manifest)) store.removeItem(manifest);
  removeIndexEntry(store, id);
}
