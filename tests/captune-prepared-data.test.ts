import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {projectSchema,resolve,originalSetting} from '../src/lib/captune/project.ts';
const path='data/captune/big-buck-bunny.json';
const project=projectSchema.parse(JSON.parse(fs.readFileSync(path,'utf8')));
test('installed sample and review receipt bind the actual generated-and-edited matrix; public export is identical',()=>{
 const summary=JSON.parse(fs.readFileSync('data/captune/big-buck-bunny.review.json','utf8'));
 assert.equal(createHash('sha256').update(JSON.stringify(project)).digest('hex'),summary.project_sha256);
 assert.equal(summary.complete_source_text_receipt,true);assert.equal(summary.acoustic_validation,'unverified');assert.equal(summary.dhh_study,'not-conducted');
 assert.equal(fs.readFileSync(path,'utf8'),fs.readFileSync('public/research/captune/big-buck-bunny.json','utf8'));
 assert.equal(project.baseline_method,'model-assessed');assert.equal(project.cues.length,87);
});
test('all 69,600 movie cue/style combinations resolve without fallbacks and preserve every simultaneous line and original',()=>{
 let checked=0;
 for(const c of project.cues){
  for(let d=1;d<=10;d++)for(let e=1;e<=10;e++)for(const representation of ['default','source','onomatopoeia','sensory'] as const)for(const genre of [false,true]){
   const r=resolve(c,project,{detail:d,expression:e,representation,genre});assert.equal(r.ready,true);assert.equal(r.text.split('\n').length,c.original.split('\n').length);checked++;
  }
  assert.equal(resolve(c,project,originalSetting(project),true).text,c.source_text);
 }
 assert.equal(checked,69600);
});
test('caption text excludes the unsupported acoustic/scene claims rejected in the pilots',()=>{
 for(const entry of project.prepared_matrix!.by_reference)for(const text of entry.palette.texts){
  assert.doesNotMatch(text,/\b(nearby|mountain|stones?|crystal|steadily|metallic|softly|loudly|ground)\b/i);
  if(entry.reference==='[WIND BLOWS]')assert.doesNotMatch(text,/whoosh/i);
  if(entry.reference==='[MILITARY MUSIC]')assert.doesNotMatch(text,/ta-ta|drum|trumpet/i);
  if(entry.reference==='[SQUIRREL SQUEALS]')assert.doesNotMatch(text,/squeak/i);
 }
});
