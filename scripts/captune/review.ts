/** Source-text review receipt. Completeness is not acoustic or DHH validation. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {projectSchema,originalSetting,resolve,allowed,settingKey} from '../../src/lib/captune/project.ts';
import type {Project,Setting} from '../../src/lib/captune/project.ts';
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function reviewPacket(p:Project){
 const settings:Setting[]=[];
 for(let d=1;d<=10;d++)for(let e=1;e<=10;e++)for(const representation of ['default','source','onomatopoeia','sensory'] as const)for(const genre of [false,true])if(allowed(p,{detail:d,expression:e}))settings.push({detail:d,expression:e,representation,genre});
 const groups=new Map<string,{id:string;original:string;lower:string;upper:string;context:unknown;text:string;occurrences:{cue:string;setting:string}[];decision:'pending';checks:Record<string,boolean>;note:string}>();
 let missing=0,prepared=0,locked=0,baseline=0;const readingFlags:{cue:string;setting:string;characters_per_second:number}[]=[];
 for(const c of p.cues.filter(c=>c.nsi))for(const s of settings){
  if(c.locked){locked++;continue;}if(settingKey(s)===settingKey(originalSetting(p))){baseline++;continue;}
  const value=resolve(c,p,s);if(!value.ready){missing++;continue;}prepared++;
  const id=digest({original:c.original,lower:c.lower,upper:c.upper,context:c.context,text:value.text});
  if(!groups.has(id))groups.set(id,{id,original:c.original,lower:c.lower,upper:c.upper,context:c.context,text:value.text,occurrences:[],decision:'pending',checks:{meaning_supported:false,simple_english:false,sound_source_clear:false,anchor_bounds_respected:false,simultaneous_sounds_preserved:false},note:''});
  groups.get(id)!.occurrences.push({cue:c.id,setting:settingKey(s)});
  const cps=value.text.length/(c.end-c.start);if(cps>28)readingFlags.push({cue:c.id,setting:settingKey(s),characters_per_second:Number(cps.toFixed(2))});
 }
 return {format:'scenecaptions-matrix-review-v1',project_sha256:digest(p),reviewer:'',review_kind:'source-text-editorial-only',limits:'This receipt checks declared source-text review, not listening accuracy, original creator approval, independent review, DHH suitability or a participant study. Reading flags use an unvalidated 28 characters/second editing heuristic; source intervals are never extended.',coverage:{settings:settings.length,prepared,missing,locked,baseline,unique_review_groups:groups.size},groups:[...groups.values()],reading_flags:readingFlags};
}
const receiptSchema=z.object({format:z.literal('scenecaptions-matrix-review-v1'),project_sha256:z.string(),reviewer:z.string().min(1),groups:z.array(z.object({id:z.string(),decision:z.literal('accept'),checks:z.object({meaning_supported:z.literal(true),simple_english:z.literal(true),sound_source_clear:z.literal(true),anchor_bounds_respected:z.literal(true),simultaneous_sounds_preserved:z.literal(true)}),note:z.string().trim().min(10)}))});
export function checkReview(p:Project,raw:unknown){
 const expected=reviewPacket(p),r=receiptSchema.parse(raw);
 if(r.project_sha256!==expected.project_sha256)throw Error('Review belongs to a different project snapshot.');
 if(expected.coverage.missing)throw Error(`${expected.coverage.missing} cue/style combinations are not prepared.`);
 const ids=new Set(r.groups.map(g=>g.id));if(ids.size!==r.groups.length||ids.size!==expected.groups.length||expected.groups.some(g=>!ids.has(g.id)))throw Error('Every unique source/context/text group requires exactly one completed review.');
 return {coverage:expected.coverage,reviewer:r.reviewer,complete_source_text_receipt:true,acoustic_validation:'unverified',dhh_study:'not-conducted',reading_flags:expected.reading_flags.length};
}
if(process.argv[1]?.endsWith('/review.ts')){
 try{const args=process.argv.slice(2),arg=(k:string)=>{const i=args.indexOf(k);return i<0?undefined:args[i+1]};const input=arg('--project');if(!input)throw Error('Use --project project.json --output review.json, or --check completed-review.json.');const p=projectSchema.parse(JSON.parse(fs.readFileSync(input,'utf8')));if(arg('--check'))console.log(JSON.stringify(checkReview(p,JSON.parse(fs.readFileSync(arg('--check')!,'utf8')))));else {const output=arg('--output');if(!output)throw Error('Specify a new --output path.');const packet=reviewPacket(p);fs.writeFileSync(output,JSON.stringify(packet,null,2),{flag:'wx'});console.log(JSON.stringify({output,coverage:packet.coverage,reading_flags:packet.reading_flags.length,review_status:'pending'}));}}
 catch(e){console.error(e instanceof Error?e.message:'Review validation failed.');process.exit(1);}
}
