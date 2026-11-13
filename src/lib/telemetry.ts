import {z} from 'zod';import {rawTlxScore} from './study-surveys.ts';import {conditionSchema,participantIdSchema} from './study-session.ts';import {csvCell} from './allocation.ts';
const scalar=z.union([z.string().max(4000),z.number().finite(),z.boolean(),z.null()]);
const base={video_s:z.number().finite().nonnegative(),source:z.enum(['participant','system','researcher']).default('participant')};
const caption={...base,sample:z.boolean().default(false),cue_id:z.string(),cue_type:z.enum(['sound','dialogue']),displayed_level:z.union([z.number(),z.literal('original')]),adapted:z.boolean(),rule:z.string(),text:z.string().max(4000)};
export const telemetryInputSchema=z.discriminatedUnion('type',[
 z.object({...base,type:z.enum(['play','pause','session_start','session_resume','session_end'])}),
 z.object({...base,type:z.literal('rate'),value:z.number().finite().positive()}),
 z.object({...base,type:z.literal('mute'),muted:z.boolean()}),
 z.object({...base,type:z.literal('fullscreen'),enabled:z.boolean()}),
 z.object({...base,type:z.literal('visibility'),visible:z.boolean()}),
 z.object({...base,type:z.literal('seek'),method:z.enum(['scrub','keyboard','jump','sound-navigation']),from_s:z.number().finite().nonnegative()}),
 z.object({...base,type:z.literal('settings'),open:z.boolean()}),
 z.object({...base,type:z.literal('profile_change'),field:z.string().max(100),from:scalar,to:scalar}),
 z.object({...base,type:z.literal('original'),mode:z.enum(['toggle','hold']),enabled:z.boolean()}),
 z.object({...caption,type:z.enum(['caption_shown','caption_hidden'])}),
 z.object({...base,type:z.literal('survey'),item:z.string().max(200),value:scalar,response_ms:z.number().nonnegative()}),
 z.object({...base,type:z.literal('error'),message:z.string().max(1000)}),
 z.object({...base,type:z.literal('lab_profile'),value:z.string().max(4000)}),
]);
export type TelemetryInput=z.input<typeof telemetryInputSchema>;
export const telemetryContextSchema=z.object({session_id:z.string(),participant_id:participantIdSchema.nullable(),design:z.enum(['between','within-pilot','rehearsal']),assigned_condition:conditionSchema,sequence_index:z.number().int().nonnegative(),film_id:z.string(),app_version:z.string()});
export type TelemetryContext=z.infer<typeof telemetryContextSchema>;
export type TelemetryEvent=z.infer<typeof telemetryInputSchema>&TelemetryContext&{iso_timestamp:string;performance_ms:number;elapsed_ms:number};
export function telemetryEvent(context:TelemetryContext,input:TelemetryInput,elapsed:number,performanceMs:number,iso=new Date().toISOString()):TelemetryEvent{return {...telemetryContextSchema.parse(context),...telemetryInputSchema.parse(input),iso_timestamp:z.string().datetime().parse(iso),elapsed_ms:Math.max(0,Math.round(elapsed)),performance_ms:Math.max(0,Math.round(performanceMs))};}
export function coalesceEvent(events:TelemetryEvent[],next:TelemetryEvent){const last=events.at(-1);if(last?.type==='seek'&&next.type==='seek'&&last.method==='scrub'&&next.method==='scrub'&&last.source===next.source&&last.film_id===next.film_id&&next.elapsed_ms-last.elapsed_ms<=300){return [...events.slice(0,-1),{...next,from_s:last.from_s}]}return [...events,next];}
export function eventCsv(events:TelemetryEvent[]){const keys=[...new Set(events.flatMap(e=>Object.keys(e)))];return [keys.map(csvCell).join(','),...events.map(e=>keys.map(k=>csvCell((e as unknown as Record<string,unknown>)[k])).join(','))].join('\n');}
export function summaryCsv(context:TelemetryContext,events:TelemetryEvent[],elapsed=events.at(-1)?.elapsed_ms||0){const tlx:Record<string,Record<string,number|string|null>>={};for(const e of events)if(e.type==='survey'&&e.item.startsWith('end:')){const parts=e.item.split(':');if(parts.at(-1)?.startsWith('tlx-')){tlx[parts[1]]||={};tlx[parts[1]][parts.at(-1)!]=typeof e.value==='number'||typeof e.value==='string'||e.value===null?e.value:null}}const counts=events.reduce<Record<string,number>>((out,e)=>{out[e.type]=(out[e.type]||0)+1;return out},{});const row={participant_id:context.participant_id||'technical',session_id:context.session_id,design:context.design,events:events.length,elapsed_ms:Math.round(elapsed),raw_tlx_by_film:JSON.stringify(Object.fromEntries(Object.entries(tlx).map(([film,answers])=>[film,rawTlxScore(answers)]))),caption_exposures:events.filter(e=>e.type==='caption_shown'&&!e.sample).length,sample_exposures:events.filter(e=>e.type==='caption_shown'&&e.sample).length,adapted_exposures:events.filter(e=>e.type==='caption_shown'&&e.adapted&&!e.sample).length,seeks:counts.seek||0,survey_answered:events.filter(e=>e.type==='survey'&&e.value!==null).length,survey_missing:events.filter(e=>e.type==='survey'&&e.value===null).length,app_version:context.app_version};return [Object.keys(row).map(csvCell).join(','),Object.values(row).map(csvCell).join(',')].join('\n');}
