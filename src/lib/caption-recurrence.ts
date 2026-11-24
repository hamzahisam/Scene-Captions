import type { CaptionCue } from "./captions.ts";
import type { ViewerLanguage } from "./viewer-language.ts";

export type RecurrenceAnnotation = {
  id: string;
  status: "draft" | "verified";
  evidence: string;
  occurrences: readonly string[];
  labels: Partial<Record<ViewerLanguage, string>>;
  revealFrom: number;
};

export function verifiedRecurrenceLabels(
  cues: readonly CaptionCue[],
  annotations: readonly RecurrenceAnnotation[],
  language: ViewerLanguage,
): ReadonlyMap<string, string> {
  const byId = new Map(cues.map(cue => [cue.cue_id, cue]));
  const labels = new Map<string, string>();
  const ambiguous = new Set<string>();

  for (const annotation of annotations) {
    const label = annotation.labels[language]?.trim();
    const ids = new Set(annotation.occurrences);
    if (annotation.status !== "verified" || !annotation.id.trim() || !annotation.evidence.trim()
      || !label || /[\[\]\r\n]/.test(label) || ids.size < 2 || !Number.isFinite(annotation.revealFrom)
      || annotation.revealFrom < 0 || [...ids].some(id => !byId.has(id))) continue;

    for (const id of ids) {
      if (byId.get(id)!.start_s < annotation.revealFrom) continue;
      if (labels.has(id)) ambiguous.add(id);
      labels.set(id, label);
    }
  }
  for (const id of ambiguous) labels.delete(id);
  return labels;
}

export function retainRecurrenceLabel(text: string, label?: string): string {
  if (!label) return text;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}])${escaped}($|[^\\p{L}\\p{M}\\p{N}])`, "iu").test(text)) return text;
  return text.startsWith("[") ? `[${label} — ${text.slice(1)}` : `[${label}] ${text}`;
}
