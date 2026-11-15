// Installed Chrome, synthetic media clock. Checks overlay accessible text and native cue text for Hair Love cue 1.
// Run with data/cue-annotations/hair-love.json at its committed (heuristic-draft) status for MODE=draft,
// and temporarily set to reviewed for MODE=reviewed. node scripts/verification/dhh-fixes/B6-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const mode=process.env.MODE||'draft',base=process.argv[2]||'http://127.0.0.1:3000';
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(()=>{
  Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 408}});
  Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});
  const times=new WeakMap();Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return times.get(this)||0},set(t){times.set(this,t);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}});
 });
 await page.route('**/*.mp4',route=>route.abort());
 await page.goto(base);
 await page.locator('#film-choice').selectOption({label:'Hair Love'});
 await page.locator('.research-tools > summary').click();
 await page.getByLabel('I agree to record this technical rehearsal locally.').check();
 await page.getByRole('button',{name:'Start rehearsal',exact:true}).click();
 await page.locator('video').first().evaluate(v=>{v.currentTime=89});
 const line=page.locator('.dialogue-lines p').first();await line.waitFor();
 const chip=await line.locator('.speaker-chip').count(),text=(await line.innerText()).replace(/\s+/g,' ').trim(),textContent=(await line.textContent()).replace(/\s+/g,' ').trim();
 const native=await page.locator('video').first().evaluate(v=>Array.from(v.textTracks).flatMap(t=>Array.from(t.cues||[]).map(c=>c.text)).filter(t=>t.includes('little bit')));
 await page.screenshot({path:`artifacts/dhh-fixes/screenshots/B6-${mode}.png`,clip:{x:0,y:0,width:1280,height:900}}).catch(()=>{});
 if(mode==='reviewed'){
  assert.equal(chip,1);assert.equal(await line.locator('.speaker-chip').innerText(),'Angela');
  assert.equal(textContent,'Angela: Just took a little bit\nof work'.replace(/\s+/g,' '));
  assert.ok(native.length&&native.every(t=>t.startsWith('Angela: Just took')),JSON.stringify(native));
  assert.equal(await line.locator('.sr-only').textContent(),': ');
 }else{
  assert.equal(chip,0);assert.equal(textContent,'Angela: Just took a little bit of work');
  assert.ok(native.length&&native.every(t=>t.startsWith('Angela: Just took')),JSON.stringify(native));
 }
 assert.deepEqual(errors,[]);
 mkdirSync('artifacts/dhh-fixes',{recursive:true});
 writeFileSync(`artifacts/dhh-fixes/B6-browser-${mode}.json`,JSON.stringify({synthetic_media:true,mode,chip,text,textContent,native,errors},null,2));
 console.log(`B6 ${mode}: overlay and native cue text passed.`);
}finally{await browser.close()}
