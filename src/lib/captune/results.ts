import { z } from "zod";
import { projectSchema, pointSchema,settingSchema,settingKey,allowed } from "./project.ts";
import type { Project,Setting } from "./project.ts";
export const resultSchema=z.object({captions:z.array(z.object({id:z.string(),text:z.string().trim().min(1).max(2000)})).max(5000),assessed:pointSchema});
export function acceptResult(p:Project,s:Setting,raw:unknown,model:string):Project {
  if(!allowed(p,s))throw Error("Result setting is outside creator bounds.");
  const result=resultSchema.parse(raw),target=p.cues.filter(c=>c.nsi&&!c.locked),ids=new Set(result.captions.map(c=>c.id));
  if(ids.size!==result.captions.length||ids.size!==target.length||target.some(c=>!ids.has(c.id)))throw Error("Result must include every unlocked sound cue exactly once, and no dialogue or locked cues.");
  const text=new Map(result.captions.map(c=>[c.id,c.text]));
  for(const c of target){if((text.get(c.id)!.split("\n").filter(Boolean).length)<c.original.split("\n").filter(Boolean).length)throw Error("Preserve separate lines for simultaneous source sounds.");}
  return projectSchema.parse({...p,cues:p.cues.map(c=>text.has(c.id)?{...c,variants:[...c.variants.filter(v=>settingKey(v.setting)!==settingKey(s)),{setting:s,text:text.get(c.id)!,status:"draft",model}]}:c)});
}
export function acceptPreference(p:Project,raw:unknown){const r=z.object({setting:settingSchema,explanation:z.string().max(1000)}).parse(raw);if(!allowed(p,r.setting))throw Error("Interpreted preference exceeds creator bounds.");return r;}
/** Requests contain the full immutable editorial snapshot; a delayed result cannot overwrite newer work. */
export function resultEnvelope(p:Project,s:Setting,raw:unknown,model:string){return {format:"scenecaptions-result-v1",snapshot:JSON.stringify(p),setting:s,output:raw,model};}
export function importResult(p:Project,raw:unknown){
  const e=z.object({format:z.literal("scenecaptions-result-v1"),snapshot:z.string(),setting:settingSchema,output:z.unknown(),model:z.string().min(1).max(200)}).parse(raw);
  if(e.snapshot!==JSON.stringify(p))throw Error("Result is for a different project revision. Export a new request after editing anchors, context or captions.");
  return acceptResult(p,e.setting,e.output,e.model);
}

export const creatorRequestSchema=z.object({anchor:z.enum(["lower","upper"]),axis:z.enum(["detail","expression"]),positions:z.object({detail:z.number().min(-10).max(10),expression:z.number().min(-10).max(10)})});
export function acceptAnchorResult(p:Project,raw:unknown){
 const envelope=z.object({creator:creatorRequestSchema,setting:settingSchema,output:resultSchema}).parse(raw);
 const prepared=importResult(p,raw),{anchor,axis,positions}=envelope.creator,other=axis==="detail"?"expression":"detail";
 if(envelope.setting.detail!==p.bounds[anchor].detail||envelope.setting.expression!==p.bounds[anchor].expression)throw Error("Anchor result target differs from the creator's selected anchor.");
 const point={...p.bounds[anchor],[other]:envelope.output.assessed[other]};
 const updated=projectSchema.parse({...prepared,prepared_matrix:undefined,bounds:{...p.bounds,[anchor]:point},revision:p.revision+1,cues:prepared.cues.map(c=>{
 const v=c.variants.find(v=>settingKey(v.setting)===settingKey(envelope.setting));
 return {...c,...(c.nsi&&!c.locked&&v?{[anchor]:v.text}:{}),variants:[]};
 })});
 return {project:updated,anchor,positions,recalibrated:{axis:other,value:point[other],center:positions[other]}};
}

export function acceptContext(p:Project,raw:unknown){
 const e=z.object({format:z.literal("scenecaptions-context-result-v1"),project:projectSchema,contexts:z.array(z.object({id:z.string(),description:z.string().trim().min(1).max(8000),model:z.string().min(1).max(200)})).min(1).max(100)}).parse(raw);
 if(JSON.stringify(e.project)!==JSON.stringify(p))throw Error("Context belongs to a different project revision.");
 const ids=new Set(e.contexts.map(c=>c.id));if(ids.size!==e.contexts.length||e.contexts.some(c=>!p.cues.find(x=>x.id===c.id&&x.nsi)))throw Error("Context IDs must match distinct sound cues.");
 const descriptions=new Map(e.contexts.map(c=>[c.id,c]));
 return projectSchema.parse({...p,prepared_matrix:undefined,revision:p.revision+1,cues:p.cues.map(c=>({...c,variants:[],...(descriptions.has(c.id)?{context:{description:descriptions.get(c.id)!.description,model:descriptions.get(c.id)!.model,status:"draft"}}:{})}))});
}
