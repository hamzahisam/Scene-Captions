import {z} from 'zod';
const axis=z.number().int().min(1).max(10);
const range=z.tuple([axis,axis]).refine(([a,b])=>a<=b);
const modes=['default','source','onomatopoeia','sensory'] as const;
const regionSchema=z.object({detail:range,expression:range,modes:z.array(z.enum(modes)).min(1).max(4).refine(a=>new Set(a).size===a.length),genre:z.array(z.union([z.literal(0),z.literal(1)])).min(1).max(2).refine(a=>new Set(a).size===a.length),text:z.number().int().nonnegative()});
export const paletteSchema=z.object({texts:z.array(z.string().trim().min(1).max(180)).min(1).max(80),regions:z.array(regionSchema).min(1).max(800)}).superRefine((p,ctx)=>{
 const keys=new Set<string>();
 for(const r of p.regions){if(r.text>=p.texts.length){ctx.addIssue({code:'custom',message:'Matrix references missing wording.'});continue;}
  for(let d=r.detail[0];d<=r.detail[1];d++)for(let e=r.expression[0];e<=r.expression[1];e++)for(const m of r.modes)for(const g of r.genre){const k=`${d}:${e}:${m}:${g}`;if(keys.has(k))ctx.addIssue({code:'custom',message:'Matrix regions overlap.'});keys.add(k);}}
 if(keys.size!==800)ctx.addIssue({code:'custom',message:'Each sound palette must cover all 800 combinations.'});
});
const point=z.object({detail:z.number().min(1).max(10),expression:z.number().min(1).max(10)});
export const preparedMatrixSchema=z.object({
 format:z.literal('scenecaptions-compact-matrix-v1'),model:z.string().min(1),prompt_version:z.string().min(1),
 provenance:z.object({kind:z.literal('source-assisted-generated-and-edited'),reviewer:z.string().min(1),review_kind:z.literal('source-text-editorial'),acoustic_validation:z.literal('unverified'),context_validation:z.literal('unverified-model-drafts'),limits:z.string().min(1)}),
 binding:z.object({video_sha256:z.string(),genre:z.string(),baseline:point,bounds:z.object({lower:point,upper:point}),cues:z.array(z.object({id:z.string(),start:z.number(),end:z.number(),original:z.string(),lower:z.string(),upper:z.string()})).max(5000)}),
 by_reference:z.array(z.object({reference:z.string().min(1).max(2000),generation_model:z.string().optional(),request_sha256:z.string().regex(/^[a-f0-9]{64}$/).optional(),palette:paletteSchema})).min(1).max(5000).refine(a=>new Set(a.map(p=>p.reference)).size===a.length,'Sound references must be unique.'),
});
export type PreparedMatrix=z.infer<typeof preparedMatrixSchema>;
export function matrixText(matrix:PreparedMatrix,original:string,s:{detail:number;expression:number;representation:typeof modes[number];genre:boolean}):string|null{
 if(!Number.isInteger(s.detail)||!Number.isInteger(s.expression))return null;
 const result:string[]=[];
 for(const reference of original.split('\n').map(t=>t.trim()).filter(Boolean)){
  const entry=matrix.by_reference.find(p=>p.reference===reference);if(!entry)return null;
  const r=entry.palette.regions.find(r=>r.detail[0]<=s.detail&&s.detail<=r.detail[1]&&r.expression[0]<=s.expression&&s.expression<=r.expression[1]&&r.modes.includes(s.representation)&&r.genre.includes(s.genre?1:0));
  if(!r)return null;result.push(entry.palette.texts[r.text]);
 }
 return result.join('\n');
}
