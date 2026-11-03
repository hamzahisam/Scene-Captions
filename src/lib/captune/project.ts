import { z } from "zod";
import {preparedMatrixSchema,matrixText} from "./matrix.ts";

export const semanticValue = z.number().finite().min(1).max(10);
export const pointSchema = z.object({ detail: semanticValue, expression: semanticValue });
export const settingSchema = pointSchema.extend({ representation: z.enum(["default", "source", "onomatopoeia", "sensory"]), genre: z.boolean() });
export type Point = z.infer<typeof pointSchema>;
export type Setting = z.infer<typeof settingSchema>;
const text = z.string().min(1).max(2000).refine(v=>v.trim().length>0,"Caption text cannot be blank.");
export const cueSchema = z.object({
  id: z.string().min(1).max(100), start: z.number().finite().nonnegative(), end: z.number().finite().positive(),
  source_text: text, original: text, dialogue: z.string().max(2000), nsi: z.boolean(), category: z.string().max(80),
  lower: text, upper: text, edited: z.string().max(2000), locked: z.boolean(),
  context: z.object({ description: z.string().max(8000), status: z.enum(["missing", "draft", "reviewed"]), model: z.string().max(200) }),
  variants: z.array(z.object({ setting: settingSchema, text, status: z.enum(["draft", "creator-reviewed"]), model: z.string().max(200) })).max(800),
}).refine(c => c.end > c.start, "Caption end must follow its start.");
export type Cue = z.infer<typeof cueSchema>;
export const projectSchema = z.object({
  format: z.literal("scenecaptions-anchored-v1"), revision: z.number().int().nonnegative(),
  metadata: z.object({ id: z.string().regex(/^[a-z0-9-]+$/).max(100), title: text, genre: z.string().max(200), synopsis: z.string().max(4000), duration: z.number().finite().positive().max(14400), source_url: z.string().max(2000), credit: z.string().max(2000), video_sha256: z.union([z.literal(""),z.string().regex(/^[a-f0-9]{64}$/)]) }),
  baseline: pointSchema, baseline_method: z.enum(["manual", "model-assessed"]),
  bounds: z.object({ lower: pointSchema, upper: pointSchema }),
  cues: z.array(cueSchema).min(1).max(5000),
  prepared_matrix:preparedMatrixSchema.optional(),
}).superRefine((p, ctx) => {
  for (const axis of ["detail", "expression"] as const) {
    if (p.bounds.lower[axis] > p.bounds.upper[axis]) ctx.addIssue({ code:"custom", message:"Lower anchor must not exceed upper anchor.",path:["bounds"] });
    if (p.baseline[axis] < p.bounds.lower[axis] || p.baseline[axis] > p.bounds.upper[axis]) ctx.addIssue({ code:"custom", message:"The original baseline must lie inside the anchors.",path:["baseline"] });
  }
  if(p.prepared_matrix){
    const binding=p.prepared_matrix.binding;
    const expected={video_sha256:p.metadata.video_sha256,genre:p.metadata.genre,baseline:p.baseline,bounds:p.bounds,cues:p.cues.map(c=>({id:c.id,start:c.start,end:c.end,original:c.original,lower:c.lower,upper:c.upper}))};
    if(JSON.stringify(binding)!==JSON.stringify(expected))ctx.addIssue({code:'custom',message:'Prepared matrix belongs to a different video, caption or creator boundary.'});
    for(const c of p.cues.filter(c=>c.nsi))if(matrixText(p.prepared_matrix,c.original,{detail:1,expression:1,representation:'default',genre:false})===null)ctx.addIssue({code:'custom',message:'Prepared matrix lacks a source sound reference.'});
  }
  const ids = new Set<string>();
  p.cues.forEach((c,i) => {
    if(ids.has(c.id))ctx.addIssue({code:"custom",message:"Caption IDs must be unique.",path:["cues",i]});ids.add(c.id);
    if(c.end>p.metadata.duration)ctx.addIssue({code:"custom",message:"Caption exceeds video duration.",path:["cues",i]});
    if(i && c.start<p.cues[i-1].start)ctx.addIssue({code:"custom",message:"Captions must be ordered by time.",path:["cues",i]});
    const keys=new Set<string>();
    c.variants.forEach(v=>{ const key=settingKey(v.setting);if(keys.has(key))ctx.addIssue({code:"custom",message:"Duplicate cached setting.",path:["cues",i,"variants"]});keys.add(key); });
  });
});
export type Project = z.infer<typeof projectSchema>;
export function settingKey(s: Setting) { return `${s.detail}:${s.expression}:${s.representation}:${s.genre ? 1 : 0}`; }
export function allowed(p: Project, s: Point) { return ["detail","expression"].every(k=>s[k as keyof Point]>=p.bounds.lower[k as keyof Point] && s[k as keyof Point]<=p.bounds.upper[k as keyof Point]); }
export function originalSetting(p: Project): Setting { return {...p.baseline, representation:"default", genre:false}; }
export function resolve(c: Cue, p: Project, s: Setting, original=false) {
  if(original || !c.nsi)return {text:c.source_text, ready:true, reason:"Original caption"};
  if(c.locked)return {text:c.edited || c.original, ready:true, reason:"Locked by the caption creator"};
  if(!allowed(p,s))return {text:c.original,ready:false,reason:"Outside the creator's bounds; showing original"};
  if(settingKey(s)===settingKey(originalSetting(p)))return {text:c.edited||c.original,ready:true,reason:"Original style"};
  const cached=c.variants.find(v=>settingKey(v.setting)===settingKey(s));
  if(cached)return {text:cached.text,ready:true,reason:cached.status==="draft"?"Prepared draft · review pending":"Creator-reviewed wording"};
  if(p.prepared_matrix){const text=matrixText(p.prepared_matrix,c.original,s);if(text!==null)return {text,ready:true,reason:'AI-assisted, source-text edited · audio/DHH review pending'};}
  return {text:c.original,ready:false,reason:"This style is not prepared yet; showing original"};
}
/** Any editorial/context/boundary change invalidates prepared output; never re-label stale wording. */
export function revise(p:Project, patch:Partial<Project>):Project {
  return {...p,...patch,prepared_matrix:undefined,revision:p.revision+1,cues:(patch.cues||p.cues).map(c=>({...c,variants:[]}))};
}

/** Wording overrides and locks do not alter source facts/anchors; other edits invalidate preparation. */
export function editCaption(p:Project,id:string,patch:Partial<Cue>):Project {
 const cues=p.cues.map(c=>c.id===id?{...c,...patch}:c);
 const onlyOverride=Object.keys(patch).every(k=>k==='locked'||k==='edited');
 return projectSchema.parse(onlyOverride?{...p,revision:p.revision+1,cues}:revise(p,{cues}));
}
