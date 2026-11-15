import {test} from 'node:test';import assert from 'node:assert/strict';import {studySessionSchema} from '../src/lib/study-session.ts';import {endItems,checkpointItems,questionFileSchema,rawTlxScore,TLX_VALUES,TLX_TASK} from '../src/lib/study-surveys.ts';import {readFileSync} from 'node:fs';
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
test('adult checkpoint and exploratory-item prompts, anchors and polarity stay unchanged',()=>{
 const adult=session(),checkpoint=checkpointItems(adult,60)[0],items=endItems(adult);
 assert.equal(checkpoint.prompt,'How hard was it to follow the captions?');
 assert.deepEqual(checkpoint.scale,{kind:'rating',min:1,max:7,low:'Very easy',high:'Very hard',direction:'positive-to-negative'});
 assert.deepEqual(items.slice(0,4).map(i=>[i.prompt,i.scale]),[
  ['How much effort did reading the captions take?',{kind:'rating',min:1,max:7,low:'Very little',high:'Very much',direction:'positive-to-negative'}],
  ['How consistent did captions for recurring sounds feel?',{kind:'rating',min:1,max:7,low:'Very inconsistent',high:'Very consistent',direction:'negative-to-positive'}],
  ['How much control did you feel over the captions?',{kind:'rating',min:1,max:7,low:'Very little',high:'Very much',direction:'negative-to-positive'}],
  ['How comfortable were the captions to read?',{kind:'rating',min:1,max:7,low:'Very uncomfortable',high:'Very comfortable',direction:'negative-to-positive'}],
 ]);

});
test('instruments are configurable, missing TLX stays missing, and example comprehension is never shown',()=>{const s=session();assert.equal(endItems(s).length,10);assert.equal(endItems({...s,group:'child'}).length,3);assert.ok(endItems({...s,group:'child'}).every(i=>i.choices?.length===5));assert.equal(endItems({...s,instruments:{...s.instruments,custom:false,tlx:false}}).length,0);assert.equal(rawTlxScore({}),null);assert.equal(rawTlxScore(Object.fromEntries(['mental','physical','temporal','performance','effort','frustration'].map(k=>[`tlx-${k}`,50]))),50);const example=questionFileSchema.parse(JSON.parse(readFileSync('data/study/soar-questions.json','utf8')));assert.equal(checkpointItems({...s,comprehension:true},60,example).length,1);const live={...example,questions:example.questions.map(q=>({...q,example:false}))};assert.equal(checkpointItems({...s,comprehension:true},60,live)[1].choices?.at(-1)?.value,'unsure');});

test('TLX uses exact task wording, endpoint polarity and all 21 five-point increments',()=>{
 const items=endItems(session()).filter(item=>item.key.startsWith('tlx-'));
 assert.equal(TLX_TASK,'The task: watching the film with these captions.');
 assert.deepEqual(items.map(item=>item.prompt),[
  'How mentally demanding was the task?',
  'How physically demanding was the task?',
  'How hurried or rushed was the pace of the task?',
  'How successful were you in accomplishing what you were asked to do?',
  'How hard did you have to work to accomplish your level of performance?',
  'How insecure, discouraged, irritated, stressed and annoyed were you?',
 ]);
 assert.deepEqual(TLX_VALUES,[0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]);
 assert.deepEqual(items.map(item=>item.key),['tlx-mental','tlx-physical','tlx-temporal','tlx-performance','tlx-effort','tlx-frustration']);
 for(const item of items){
  const performance=item.key==='tlx-performance',low=performance?'Perfect':'Very low',high=performance?'Failure':'Very high';
  assert.equal(item.segmented,true);
  assert.deepEqual(item.choices,TLX_VALUES.map(value=>({value,label:String(value)})));
  assert.deepEqual([item.min,item.max,item.step,item.low,item.high],[0,100,5,low,high]);
  assert.deepEqual(item.scale,{kind:'rating',min:0,max:100,low,high,direction:'positive-to-negative'});
 }
});
test('Raw TLX averages all six including zero and remains missing for each skipped or absent subscale',()=>{
 const keys=['mental','physical','temporal','performance','effort','frustration'];
 const answers=Object.fromEntries(keys.map((key,index)=>[`tlx-${key}`,index*20]));
 assert.equal(rawTlxScore(answers),50);
 assert.equal(rawTlxScore(Object.fromEntries(keys.map(key=>[`tlx-${key}`,0]))),0);
 for(const key of keys){
  assert.equal(rawTlxScore({...answers,[`tlx-${key}`]:null}),null);
  const missing={...answers};delete missing[`tlx-${key}`];assert.equal(rawTlxScore(missing),null);
 }
});
