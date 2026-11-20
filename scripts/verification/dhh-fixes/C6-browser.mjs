// Installed Chrome, synthetic media clock (dev server exposes main[data-render-count]).
// node scripts/verification/dhh-fixes/C6-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const data=JSON.parse(readFileSync('data/source-assisted-captions/big-buck-bunny-controls.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1000,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(d=>{Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return d}});Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});const t=new WeakMap();Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return t.get(this)||0},set(v){t.set(this,v);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}})},data.duration_seconds);
 await page.route('**/*.mp4',r=>r.abort());await page.goto(process.argv[2]||'http://127.0.0.1:3000');
 const main=page.locator('main'),count=async()=>Number(await main.getAttribute('data-render-count')),video=page.locator('video').first();
 await page.getByRole('button',{name:'Caption settings',exact:true}).waitFor();
 const seek=async t=>{await video.evaluate((v,x)=>{v.currentTime=x},t);await page.waitForTimeout(250)};
 const cues=data.cues,at=i=>cues[i].start_s+0.2;
 // Closed drawer: seeks do not re-render the workspace and the hidden timeline is not following.
 await seek(at(3));const closedBefore=await count();await seek(at(10));await seek(at(20));const closedAfter=await count();
 assert.equal(closedAfter,closedBefore,'workspace re-rendered on seeks with the drawer closed');
 await page.locator('.research-tools > summary').click();await page.waitForTimeout(300);
 const current=async()=>page.locator('.sound-timeline .cue-row.current').allInnerTexts();
 const first=await current();assert.ok(first.length>0,'open drawer shows the current cue');
 const openBase=await count();const seen=[];
 for(const i of [30,40,50,60]){await seek(at(i));seen.push(await current())}
 assert.equal(await count(),openBase,'workspace re-rendered on clock ticks with the drawer open');
 assert.ok(new Set(seen.map(x=>x.join('|'))).size>=3,JSON.stringify(seen));
 await page.locator('.research-tools > summary').click();await page.waitForTimeout(200);
 const closedAgain=await count();await seek(at(70));assert.equal(await count(),closedAgain);
 assert.deepEqual(errors,[]);
 writeFileSync('artifacts/dhh-fixes/C6-browser.json',JSON.stringify({synthetic_media:true,renderCounts:{closedBefore,closedAfter,openBase,closedAgain},seen,errors},null,2));
 console.log('C6: timeline follows the clock only while open; workspace render count stays flat.');
}finally{await browser.close()}
