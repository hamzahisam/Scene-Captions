// Installed Chrome, synthetic media clock. node scripts/verification/dhh-fixes/C5-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chrome',headless:true}),out={};
try{
 for(const [name,viewport] of [['desktop',{width:1000,height:800}],['mobile',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 596.461678}});Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}})});
  await page.route('**/*.mp4',r=>r.abort());await page.goto(process.argv[2]||'http://127.0.0.1:3000');
  const frame=page.getByRole('region',{name:'Video player',exact:true}),video=page.locator('video').first();
  await frame.waitFor();
  assert.equal(await video.getAttribute('tabindex'),'-1');assert.equal(await frame.getAttribute('tabindex'),'0');
  const help=page.getByRole('button',{name:'Keyboard shortcuts',exact:true});assert.equal(await help.count(),name==='mobile'?0:1); // phones hide the ? button; the ? key still works
  // The help button is in the control bar, not over the picture at the top right.
  let rects=null;if(name!=='mobile')rects=await page.evaluate(()=>{const h=document.querySelector('button[aria-label="Keyboard shortcuts"]').getBoundingClientRect(),c=document.querySelector('.video-controls').getBoundingClientRect(),f=document.querySelector('.video-stage').getBoundingClientRect();return {h:{x:h.x,y:h.y,w:h.width,hgt:h.height},c:{y:c.y,b:c.bottom},f:{y:f.y,b:f.bottom}}});
  if(rects)assert.ok(rects.h.y>=rects.c.y-1&&rects.h.y+rects.h.hgt<=rects.c.b+1,JSON.stringify(rects));
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('button[aria-label="Keyboard shortcuts"]')).position),'static');
  // Tab order: the frame is the single shortcut focus stop; the video element is never reached.
  await frame.focus();const stops=[];
  for(let i=0;i<14;i++){await page.keyboard.press('Tab');stops.push(await page.evaluate(()=>{const e=document.activeElement;return e.tagName+':'+(e.getAttribute('aria-label')||e.textContent||'').slice(0,24)}))}
  assert.ok(!stops.some(s=>s.startsWith('VIDEO')),stops.join('|'));if(name!=='mobile')assert.ok(stops.some(s=>s.includes('Keyboard shortcuts')),stops.join('|'));
  // Click the picture, then single-key shortcuts still reach the frame handler.
  await video.click({position:{x:40,y:40},force:true});await page.keyboard.press('c');
  await page.getByRole('dialog',{name:'Caption settings',exact:true}).waitFor();await page.keyboard.press('Escape');
  await frame.focus();await page.keyboard.press('?');
  const dialog=page.getByRole('dialog',{name:'Keyboard shortcuts',exact:true});await dialog.waitFor();await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  if(name!=='mobile')assert.equal(await help.evaluate(el=>el===document.activeElement),true);
  if(name!=='mobile'){await help.click();await dialog.waitFor();await dialog.getByRole('button',{name:'Close help',exact:true}).click();}
  await page.locator('.video-stage').first().screenshot({path:`artifacts/dhh-fixes/screenshots/C5-${name}-help-control.png`});
  assert.deepEqual(errors,[]);out[name]={stops,rects,errors};await page.close();
 }
 writeFileSync('artifacts/dhh-fixes/C5-browser.json',JSON.stringify({synthetic_media:true,...out},null,2));
 console.log('C5: video is not a tab stop, frame owns shortcuts, help button sits in the control bar and restores focus.');
}finally{await browser.close()}
