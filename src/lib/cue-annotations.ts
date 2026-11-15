import {z} from 'zod';import type {CaptionVideo} from './captions.ts';
export const cueAnnotationsSchema=z.object({video_id:z.string(),status:z.enum(['heuristic-draft','reviewed']),dialogue_status:z.enum(['heuristic-draft','reviewed']).optional(),sounds:z.record(z.string(),z.object({kind:z.enum(['music','sfx','vocal','ambience']),offscreen:z.boolean().optional()})),dialogue:z.record(z.string(),z.object({speaker:z.string().min(1).max(80).optional()}))});
export type CueAnnotations=z.infer<typeof cueAnnotationsSchema>;
export function validateAnnotations(video:CaptionVideo,raw:unknown){const a=cueAnnotationsSchema.parse(raw);if(a.video_id!==video.video_id)throw Error('Annotations belong to another film.');const sounds=new Set(video.cues.map(c=>c.cue_id)),dialogue=new Set(video.dialogue?.map(c=>c.cue_id));if(Object.keys(a.sounds).some(id=>!sounds.has(id))||Object.keys(a.dialogue).some(id=>!dialogue.has(id)))throw Error('Annotations reference unknown cues.');return a;}
export function speakerText(text:string,speaker?:string){const prefix=speaker&&`${speaker}:`;return prefix&&text.startsWith(prefix)?text.slice(prefix.length).trimStart():text;}
// Speaker names are shown only when the dialogue attribution itself is reviewed.
// `dialogue_status` lets a sound-only review leave dialogue speakers as drafts; older sidecars fall back to `status`.
export function reviewedSpeaker(annotations:CueAnnotations|undefined,cueId:string){const speaker=annotations?.dialogue[cueId]?.speaker;return speaker&&(annotations.dialogue_status??annotations.status)==='reviewed'?speaker:undefined;}
// Reviewed attribution: chip text plus a spoken ": " separator. Unreviewed: the source text is unchanged.
export function dialogueParts(text:string,speaker?:string){return speaker?{speaker,text:speakerText(text,speaker)}:{text};}
export function dialogueNativeText(text:string,speaker?:string){const p=dialogueParts(text,speaker);return p.speaker?`${p.speaker}: ${p.text}`:p.text;}
