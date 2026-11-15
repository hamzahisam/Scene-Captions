// Installed Chrome, synthetic media clock, browser-local synthetic sessions only.
// node --experimental-strip-types scripts/verification/dhh-fixes/B2-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {studySessionSchema,STUDY_REGISTRY} from '../../../src/lib/study-session.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try {
 for(const group of ['child','adult']){
  const session=studySessionSchema.parse({id:`B2-synthetic-${group}`,participantId:'P-202',group,background:'frequent',design:'between',seed:'B2',allocationSlot:'test',sequence:[{filmId:'soar',condition:'personalized'}],sequenceIndex:0,readingSpeed:17,checkpoints:{soar:[2,20]},instruments:{custom:true,tlx:false,childItems:['readability','control','story']},createdAt:'2026-11-15T00:00:00.000Z'});
  const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({registryKey,session})=>{
   localStorage.setItem(registryKey,JSON.stringify({seed:'B2',allocations:[],sessions:{[session.id]:session}}));
   const times=new WeakMap(),playing=new WeakSet();
   Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 375}});
   Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});
   Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return !playing.has(this)}});
   Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return times.get(this)||0},set(value){times.set(this,value);queueMicrotask(()=>{this.dispatchEvent(new Event('seeked'));this.dispatchEvent(new Event('timeupdate'))})}});
   HTMLMediaElement.prototype.play=function(){playing.add(this);this.dispatchEvent(new Event('play'));return Promise.resolve()};
   HTMLMediaElement.prototype.pause=function(){playing.delete(this);this.dispatchEvent(new Event('pause'))};
  },{registryKey:STUDY_REGISTRY,session});
  await page.route('**/*.mp4',route=>route.abort());
  await page.goto(`${process.argv[2]||'http://127.0.0.1:3002'}/?session=${session.id}`);
  const cc=page.getByRole('button',{name:'Caption settings',exact:true});await cc.waitFor();
  // Existing dialogs retain default Escape dismissal and trigger focus restoration.
  await cc.click();await page.getByRole('dialog',{name:'Caption settings',exact:true}).waitFor();await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog',{name:'Caption settings',exact:true}).count(),0);assert.equal(await cc.evaluate(el=>el===document.activeElement),true);
  await page.getByRole('button',{name:'Play video',exact:true}).first().click();
  await page.locator('video').first().evaluate(v=>{v.currentTime=2});
  const checkpoint=page.getByRole('dialog',{name:'Quick check-in',exact:true});await checkpoint.waitFor();
  assert.equal(await page.locator('video').first().evaluate(v=>v.paused),true);
  const read=()=>page.evaluate(id=>{
   const key=`scenecaptions.telemetry.v2.${id}`,manifest=JSON.parse(localStorage.getItem(key));
   return {answers:manifest.answers,recording:manifest.recording,events:Array.from({length:manifest.chunks},(_,i)=>JSON.parse(localStorage.getItem(`${key}.${i}`))).flat()};
  },session.id);
  async function escapeUnchanged(dialog){
   const before=await read(),legend=await dialog.locator('legend').textContent();
   await page.evaluate(()=>{window.b2Active=document.activeElement;window.b2Escapes=0;window.b2Listener=e=>{if(e.key==='Escape')window.b2Escapes++};document.addEventListener('keydown',window.b2Listener)});
   await page.keyboard.press('Escape');await page.waitForTimeout(80);
   assert.equal(await dialog.isVisible(),true);assert.equal(await dialog.locator('legend').textContent(),legend);
   assert.deepEqual(await read(),before,'Escape must not write answers/events or advance');
   assert.deepEqual(await page.evaluate(()=>({same:document.activeElement===window.b2Active,inside:!!document.activeElement.closest('.survey-dialog'),propagated:window.b2Escapes})),{same:true,inside:true,propagated:0});
   await page.evaluate(()=>document.removeEventListener('keydown',window.b2Listener));
  }
  async function faces(dialog,control=false){
   const labels=control?['Not at all','A little','Some','Mostly','Yes']:['Very hard','Hard','In between','Easy','Very easy'];
   assert.equal(await dialog.locator('svg[data-survey-face]').count(),5);
   for(const [index,label] of labels.entries()){
    const radio=dialog.getByRole('radio',{name:label,exact:true});assert.equal(await radio.count(),1);
    assert.equal(await radio.locator('..').locator(`svg[data-survey-face="${index+1}"][aria-hidden="true"][focusable="false"]`).count(),1);
   }
   assert.equal(/[\u{1F600}-\u{1F64F}]/u.test(await dialog.textContent()),false);
  }
  assert.equal(await checkpoint.getByRole('radio').count(),group==='child'?5:7);
  assert.equal(await checkpoint.locator('legend').textContent(),group==='child'?'How easy was it to follow the captions?':'How hard was it to follow the captions?');
  if(group==='child')await faces(checkpoint);
  await escapeUnchanged(checkpoint);
  await checkpoint.getByRole('radio').last().check();await escapeUnchanged(checkpoint);
  assert.equal(await checkpoint.getByRole('radio').last().isChecked(),true);
  await checkpoint.getByRole('button',{name:'Continue',exact:true}).click();await checkpoint.waitFor({state:'detached'});
  await page.locator('video').first().evaluate(v=>{v.currentTime=30});
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem(`scenecaptions.telemetry.v2.${id}`)).answers['checkpoint:soar:20:complete']===1,session.id);
  await page.locator('video').first().evaluate(v=>{v.currentTime=375;v.dispatchEvent(new Event('ended'))});
  const end=page.getByRole('dialog',{name:'End-of-film questions',exact:true});await end.waitFor();
  const endCount=group==='child'?3:4;
  for(let index=0;index<endCount;index++){
   if(group==='child')await faces(end,index===1);
   await escapeUnchanged(end);await end.getByRole('radio').first().check();await escapeUnchanged(end);
   // Explicit Skip remains available and records null even with a selection.
   await end.getByRole('button',{name:'Skip this item',exact:true}).focus();await escapeUnchanged(end);
   await end.getByRole('button',{name:'Skip this item',exact:true}).click();
  }
  await end.waitFor({state:'detached'});const saved=await read(),surveys=saved.events.filter(e=>e.type==='survey');
  assert.equal(saved.recording,false);assert.equal(surveys.length,2+endCount);
  assert.equal(surveys[0].value,group==='child'?5:7);assert.equal(surveys[0].source,'participant');
  assert.equal(surveys[1].value,null);assert.equal(surveys[1].source,'system');assert.equal(surveys[1].response_ms,0);
  assert.ok(surveys.slice(2).every(e=>e.value===null&&e.source==='participant'));
  assert.ok(surveys.every(e=>e.scale?.kind==='rating'&&e.scale.low&&e.scale.high));
  assert.ok(surveys.every(e=>e.scale.direction===(group==='child'?'negative-to-positive':e.item.endsWith(':effort')?'positive-to-negative':'negative-to-positive')));
  assert.deepEqual(errors,[]);results.push({group,escapeChecks:2+endCount*3,surveys,errors});await context.close();
  console.log(`B2 ${group}: Escape/focus/answer invariance, explicit Skip, scales and system misses passed.`);
 }
 const directory=process.env.B2_ARTIFACT_DIR||'artifacts/dhh-fixes';mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/B2-browser.json`,JSON.stringify({synthetic_media:true,results},null,2));
} finally {await browser.close()}
