import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFromSrt,parseProject} from '../src/lib/captune/import.ts';
import {sliderValue,valueToSlider,ratios,contextWindow} from '../src/lib/captune/math.ts';
import {originalSetting,projectSchema,resolve,revise} from '../src/lib/captune/project.ts';
import {transformationJob} from '../src/lib/captune/prompts.ts';
import {acceptResult,resultEnvelope,importResult,acceptPreference,acceptAnchorResult,acceptContext} from '../src/lib/captune/results.ts';
import {agreement} from '../src/lib/captune/analysis.ts';
const source='1\n00:00:01,000 --> 00:00:03,000\n[Door creaks]\nHello there.\n\n2\n00:00:02,000 --> 00:00:04,000\n[Music]\n\n3\n00:00:04,000 --> 00:00:05,000\nGoodbye.';
function project(){return projectFromSrt(source);}
const chosen={detail:6,expression:5,representation:'default' as const,genre:false};
const output={captions:[{id:'1',text:'[A door creaks]'},{id:'2',text:'[Music plays]'}],assessed:{detail:6,expression:5}};
test('CapTune Eq 1 reproduces original zero and Fig 3 semantic values; recalibration preserves the current slider position',()=>{
 assert.equal(sliderValue(-10,3),1);assert.equal(sliderValue(0,3),3);assert.equal(sliderValue(10,3),10);
 assert.equal(sliderValue(5,2),6);assert.equal(sliderValue(6,3),7.2);assert.equal(sliderValue(5,8,5),8);
 assert.equal(sliderValue(-10,8,5),1);assert.equal(sliderValue(10,8,5),10);
 assert.throws(()=>sliderValue(11,3));
});
test('CapTune Eqs 2–3 match paper example and handle fixed axes and negative changes',()=>{
 const d=ratios(3,6,2,8),e=ratios(2,5,2,7);assert.ok(Math.abs(d.r-2/3)<1e-10);assert.equal(d.delta,.5);assert.equal(e.r,.6);assert.equal(e.delta,.6);
 assert.deepEqual(ratios(2,2,2,2),{r:0,delta:0,fixed:true});assert.equal(ratios(8,2,2,8).delta,-1);assert.throws(()=>ratios(3,9,2,8));
});
test('SRT ingestion keeps dialogue separate and preserves overlapping cues and context boundaries',()=>{
 const p=project();assert.equal(p.cues[0].original,'[Door creaks]');assert.equal(p.cues[0].dialogue,'Hello there.');assert.equal(p.cues[2].nsi,false);
 assert.equal(p.cues[0].end,3);assert.equal(p.cues[1].start,2);assert.deepEqual(contextWindow(1,5),{start:0,end:5});assert.deepEqual(contextWindow(9,12),{start:4,end:12});
 assert.deepEqual(parseProject(JSON.stringify(p)),p);
});
test('anchored prompts include both concrete examples, current text, scene context, exact ratios and viewer modes',()=>{
 const p=project(),job=transformationJob(p,originalSetting(p),chosen);assert.equal(job.captions[0].lower_anchor,p.cues[0].lower);assert.equal(job.captions[0].current,p.cues[0].original);
 assert.equal(job.captions.length,2);assert.equal(job.instructions.representation,'default');assert.ok(Math.abs(job.instructions.detail.change_from_current_percent-100/3)<1e-10);
});
test('dialogue and locked wording survive transformations, while missing styles fall back explicitly',()=>{
 const p=project();p.cues[1].locked=true;p.cues[1].edited='[Creator music wording]';
 const raw={captions:[output.captions[0]],assessed:output.assessed};const next=acceptResult(p,chosen,raw,'test-fixture');
 assert.equal(resolve(next.cues[0],next,chosen).text,'[A door creaks]');assert.equal(next.cues[0].dialogue,'Hello there.');
 assert.equal(resolve(next.cues[1],next,chosen).text,'[Creator music wording]');assert.equal(resolve(next.cues[2],next,chosen).text,'Goodbye.');
 assert.equal(resolve(next.cues[0],next,{...chosen,genre:true}).ready,false);
 assert.equal(resolve(next.cues[0],next,chosen,true).text,'[Door creaks]\nHello there.');
 assert.throws(()=>acceptResult(p,chosen,output,'test-fixture'));
});
test('duplicate, missing and unknown output IDs are rejected; editorial changes invalidate caches and stale envelopes',()=>{
 const p=project(),envelope=resultEnvelope(p,chosen,output,'test-fixture'),next=importResult(p,envelope);assert.equal(next.cues[0].variants.length,1);
 assert.throws(()=>acceptResult(p,chosen,{...output,captions:[output.captions[0],output.captions[0]]},'fixture'));
 assert.throws(()=>acceptResult(p,chosen,{...output,captions:output.captions.slice(1)},'fixture'));
 const changed=revise(next,{metadata:{...next.metadata,genre:'Documentary'}});assert.equal(changed.cues[0].variants.length,0);assert.throws(()=>importResult(changed,envelope));
});
test('creator bounds constrain grid and language interpretations; invalid configurations cannot render',()=>{
 const p=project();p.bounds.upper={detail:7,expression:6};assert.throws(()=>transformationJob(p,originalSetting(p),{...chosen,detail:8}));
 assert.throws(()=>acceptPreference(p,{setting:{...chosen,expression:9},explanation:'outside'}));
 assert.equal(projectSchema.safeParse({...p,baseline:{detail:9,expression:2}}).success,false);
 assert.equal(projectSchema.safeParse({...p,cues:[p.cues[0],p.cues[0]]}).success,false);
});
test('paired coder agreement computes Cohen kappa without inventing independent coding or undefined certainty',()=>{
 const r=agreement(['a','a','b','b'],['a','b','b','b']);assert.equal(r.raw_agreement,.75);assert.equal(r.kappa,.5);
 assert.equal(agreement(['a'],['a']).kappa,null);assert.throws(()=>agreement(['a'],[]));
});

test('inverse slider mapping keeps loaded anchors and cross-axis calibration in sync',()=>{
 for(const v of [1,2,3,4.5,8,10])assert.ok(Math.abs(sliderValue(valueToSlider(v,3),3)-v)<1e-10);
});
test('creator result sets concrete anchor captions and recalibrates the other semantic axis without moving its slider',()=>{
 const p=project(),s={detail:10,expression:10,representation:'default' as const,genre:false};
 const raw={...resultEnvelope(p,s,{...output,assessed:{detail:10,expression:8}},'fixture'),creator:{anchor:'upper',axis:'detail',positions:{detail:10,expression:5}}};
 const accepted=acceptAnchorResult(p,raw);assert.equal(accepted.project.cues[0].upper,'[A door creaks]');assert.equal(accepted.project.bounds.upper.expression,8);assert.equal(accepted.recalibrated.center,5);assert.equal(accepted.positions.expression,5);
 assert.equal(accepted.project.cues[0].variants.length,0);assert.throws(()=>acceptAnchorResult(p,{...raw,setting:chosen}));
});
test('context results are snapshot-bound, preserve cue identity and remain drafts rather than sound truth',()=>{
 const p=project();const out={format:'scenecaptions-context-result-v1',project:p,contexts:[{id:'1',description:'A draft scene description',model:'fixture'}]};
 const next=acceptContext(p,out);assert.equal(next.cues[0].context.status,'draft');assert.equal(next.cues[0].start,1);assert.throws(()=>acceptContext(p,{...out,contexts:[{id:'nope',description:'text',model:'fixture'}]}));assert.throws(()=>acceptContext(revise(p,{metadata:{...p.metadata,title:'Changed'}}),out));
});
