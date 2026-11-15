import {test} from 'node:test';import assert from 'node:assert/strict';import {studySessionSchema} from '../src/lib/study-session.ts';import {endItems,checkpointItems,questionFileSchema,rawTlxScore} from '../src/lib/study-surveys.ts';import {readFileSync} from 'node:fs';
const session=()=>studySessionSchema.parse({id:'synthetic-001',participantId:'P-001',group:'adult',background:'frequent',design:'between',seed:'fixed',allocationSlot:'frequent-1',sequence:[{filmId:'soar',condition:'personalized'}],sequenceIndex:0,readingSpeed:17,ticks:true,checkpoints:{soar:[60]},createdAt:'2026-11-13T00:00:00.000Z'});
test('all child ratings share negative-to-positive numeric codes and text anchors',()=>{
 const child={...session(),group:'child' as const},checkpoint=checkpointItems(child,60)[0];
 assert.equal(checkpoint.prompt,'How easy was it to follow the captions?');
 for(const item of [checkpoint,...endItems(child)]){
  const control=item.key==='child-control';
  assert.equal(item.pictorial,true);
  assert.deepEqual(item.choices?.map(c=>c.value),[1,2,3,4,5]);
  assert.deepEqual(item.choices?.map(c=>c.label),control?['Not at all','A little','Some','Mostly','Yes']:['Very hard','Hard','In between','Easy','Very easy']);
  assert.deepEqual(item.scale,{kind:'rating',min:1,max:5,low:control?'Not at all':'Very hard',high:control?'Yes':'Very easy',direction:'negative-to-positive'});
 }
});
test('adult prompts, anchors, polarity and TLX fields stay unchanged',()=>{
 const adult=session(),checkpoint=checkpointItems(adult,60)[0],items=endItems(adult);
 assert.equal(checkpoint.prompt,'How hard was it to follow the captions?');
 assert.deepEqual(checkpoint.scale,{kind:'rating',min:1,max:7,low:'Very easy',high:'Very hard',direction:'positive-to-negative'});
 assert.deepEqual(items.slice(0,4).map(i=>[i.prompt,i.scale]),[
  ['How much effort did reading the captions take?',{kind:'rating',min:1,max:7,low:'Very little',high:'Very much',direction:'positive-to-negative'}],
  ['How consistent did captions for recurring sounds feel?',{kind:'rating',min:1,max:7,low:'Very inconsistent',high:'Very consistent',direction:'negative-to-positive'}],
  ['How much control did you feel over the captions?',{kind:'rating',min:1,max:7,low:'Very little',high:'Very much',direction:'negative-to-positive'}],
  ['How comfortable were the captions to read?',{kind:'rating',min:1,max:7,low:'Very uncomfortable',high:'Very comfortable',direction:'negative-to-positive'}],
 ]);
 assert.deepEqual(items.slice(4).map(i=>[i.key,i.prompt,i.min,i.max,i.step,i.low,i.high]),[
  ['tlx-mental','Mental demand',0,100,5,'Low','High'],['tlx-physical','Physical demand',0,100,5,'Low','High'],['tlx-temporal','Time pressure',0,100,5,'Low','High'],['tlx-performance','Performance',0,100,5,'Good','Poor'],['tlx-effort','Effort',0,100,5,'Low','High'],['tlx-frustration','Frustration',0,100,5,'Low','High'],
 ]);
 assert.ok(items.slice(4).every(i=>i.scale.kind==='rating'&&i.scale.direction==='positive-to-negative'));
});
test('instruments are configurable, missing TLX stays missing, and example comprehension is never shown',()=>{const s=session();assert.equal(endItems(s).length,10);assert.equal(endItems({...s,group:'child'}).length,3);assert.ok(endItems({...s,group:'child'}).every(i=>i.choices?.length===5));assert.equal(endItems({...s,instruments:{...s.instruments,custom:false,tlx:false}}).length,0);assert.equal(rawTlxScore({}),null);assert.equal(rawTlxScore(Object.fromEntries(['mental','physical','temporal','performance','effort','frustration'].map(k=>[`tlx-${k}`,50]))),50);const example=questionFileSchema.parse(JSON.parse(readFileSync('data/study/soar-questions.json','utf8')));assert.equal(checkpointItems({...s,comprehension:true},60,example).length,1);const live={...example,questions:example.questions.map(q=>({...q,example:false}))};assert.equal(checkpointItems({...s,comprehension:true},60,live)[1].choices?.at(-1)?.value,'unsure');});
