import { z } from "zod";
import { profileSchema } from "./captions.ts";
import type { CaptionVideo, CaptionProfile, Condition } from "./captions.ts";
const baseEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("play"), video_s: z.number(),source:z.enum(["participant","system","researcher"]).optional() }),
  z.object({ type: z.literal("pause"), video_s: z.number(),source:z.enum(["participant","system","researcher"]).optional() }),
  z.object({ type: z.literal("seek"), video_s: z.number(),method:z.enum(["scrub","keyboard","jump","sound-navigation"]).optional(),from_s:z.number().optional() }),
  z.object({ type: z.literal("profile"), video_s: z.number(), profile: profileSchema }),
  z.object({ type: z.literal("original"), video_s: z.number(), enabled: z.boolean(),mode:z.enum(["toggle","hold"]).optional() }),
  z.object({ type: z.literal("condition"), video_s: z.number(), condition: z.enum(["baseline", "personalized"]) }),
  z.object({ type: z.literal("preview"), video_s: z.number(), profile: profileSchema.optional(), cue_id: z.string().optional() }),
  z.object({ type: z.literal("preview_end"), video_s: z.number() }),
]);
const eventSchema=z.union([baseEventSchema,z.object({type:z.literal("rate"),video_s:z.number(),value:z.number()}),z.object({type:z.literal("mute"),video_s:z.number(),muted:z.boolean()}),z.object({type:z.literal("fullscreen"),video_s:z.number(),enabled:z.boolean()}),z.object({type:z.literal("error"),video_s:z.number(),message:z.string()})]);
export type StudyEvent = z.infer<typeof eventSchema> & {source?:"participant"|"system"|"researcher"};
export type RecordedEvent = StudyEvent & { elapsed_ms: number };
export function appendEvent(events: RecordedEvent[], event: StudyEvent, elapsed_ms: number): RecordedEvent[] {
  const valid = eventSchema.parse(event);
  return [...events, { ...valid, elapsed_ms: Math.max(0, Math.round(elapsed_ms)) }];
}

/** Pure export snapshot; stopping fixes elapsed time and preserves original override. */
export function rehearsalSnapshot(session: {
  data: CaptionVideo | null; condition: Condition; profile: CaptionProfile; showOriginal: boolean;
  startedAt: number | null; stoppedElapsed: number | null; sessionId: string;
  events: RecordedEvent[]; ratings: Record<string, number>; note: string;
}, now: number) {
  const { data, condition, profile, showOriginal, startedAt, stoppedElapsed, sessionId, events, ratings, note } = session;
  return {
    schema_version: 1, purpose: "phase1-rehearsal-not-research", session_id: sessionId,
    video_id: data?.video_id || null, annotation_status: data?.annotation_status || null,
    caption_version: data?.generated_with, final_condition: condition, final_profile: profile,
    final_original_override: showOriginal,
    elapsed_ms: stoppedElapsed ?? (startedAt !== null ? Math.round(now - startedAt) : 0),
    events, ratings, note,
  };
}
