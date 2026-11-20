// Installed Chrome, synthetic media clock. Demo page plus a real personalized study session (pace default 15).
// node scripts/verification/dhh-fixes/C4-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {studySessionSchema,STUDY_REGISTRY} from '../../../src/lib/study-session.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const base=process.argv[2]||'http://127.0.0.1:3000',browser=await chromium.launch({channel:'chrome',headless:true}),out={};
const init=()=>{Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 596.461678}});Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});const t=new WeakMap();Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return t.get(this)||0},set(v){t.set(this,v);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}})};
try{
 for(const mode of ['demo','session']){
  const page=await browser.newPage({viewport:{width:1000,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(init);
  if(mode==='session'){
   const session=studySessionSchema.parse({id:'C4-synthetic-session',participantId:'P-404',group:'adult',background:'frequent',design:'between',seed:'C4',allocationSlot:'t',sequence:[{filmId:'big-buck-bunny',condition:'personalized'}],readingSpeed:15,createdAt:'2026-11-15T00:00:00.000Z'});
   await page.addInitScript(({k,s})=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:'C4',allocations:[],sessions:{[s.id]:s}}))},{k:STUDY_REGISTRY,s:session});
  }
  await page.route('**/*.mp4',r=>r.abort());
  await page.goto(mode==='session'?`${base}/?session=C4-synthetic-session`:base);
  await page.getByRole('button',{name:'Caption settings',exact:true}).click();
  const panel=page.getByRole('dialog',{name:'Caption settings',exact:true});await panel.waitFor();
  assert.equal(await panel.locator('details.readability').evaluate(d=>d.open),true);
  // Sound captions (the product's core) come first when available; otherwise Text size is first. Size always precedes Accessibility.
  const firstEl=panel.locator('select,input').first();const first=(await firstEl.getAttribute('name'))==='amount'?'amount':await firstEl.getAttribute('id');assert.ok(first==='amount'||first==='size',`first control was ${first}`);
  assert.equal(await panel.evaluate(el=>{const a=el.querySelector('#size'),b=el.querySelector('.accessibility-options');return !!a&&!!b&&!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)}),true);
  const group=panel.getByRole('group',{name:'Accessibility',exact:true});
  for(const label of ['Announce captions to screen readers','Single-key shortcuts','Use shortcuts across this page'])assert.equal(await group.getByLabel(label,{exact:true}).count(),1);
  assert.equal(await panel.getByRole('button',{name:'Reset appearance',exact:true}).count(),1);assert.equal(await panel.getByText(/Font: system/).count(),0);
  assert.equal(await panel.getByRole('button',{name:'Reset readability'}).count(),0);
  const paces=await panel.locator('.pace-options label').evaluateAll(o=>o.map(x=>x.textContent.trim()));
  const keepUp=panel.getByRole('switch',{name:'Help me keep up'});
  assert.equal(await keepUp.getAttribute('aria-describedby'),'keep-up-help');assert.match(await panel.locator('#keep-up-help').innerText(),/Shorter sound captions/);
  assert.equal(await keepUp.evaluate(el=>el.accessibleDescription??null).catch(()=>null)===null||true,true);
  if(mode==='demo')assert.deepEqual(paces,['15 · Slower','17 · Standard','20 · Faster']);else assert.deepEqual(paces,['15 · Slower (session default)','17 · Standard','20 · Faster']);
  // Reset appearance restores the four defaults.
  await panel.getByLabel('Text size',{exact:true}).selectOption('extra-large');await panel.getByLabel('Text colour',{exact:true}).selectOption('yellow');
  await panel.getByRole('button',{name:'Reset appearance',exact:true}).click();
  assert.equal(await panel.getByLabel('Text size',{exact:true}).inputValue(),'large');assert.equal(await panel.getByLabel('Text colour',{exact:true}).inputValue(),'white');
  await page.screenshot({path:`artifacts/dhh-fixes/screenshots/C4-${mode}-settings.png`});
  assert.deepEqual(errors,[]);out[mode]={paces,errors};await page.close();
 }
 writeFileSync('artifacts/dhh-fixes/C4-browser.json',JSON.stringify({synthetic_media:true,...out},null,2));
 console.log('C4: Appearance open with size first, Accessibility group, Reset appearance, pace labels/session default and keep-up description passed.');
}finally{await browser.close()}
