// Installed Chrome, synthetic media clock. node scripts/verification/dhh-fixes/C2-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(()=>{
  Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 596.461678}});Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});
  const times=new WeakMap();Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return times.get(this)||0},set(t){times.set(this,t);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}});
 });
 await page.route('**/*.mp4',r=>r.abort());
 await page.goto(process.argv[2]||'http://127.0.0.1:3000');
 const next=page.getByRole('button',{name:'Next sound',exact:true});await next.waitFor();
 await page.locator('video').first().evaluate(v=>{v.currentTime=0.1});await next.click();
 const sound=page.locator('.caption-lines p.sound-type:not(.sound-music)').first();
 // keep stepping until a non-music typed sound is active
 for(let i=0;i<40&&!(await sound.count());i++){await next.click();await page.waitForTimeout(100);await page.locator('video').first().evaluate(v=>{v.currentTime=v.currentTime+0.3});await page.waitForTimeout(150)}
 await sound.waitFor();
 const style=()=>sound.evaluate(el=>{const s=getComputedStyle(el);return {fontStyle:s.fontStyle,boxShadow:s.boxShadow,borderLeft:s.borderLeftWidth,borderRight:s.borderRightWidth,text:el.textContent}});
 const before=await style();
 assert.equal(before.fontStyle,'normal');assert.match(before.boxShadow,/rgb\(219, 232, 190\) 0px 0px 0px 2px/);assert.equal(before.borderLeft,'0px');assert.equal(before.borderRight,'0px');
 await page.screenshot({path:'artifacts/dhh-fixes/screenshots/C2-upright-sound.png'});
 await page.getByRole('button',{name:'Caption settings',exact:true}).click();
 const panel=page.getByRole('dialog',{name:'Caption settings',exact:true});
 await panel.getByText('More sound options',{exact:true}).click();
 const italic=panel.getByLabel('Italic sound captions',{exact:true});assert.equal(await italic.isChecked(),false);
 await italic.check();assert.equal((await style()).fontStyle,'italic');
 await page.screenshot({path:'artifacts/dhh-fixes/screenshots/C2-italic-optin.png'});
 await page.reload();await page.locator('video').first().evaluate(v=>{v.currentTime=0.1});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('scenecaptions.profile.v1')).italicSound);assert.equal(saved,true);
 assert.deepEqual(errors,[]);writeFileSync('artifacts/dhh-fixes/C2-browser.json',JSON.stringify({synthetic_media:true,before,italicPersisted:saved,errors},null,2));
 console.log('C2: upright symmetric default, opt-in italic, persistence passed.');
}finally{await browser.close()}
