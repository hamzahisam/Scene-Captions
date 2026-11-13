import {coalesceEvent,telemetryEvent,telemetryContextSchema,telemetryInputSchema} from './telemetry.ts';import type {TelemetryContext,TelemetryInput,TelemetryEvent} from './telemetry.ts';
type Store=Pick<Storage,'getItem'|'setItem'>;
type Manifest={schema_version:2;context:TelemetryContext;recording:boolean;chunks:number;elapsed_ms:number;last_video_s:number;answers:Record<string,number|string|null>;note:string};
const CHUNK=200;
export class TelemetryRecorder{
 loadedSequence=-1;lastVideoS=0;resumePosition=0;private lastPositionWrite=0;events:TelemetryEvent[]=[];recording=false;started=false;resumed=false;error='';answers:Record<string,number|string|null>={};note='';version=0;private listeners=new Set<()=>void>();private offset=0;private began=0;
 readonly prefix:string;
 context:TelemetryContext;private storage:Store;private now:()=>number;
 constructor(context:TelemetryContext,storage:Store,now=()=>performance.now()){
  this.storage=storage;this.now=now;
  this.context=telemetryContextSchema.parse(context);this.prefix=`scenecaptions.telemetry.v2.${context.session_id}`;
  try{const raw=storage.getItem(this.prefix);if(raw){const m=JSON.parse(raw) as Manifest;if(m.schema_version!==2||m.context.session_id!==context.session_id||m.context.participant_id!==context.participant_id||!Number.isInteger(m.chunks)||m.chunks<0||m.chunks>100000)throw Error('Invalid saved session.');
   for(let i=0;i<m.chunks;i++){const chunk=storage.getItem(`${this.prefix}.${i}`);if(chunk===null)throw Error('A saved event chunk is missing.');const rows=JSON.parse(chunk) as TelemetryEvent[];for(const e of rows){telemetryContextSchema.parse(e);telemetryInputSchema.parse(e);if(e.session_id!==context.session_id)throw Error('Event belongs to another session.')}this.events.push(...rows)}
   this.loadedSequence=m.context.sequence_index;this.lastVideoS=m.context.film_id===context.film_id?m.last_video_s:0;this.resumePosition=this.lastVideoS;this.started=true;this.recording=m.recording;this.resumed=true;this.offset=Math.max(m.elapsed_ms,this.events.at(-1)?.elapsed_ms||0);this.answers=m.answers||{};this.note=m.note||'';
  }}catch{this.error='Saved recording could not be fully restored. Export available data and ask the researcher for help.';this.recording=false}
  this.began=now();if(this.recording)this.append({type:'session_resume',video_s:this.events.at(-1)?.video_s||0,source:'system'});
 }
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener)}};
 snapshot=()=>this.version;
 private notify(){this.version++;this.listeners.forEach(fn=>fn())}
 elapsed(){return this.offset+(this.recording?this.now()-this.began:0)}
 start(video_s:number){if(this.error)return;if(this.recording)return;this.started=true;this.recording=true;this.began=this.now();this.append({type:'session_start',video_s,source:'researcher'})}
 stop(video_s:number,source:"participant"|"system"|"researcher"="researcher"){if(!this.recording)return;const open=new Map<string,Extract<TelemetryEvent,{type:'caption_shown'|'caption_hidden'}>>();for(const e of this.events){if(e.type==='caption_shown')open.set(e.cue_id,e);if(e.type==='caption_hidden')open.delete(e.cue_id)}for(const c of open.values())this.append({...c,type:'caption_hidden',video_s,source:'system'});this.append({type:'session_end',video_s,source});this.offset=this.elapsed();this.recording=false;this.persist();this.notify()}
 append(input:TelemetryInput){if(!this.recording)return;try{this.lastVideoS=input.video_s;const event=telemetryEvent(this.context,input,this.elapsed(),this.now());this.events=coalesceEvent(this.events,event);this.persist();this.notify()}catch{this.error='An event could not be recorded. Export this session and ask the researcher for help.';this.notify()}}
 updatePosition(seconds:number){if(!Number.isFinite(seconds)||seconds<0)return;this.lastVideoS=seconds;if(this.recording&&this.now()-this.lastPositionWrite>=1000){this.lastPositionWrite=this.now();this.persist()}}
 flush(){if(this.started)this.persist()}
 setAnswer(key:string,value:number|string|null){this.answers={...this.answers,[key]:value};this.persist();this.notify()}
 setNote(value:string){this.note=value.slice(0,2000);this.persist();this.notify()}
 private persist(){try{const chunks=Math.ceil(this.events.length/CHUNK);if(chunks){const last=chunks-1;this.storage.setItem(`${this.prefix}.${last}`,JSON.stringify(this.events.slice(last*CHUNK)))}const manifest:Manifest={schema_version:2,context:this.context,recording:this.recording,chunks,elapsed_ms:Math.round(this.elapsed()),last_video_s:this.lastVideoS,answers:this.answers,note:this.note};this.storage.setItem(this.prefix,JSON.stringify(manifest))}catch{this.error='Local storage is full or unavailable. Recording continues in memory; export now before reloading.'}}
 export(){return {schema_version:2,purpose:'technical-rehearsal-not-formal-research-consent',context:this.context,recording:this.recording,elapsed_ms:Math.round(this.elapsed()),events:this.events,answers:this.answers,note:this.note,storage_warning:this.error||null}}
}
