import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:800}});
page.on('dialog',(dialog:any)=>dialog.accept());
const read=()=>Object.keys(localStorage).filter(key=>key.startsWith('scenecaptions.telemetry.v2.rehearsal-')&&!/\.\d+$/.test(key)).map(key=>{const manifest=JSON.parse(localStorage.getItem(key)!);return {id:manifest.context.session_id,recording:manifest.recording,events:Array.from({length:manifest.chunks},(_,i)=>JSON.parse(localStorage.getItem(`${key}.${i}`)!)).flat()}});
try {
 await page.goto(process.argv[2]||'http://127.0.0.1:3000');
 const tools=page.locator('.research-tools');await tools.locator('summary').click();
 async function start(){await tools.getByLabel('I agree to record this technical rehearsal locally.',{exact:true}).check();await tools.getByRole('button',{name:'Start rehearsal',exact:true}).click();await tools.getByRole('button',{name:'Stop recording',exact:true}).waitFor()}
 await start();await tools.getByRole('button',{name:'Stop recording',exact:true}).click();
 const first=(await page.evaluate(read))[0];assert.equal(first.events.filter((e:any)=>e.type==='session_start').length,1);
 assert.equal(await tools.getByRole('button',{name:'Start rehearsal',exact:true}).count(),0);
 await tools.getByRole('button',{name:'New rehearsal',exact:true}).click();
 assert.equal(await tools.getByLabel('I agree to record this technical rehearsal locally.',{exact:true}).isChecked(),false);
 await start();const two=await page.evaluate(read);assert.equal(two.length,2);const second=two.find((r:any)=>r.id!==first.id)!;assert.equal(second.events.filter((e:any)=>e.type==='session_start').length,1);
 await page.reload();
 const prompt=page.getByRole('heading',{name:'A previous rehearsal was left open',exact:true});await prompt.waitFor();
 const prior=page.locator('.prior-rehearsal');assert.equal(await prior.getByRole('button',{name:'Resume recording',exact:true}).isDisabled(),true);
 assert.equal(await page.getByRole('button',{name:'Stop recording',exact:true}).count(),0);
 const untouched=await page.evaluate(read);for(const saved of two){const current=untouched.find((r:any)=>r.id===saved.id)!;assert.deepEqual(current.events.slice(0,saved.events.length),saved.events);assert.ok(current.events.slice(saved.events.length).every((e:any)=>e.type==='visibility'))}
 let download=page.waitForEvent('download');await prior.getByRole('button',{name:'Export',exact:true}).click();await download;assert.deepEqual(await page.evaluate(read),untouched);
 await prior.getByLabel('I agree to continue recording this technical rehearsal locally.',{exact:true}).check();await prior.getByRole('button',{name:'Resume recording',exact:true}).click();
 await tools.locator('summary').click();await tools.getByRole('button',{name:'Stop recording',exact:true}).waitFor();
 const resumed=(await page.evaluate(read)).find((r:any)=>r.id===second.id);assert.equal(resumed.events.filter((e:any)=>e.type==='session_resume').length,1);
 await tools.getByRole('button',{name:'Stop recording',exact:true}).click();
 const logs=page.locator('.rehearsal-log-list > li');assert.equal(await logs.count(),2);await logs.first().getByRole('button',{name:'Delete',exact:true}).click();assert.equal(await logs.count(),1);assert.equal((await page.evaluate(read)).length,1);
 mkdirSync('artifacts/dhh-fixes',{recursive:true});writeFileSync('artifacts/dhh-fixes/B1-browser.json',JSON.stringify({passed:true,firstId:first.id,secondId:second.id,separateLogs:true,noAutoResume:true,freshConsent:true,deletion:true},null,2));console.log('B1 passed: separate runs, new consent, reload without capture, read-only export, explicit resume and deletion.');
}finally{await browser.close()}
