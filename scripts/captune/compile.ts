/** Explicit, resumable precomputation. Does not run or delegate to an agent. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {projectSchema,originalSetting,resolve,allowed,settingKey} from '../../src/lib/captune/project.ts';
import type {Setting} from '../../src/lib/captune/project.ts';
import {transformationJob} from '../../src/lib/captune/prompts.ts';
import {acceptResult,resultEnvelope} from '../../src/lib/captune/results.ts';
const args=process.argv.slice(2),arg=(k:string)=>{const i=args.indexOf(k);return i<0?undefined:args[i+1]};
try{
 const input=arg('--project'),output=arg('--output');if(!input||!output)throw Error('Use --project file.json --output directory [--max-requests 3] [--allow-inference].');
 let project=projectSchema.parse(JSON.parse(fs.readFileSync(input,'utf8')));const cap=Number(arg('--max-requests')||3);if(!Number.isInteger(cap)||cap<1||cap>20)throw Error('max-requests must be 1–20 per explicit run.');
 const settings:Setting[]=[];
 for(let d=1;d<=10;d++)for(let e=1;e<=10;e++)for(const r of ['default','source','onomatopoeia','sensory'] as const)for(const genre of [false,true]){const s={detail:d,expression:e,representation:r,genre};if(allowed(project,s))settings.push(s);}
 const missing=settings.filter(s=>project.cues.some(c=>c.nsi&&!c.locked&&!resolve(c,project,s).ready));
 console.log(JSON.stringify({mode:args.includes('--allow-inference')?'explicit-inference':'dry-run',possible_settings:settings.length,unprepared_settings:missing.length,request_ceiling:cap,network_requests:0}));
 if(!args.includes('--allow-inference'))process.exit(0);
 fs.mkdirSync(output,{recursive:true});let count=0;
 for(const s of missing){if(count>=cap)break;if(fs.existsSync(`${output}/${settingKey(s).replaceAll(':','-')}.json`))throw Error("Output already contains this setting. Resume from its project.json checkpoint; no new request sent.");
  const job=transformationJob(project,originalSetting(project),s),child=spawnSync(arg('--python')||process.env.SCENECAPTIONS_PYTHON||'/Users/hamza/runtimes/scenecaptions-nim-asr/bin/python',[fileURLToPath(new URL('./nim.py',import.meta.url))],{input:JSON.stringify(job),encoding:'utf8',maxBuffer:10*1024*1024,timeout:200000});count++;
  if(child.status!==0)throw Error(`Stopped after ${count} request(s): preparation failed. Existing checkpoint retained.`);
  const raw=JSON.parse(child.stdout);const envelope={format:'scenecaptions-compiled-style-v1',snapshot_sha256:createHash('sha256').update(JSON.stringify(project)).digest('hex'),setting:s,output:raw.output,model:raw.model};const next=acceptResult(project,s,raw.output,raw.model);
  fs.writeFileSync(`${output}/${settingKey(s).replaceAll(':','-')}.json`,JSON.stringify(envelope,null,2),{flag:'wx'});
  project=next;fs.writeFileSync(`${output}/project.json`,JSON.stringify(project,null,2));
  console.log(JSON.stringify({completed:count,setting:s,status:'unreviewed-draft'}));
 }
}catch(e){console.error(e instanceof Error?e.message:'Compilation failed.');process.exit(1);}
