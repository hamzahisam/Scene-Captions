// Installed Chrome, synthetic media clock, browser-local rehearsal only. node scripts/verification/dhh-fixes/C7-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(()=>{Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 596.461678}});Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});const t=new WeakMap();Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return t.get(this)||0},set(v){t.set(this,v);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}})});
 await page.route('**/*.mp4',r=>r.abort());await page.goto(process.argv[2]||'http://127.0.0.1:3000');
 await page.locator('.research-tools > summary').click();
 await page.getByLabel('I agree to record this technical rehearsal locally.').check();
 await page.getByRole('button',{name:'Start rehearsal',exact:true}).click();
 const events=()=>page.evaluate(()=>{const key=Object.keys(localStorage).find(k=>/^scenecaptions\.telemetry\.v2\.[^.]+$/.test(k)&&JSON.parse(localStorage.getItem(k)).recording);const m=JSON.parse(localStorage.getItem(key));return Array.from({length:m.chunks},(_,i)=>JSON.parse(localStorage.getItem(`${key}.${i}`))).flat()});
 const group=page.getByRole('group',{name:'Research caption condition',exact:true}),personalized=group.getByRole('button',{name:'Personalized',exact:true}),baseline=group.getByRole('button',{name:'Reference baseline',exact:true});
 const count=async()=>(await events()).length;
 // Same condition: nothing is logged.
 const n0=await count();const originals0=(await events()).filter(x=>x.type==='original').length;await personalized.click();await page.waitForTimeout(150);assert.equal(await count(),n0);
 // Real switch, Original off: one condition event, no profile_change, no original event.
 await baseline.click();await page.waitForTimeout(200);
 let e=await events();const cond=e.filter(x=>x.type==='condition');
 assert.equal(cond.length,1);assert.deepEqual([cond[0].from,cond[0].condition,cond[0].source],['personalized','baseline','researcher']);
 assert.equal(e.filter(x=>x.type==='profile_change'&&x.field==='condition').length,0);assert.equal(e.filter(x=>x.type==='original').length,originals0);
 // Original captions control was removed from the UI: a switch emits the condition event and no original events.
 await baseline.click();await page.waitForTimeout(100);assert.equal((await events()).filter(x=>x.type==='condition').length,1);
 await personalized.click();await page.waitForTimeout(150);
 const before=await events();const onBefore=before.filter(x=>x.type==='original'&&x.enabled===true).length,offBefore=before.filter(x=>x.type==='original'&&x.enabled===false).length;assert.equal(onBefore,0);
 await baseline.click();await page.waitForTimeout(200);
 e=await events();assert.equal(e.filter(x=>x.type==='condition').length,3);assert.equal(e.filter(x=>x.type==='original'&&x.enabled===false).length,offBefore);
 assert.equal(e.filter(x=>x.type==='profile_change'&&x.field==='condition').length,0);
 assert.deepEqual(errors,[]);
 writeFileSync('artifacts/dhh-fixes/C7-browser.json',JSON.stringify({synthetic_media:true,conditionEvents:e.filter(x=>x.type==='condition'),originalEvents:e.filter(x=>x.type==='original'),errors},null,2));
 console.log('C7: one researcher condition event per real change; Original-off only when it was on; no-op logs nothing.');
}finally{await browser.close()}
