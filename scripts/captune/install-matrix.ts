/** Assemble approved editorial inputs; no model calls or automatic semantic approval. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {projectSchema,pointSchema} from '../../src/lib/captune/project.ts';
import {paletteSchema} from '../../src/lib/captune/matrix.ts';
import {reviewPacket,checkReview} from './review.ts';
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
try{
 const args=process.argv.slice(2),arg=(k:string)=>{const i=args.indexOf(k);return i<0?undefined:args[i+1]};
 const input=arg('--project'),curated=arg('--editorial'),output=arg('--output');if(!input||!curated||!output)throw Error('Use --project seed.json --editorial approved-palettes.json --output candidate.json');
 const p=projectSchema.parse(JSON.parse(fs.readFileSync(input,'utf8'))),edits=JSON.parse(fs.readFileSync(curated,'utf8'));
 if(edits.review_kind!=='source-text-editorial'||edits.reviewer!=='main-session assistant'||!Array.isArray(edits.palettes))throw Error('An explicit main-session source-text editorial record is required.');
 const baselineReport=JSON.parse(fs.readFileSync('docs/verification/captune-matrix-2026-11-03/requests/baseline-v1-attempt-02.json','utf8'));
 if(baselineReport.response?.choices?.[0]?.finish_reason!=='stop')throw Error('Baseline assessment did not finish.');
 p.baseline=pointSchema.parse(JSON.parse(baselineReport.response.choices[0].message.content));p.baseline_method='model-assessed';p.revision++;
 const contexts=JSON.parse(fs.readFileSync('docs/verification/captune-matrix-2026-11-03/context-full.json','utf8'));
 p.metadata.credit='Big Buck Bunny © Blender Foundation · CC BY 3.0. Sound references: Demuxed / big-buck-captions contributors, CC BY 3.0. NIM-generated wording with recorded SceneCaptions editorial corrections.';
 p.cues=p.cues.map(c=>{const row=contexts.find((r:{cue:string})=>r.cue===c.id);const choice=row?.response?.choices?.[0];const text=choice?.finish_reason==='stop'?choice.message?.content:null;return {...c,variants:[],context:{description:text||'No model context completion; use the original sound reference only.',status:text?'draft' as const:'missing' as const,model:'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'}};});
 const references=[...new Set(p.cues.flatMap(c=>c.original.split('\n').map(s=>s.trim()).filter(Boolean)))];
 if(edits.palettes.length!==references.length||new Set(edits.palettes.map((r:{reference:string})=>r.reference)).size!==references.length)throw Error('Every original sound reference requires one editorial record.');
 const by_reference=references.map(reference=>{
  const e=edits.palettes.find((r:{reference:string})=>r.reference===reference);if(!e||e.approved!==true||typeof e.note!=='string'||e.note.length<10)throw Error(`Review incomplete: ${reference}`);
  const raw=JSON.parse(fs.readFileSync(e.generated_file,'utf8'));if(hash(raw)!==e.generated_sha256||raw.original!==reference)throw Error('Editorial record does not bind the generated palette.');
  return {reference,generation_model:e.generation_model,request_sha256:e.request_sha256,palette:paletteSchema.parse(e.palette)};
 });
 p.prepared_matrix={format:'scenecaptions-compact-matrix-v1',model:[...new Set(edits.palettes.map((e:{generation_model:string})=>e.generation_model))].join(', '),prompt_version:'captune-source-constrained-palettes-v9',provenance:{kind:'source-assisted-generated-and-edited',reviewer:edits.reviewer,review_kind:'source-text-editorial',acoustic_validation:'unverified',context_validation:'unverified-model-drafts',limits:'All 800 settings are precomputed. Editorial detail bands are 1–3, 4–6, 7–10; expression bands are 1–3, 4–7, 8–10. Neighboring settings share wording. Expression uses conservative phrasing/punctuation; animation styling may select approved sound imitations. Raw model selection maps were corrected editorially; this is not 800 distinct semantic styles or newly verified acoustic detail. Source-text editorial review is not listening, original-creator approval, independent review or a DHH study.'},binding:{video_sha256:p.metadata.video_sha256,genre:p.metadata.genre,baseline:p.baseline,bounds:p.bounds,cues:p.cues.map(c=>({id:c.id,start:c.start,end:c.end,original:c.original,lower:c.lower,upper:c.upper}))},by_reference};
 const project=projectSchema.parse(p),packet=reviewPacket(project);
 if(packet.coverage.missing)throw Error('Prepared matrix has missing combinations.');
 // This receipt transfers the explicit completed atomic-phrase review to the
 // exact concatenated cue strings; separate simultaneous lines are preserved.
 const receipt={...packet,reviewer:edits.reviewer,editorial_record_sha256:hash(edits),groups:packet.groups.map(g=>({...g,decision:'accept',checks:Object.fromEntries(Object.keys(g.checks).map(k=>[k,true])),note:'Bound to the explicitly approved original/phrase records; simultaneous lines composed without semantic merging. Source-text editorial review only; raw audiovisual context remains unverified.'}))};
 const result=checkReview(project,receipt);
 fs.writeFileSync(output,JSON.stringify(project,null,2),{flag:'wx'});fs.writeFileSync(output.replace(/\.json$/,'.review.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
 console.log(JSON.stringify({...result,output,bytes:fs.statSync(output).size}));
}catch(e){console.error(e instanceof Error?e.message:'Matrix assembly failed.');process.exit(1);}
