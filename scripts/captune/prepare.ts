/** Offline fixed-prompt inference only. No shell execution, agents or viewing-time API. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { projectSchema,settingSchema,pointSchema } from "../../src/lib/captune/project.ts";
import { transformationJob,baselineJob,preferenceJob } from "../../src/lib/captune/prompts.ts";
import { resultEnvelope,acceptResult,acceptPreference,creatorRequestSchema } from "../../src/lib/captune/results.ts";
import type { Project,Setting } from "../../src/lib/captune/project.ts";
const args=process.argv.slice(2),value=(key:string)=>{const i=args.indexOf(key);return i>=0?args[i+1]:undefined;};
const input=value('--request'),output=value('--output');
if(!input||!output){console.error('Usage: npm run captune:prepare -- --request request.json --output result.json [--allow-inference] [--python /isolated/runtime/bin/python]');process.exit(1);}
try{
 if(fs.existsSync(output))throw Error("Output already exists. Choose a new result path before inference.");
 const size=fs.statSync(input).size;if(size>50*1024*1024)throw Error('Request exceeds 50 MB.');
 const request=JSON.parse(fs.readFileSync(input,'utf8')),project=projectSchema.parse(request.project);
 let job:unknown;
 if(request.kind==='transform')job=transformationJob(project,settingSchema.parse(request.from),settingSchema.parse(request.to));
 else if(request.kind==='baseline')job=baselineJob(project);
 else if(request.kind==='preference')job=preferenceJob(project,settingSchema.parse(request.current),String(request.message).slice(0,1000));
 else throw Error('Unsupported request kind.');
 if(!args.includes('--allow-inference')){console.log(JSON.stringify({mode:'dry-run',kind:request.kind,cues:project.cues.filter(c=>c.nsi&&!c.locked).length,provider:'NVIDIA NIM',network_requests:0,note:'No output generated. Add --allow-inference only after explicitly authorizing cloud generation.'}));process.exit(0);}
 const targets=project.cues.filter(c=>c.nsi&&!c.locked);
 if(request.kind==='transform'&&targets.length>100)throw Error('This bounded tool supports at most 100 unlocked NSI cues per request; prepare a smaller project.');
 const bridge=fileURLToPath(new URL('./nim.py',import.meta.url));
 const child=spawnSync(value('--python')||process.env.SCENECAPTIONS_PYTHON||'/Users/hamza/runtimes/scenecaptions-nim-asr/bin/python',[bridge],{input:JSON.stringify(job),encoding:'utf8',maxBuffer:50*1024*1024,timeout:200000});
 if(child.status!==0)throw Error((child.stderr||'NVIDIA preparation did not complete.').slice(-1000));
 const result=JSON.parse(child.stdout),model=result.model;
 let envelope:unknown;
 if(request.kind==='transform'){
  const setting=settingSchema.parse(request.to);acceptResult(project,setting,result.output,model);
  envelope={...resultEnvelope(project,setting,result.output,model),...(request.creator?{creator:creatorRequestSchema.parse(request.creator)}:{})};
 }else if(request.kind==='baseline'){
  const assessed=pointSchema.parse(result.output);envelope={format:'scenecaptions-baseline-result-v1',snapshot:JSON.stringify(project),output:assessed,model};
 }else{
  const checked=acceptPreference(project,result.output);envelope={format:'scenecaptions-preference-result-v1',snapshot:JSON.stringify(project),current:request.current,output:checked,model};
 }
 fs.writeFileSync(output,JSON.stringify(envelope,null,2),{flag:'wx'});
 console.log(JSON.stringify({output,kind:request.kind,provider:'NVIDIA NIM',model,status:'unreviewed-draft',requests:1}));
}catch(e){console.error(e instanceof Error?e.message:'Preparation failed.');process.exit(1);}
