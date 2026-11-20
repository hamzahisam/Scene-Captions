// Installed Chrome with synthetic, browser-local adult sessions and a synthetic media clock.
// node --experimental-strip-types scripts/verification/dhh-fixes/B3-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {studySessionSchema,STUDY_REGISTRY} from '../../../src/lib/study-session.ts';
import {parseCsv} from '../../../src/lib/allocation.ts';
import {hashResearcherCode} from '../../../src/lib/researcher-code.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const prompts=[
 'How mentally demanding was the task?',
 'How physically demanding was the task?',
 'How hurried or rushed was the pace of the task?',
 'How successful were you in accomplishing what you were asked to do?',
 'How hard did you have to work to accomplish your level of performance?',
 'How insecure, discouraged, irritated, stressed and annoyed were you?',
];
const keys=['mental','physical','temporal','performance','effort','frustration'],values=[0,20,40,60,80,100];
const directory=process.env.B3_ARTIFACT_DIR||'artifacts/dhh-fixes';mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try {
 for(const skipped of [false,true]){
  const session=studySessionSchema.parse({id:`B3-synthetic-${skipped?'skipped':'complete'}`,participantId:'P-303',group:'adult',background:'frequent',design:'between',seed:'B3',allocationSlot:'test',sequence:[{filmId:'soar',condition:'personalized'}],sequenceIndex:0,readingSpeed:17,instruments:{custom:false,tlx:true,childItems:[]},createdAt:'2026-11-15T00:00:00.000Z',researcher:await hashResearcherCode('012345')});
  const context=await browser.newContext({viewport:skipped?{width:390,height:844}:{width:1000,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({registryKey,session})=>{
   localStorage.setItem(registryKey,JSON.stringify({seed:'B3',allocations:[],sessions:{[session.id]:session}}));
   const times=new WeakMap();
   Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 375}});
   Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});
   Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return times.get(this)||0},set(value){times.set(this,value);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}});
  },{registryKey:STUDY_REGISTRY,session});
  await page.route('**/*.mp4',route=>route.abort());
  await page.goto(`${process.argv[2]||'http://127.0.0.1:3002'}/?session=${session.id}`);
  await page.getByRole('region',{name:'Video player',exact:true}).waitFor();
  await page.locator('video').first().evaluate(v=>{v.currentTime=375;v.dispatchEvent(new Event('ended'))});
  const dialog=page.getByRole('dialog',{name:'End-of-film questions',exact:true});await dialog.waitFor();
  const read=()=>page.evaluate(id=>{
   const prefix=`scenecaptions.telemetry.v2.${id}`,manifest=JSON.parse(localStorage.getItem(prefix));
   return {answers:manifest.answers,recording:manifest.recording,events:Array.from({length:manifest.chunks},(_,i)=>JSON.parse(localStorage.getItem(`${prefix}.${i}`))).flat()};
  },session.id);
  async function escapeUnchanged(){
   const before=await read();await page.evaluate(()=>{window.b3Focus=document.activeElement});
   await page.keyboard.press('Escape');await page.waitForTimeout(50);
   assert.deepEqual(await read(),before);assert.equal(await page.evaluate(()=>document.activeElement===window.b3Focus),true);assert.equal(await dialog.isVisible(),true);
  }
  for(const [index,prompt] of prompts.entries()){
   await dialog.getByRole('group',{name:prompt,exact:true}).waitFor();
   const group=dialog.getByRole('radiogroup',{name:prompt,exact:true}),radios=group.getByRole('radio'),next=dialog.getByRole('button',{name:'Continue',exact:true});
   assert.equal(await radios.count(),21);assert.equal(await group.locator('input:checked').count(),0);assert.equal(await next.isDisabled(),true);
   assert.deepEqual(await radios.evaluateAll(inputs=>inputs.map(input=>Number(input.value))),Array.from({length:21},(_,i)=>i*5));
   assert.equal(await dialog.getByRole('slider').count(),0);assert.equal(await dialog.getByRole('button',{name:'Use 50',exact:true}).count(),0);
   assert.equal(await dialog.getByText('The task: watching the film with these captions.',{exact:true}).isVisible(),true);
   const low=index===3?'Perfect':'Very low',high=index===3?'Failure':'Very high';
   assert.equal(await dialog.getByText(`0 · ${low}`,{exact:true}).isVisible(),true);assert.equal(await dialog.getByText(`100 · ${high}`,{exact:true}).isVisible(),true);
   const description=await group.evaluate(el=>el.getAttribute('aria-describedby').split(' ').map(id=>document.getElementById(id)?.textContent).join(' '));
   assert.ok(description.includes('The task: watching the film with these captions.'));assert.ok(description.includes(low)&&description.includes(high));
   assert.equal(await group.evaluate(el=>el.scrollWidth<=el.clientWidth),true);
   const saved=await read();assert.equal(Object.hasOwn(saved.answers,`end:soar:end:tlx-${keys[index]}`),false);
   await radios.first().focus();await escapeUnchanged();
   // Focus itself must not select 0. Space explicitly selects it, then arrows change by 5.
   assert.equal(await group.locator('input:checked').count(),0);
   await page.keyboard.press('Space');assert.equal(await group.locator('input:checked').inputValue(),'0');
   assert.equal(await next.isEnabled(),true);
   await page.keyboard.press('ArrowRight');assert.equal(await group.locator('input:checked').inputValue(),'5');
   await page.keyboard.press('ArrowLeft');assert.equal(await group.locator('input:checked').inputValue(),'0');
   for(let step=0;step<values[index]/5;step++)await page.keyboard.press('ArrowRight');
   assert.equal(await group.locator('input:checked').inputValue(),String(values[index]));await escapeUnchanged();
   if(index===3)await dialog.screenshot({path:`${directory}/B3-${skipped?'mobile':'desktop'}-performance.png`});
   if(skipped&&index===2)await dialog.getByRole('button',{name:'Skip this item',exact:true}).click();else await next.click();
  }
  await dialog.waitFor({state:'detached'});const saved=await read(),surveys=saved.events.filter(event=>event.type==='survey');
  assert.equal(saved.recording,false);assert.equal(surveys.length,6);
  assert.deepEqual(surveys.map(event=>event.value),values.map((value,index)=>skipped&&index===2?null:value));
  assert.ok(surveys.every(event=>event.scale.kind==='rating'&&event.scale.min===0&&event.scale.max===100&&event.scale.direction==='positive-to-negative'));
  assert.equal(surveys[3].scale.low,'Perfect');assert.equal(surveys[3].scale.high,'Failure');
  // Verify the actual app's exported summary, including missing versus complete Raw TLX.
  await page.getByRole('button',{name:'Researcher',exact:true}).click();
  const unlock=page.getByRole('dialog',{name:'Researcher controls',exact:true});
  await unlock.getByLabel('Researcher code',{exact:true}).fill('012345');await unlock.getByRole('button',{name:'Unlock controls',exact:true}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export summary CSV',exact:true}).click()]);
  const rows=parseCsv(readFileSync(await download.path(),'utf8'));
  const scores=JSON.parse(rows[1][rows[0].indexOf('raw_tlx_by_film')]);assert.deepEqual(scores,{soar:skipped?null:50});
  assert.deepEqual(errors,[]);results.push({skipped,viewport:page.viewportSize(),surveys,scores,errors});await context.close();
  console.log(`B3 ${skipped?'skipped/mobile':'complete/desktop'}: six initially empty groups, keyboard 0/5-step selection, inert Escape and exported Raw TLX passed.`);
 }
 writeFileSync(`${directory}/B3-browser.json`,JSON.stringify({synthetic_media:true,results},null,2));
}finally{await browser.close()}
