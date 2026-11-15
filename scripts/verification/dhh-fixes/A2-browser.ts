// Synthetic media-clock interaction check; no real playback or physical fullscreen claim.
// node --experimental-strip-types scripts/verification/dhh-fixes/A2-browser.ts [baseURL]
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {DEFAULT_PROFILE,videoSchema,resolveCaption} from '../../../src/lib/captions.ts';
import {studySessionSchema,profileNamespace,conditionProfile,STUDY_REGISTRY} from '../../../src/lib/study-session.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const data=videoSchema.parse(JSON.parse(readFileSync('data/source-assisted-captions/big-buck-bunny-controls.json','utf8')));
const initial={...DEFAULT_PROFILE,size:'standard' as const,detail:3 as const,expression:1 as const,adaptive:true,representation:'plain' as const,readingSpeed:15 as const,typeStyling:false,markShortened:true};
// Appearance is open by default (C4); only open it when a persisted state closed it.
const openAppearance=async(panel:any)=>{if(!(await panel.locator('details.readability').evaluate((el:HTMLDetailsElement)=>el.open)))await panel.getByText('Appearance',{exact:true}).click()};
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
 for(const [index,condition] of (['baseline','personalized','essential','balanced','rich'] as const).entries()){
  const session=studySessionSchema.parse({id:`A2-synthetic-${condition}`,participantId:`P-${200+index}`,group:'adult',background:'frequent',design:'between',seed:'A2',allocationSlot:'test',sequence:[{filmId:data.video_id,condition}],readingSpeed:20,instruments:{custom:false,tlx:false,childItems:[]},createdAt:'2026-11-15T00:00:00.000Z'});
  const key=profileNamespace(session),context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
  const errors:string[]=[];page.on('pageerror',(e:Error)=>errors.push(e.message));page.on('dialog',(dialog:any)=>dialog.accept());
  await page.addInitScript(({duration,profile,key,registryKey,session}:any)=>{
   if(!localStorage.getItem(registryKey)){localStorage.setItem(registryKey,JSON.stringify({seed:'A2',allocations:[],sessions:{[session.id]:session}}));localStorage.setItem(key,JSON.stringify(profile))}
   Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return duration}});Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});
   const times=new WeakMap<HTMLMediaElement,number>();Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return times.get(this)||0},set(t:number){times.set(this,t);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}});
  },{duration:data.duration_seconds,profile:initial,key,registryKey:STUDY_REGISTRY,session});
  await page.route('**/*.mp4',(route:any)=>route.abort());
  await page.goto(`${process.argv[2]||'http://127.0.0.1:3000'}/?session=${session.id}`);
  const cc=page.getByRole('button',{name:'Caption settings',exact:true}),frame=page.getByRole('region',{name:'Video player',exact:true});
  await cc.waitFor();await frame.focus();await page.keyboard.press('c');
  const panel=page.getByRole('dialog',{name:'Caption settings',exact:true});await panel.waitFor();
  const fixed=condition!=='personalized';
  assert.equal(await panel.getByText('Sound captions are fixed for this session.',{exact:true}).count(),fixed?1:0);
  assert.equal(await panel.getByRole('radiogroup',{name:'Amount of detail'}).count(),fixed?0:1);
  assert.equal(await panel.getByRole('switch',{name:'Help me keep up'}).count(),fixed?0:1);
  if(!fixed)await panel.getByText('More sound options',{exact:true}).click();
  for(const name of ['Reading pace','Sound representation','Mark shortened captions','Show sound type styling'])assert.equal(await panel.getByLabel(name,{exact:true}).count(),fixed?0:1);
  assert.equal(await panel.getByRole('group',{name:'Punctuation inside sound captions',exact:true}).count(),fixed?0:1);
  await openAppearance(panel);
  const labels=['Italic sound captions','Text size','Position on the video','Backdrop','Text colour','Announce captions to screen readers','Single-key shortcuts','Use shortcuts across this page'];
  for(const label of labels)assert.equal(await panel.getByLabel(label,{exact:true}).isVisible(),true);
  await panel.getByLabel('Text size',{exact:true}).selectOption('extra-large');await panel.getByLabel('Position on the video',{exact:true}).selectOption('top');
  await panel.getByLabel('Backdrop',{exact:true}).selectOption('translucent');await panel.getByLabel('Text colour',{exact:true}).selectOption('yellow');
  await panel.getByLabel('Announce captions to screen readers',{exact:true}).check();await panel.getByLabel('Single-key shortcuts',{exact:true}).uncheck();await panel.getByLabel('Use shortcuts across this page',{exact:true}).check();
  await panel.getByRole('button',{name:'Close caption settings'}).click();
  await frame.focus();await page.keyboard.press('c');assert.equal(await panel.count(),0);
  await page.locator('video').evaluate((v:HTMLVideoElement,t:number)=>{v.currentTime=t},data.cues[0].start_s+.01);
  await page.locator('.caption-overlay.extra-large.top.backdrop-translucent.color-yellow').waitFor();
  const expected=resolveCaption(data.cues[0],conditionProfile(initial,session),condition==='baseline'?'baseline':'personalized').text;
  const announcements=page.locator('[aria-live="polite"][aria-atomic="true"]');assert.ok((await announcements.textContent()).includes(expected));
  await cc.click();await openAppearance(panel);
  assert.equal(await panel.getByLabel('Announce captions to screen readers',{exact:true}).isChecked(),true);assert.equal(await panel.getByLabel('Single-key shortcuts',{exact:true}).isChecked(),false);
  await panel.getByLabel('Single-key shortcuts',{exact:true}).check();await panel.getByRole('button',{name:'Close caption settings'}).click();
  await page.evaluate(()=>{document.body.tabIndex=-1;document.body.focus()});await page.keyboard.press('-');
  await page.locator('.caption-overlay.large.top').waitFor();
  await frame.focus();await page.keyboard.press('[');await page.keyboard.press('o');
  let stored=await page.evaluate((key:string)=>JSON.parse(localStorage.getItem(key)||'{}'),key);assert.equal(stored.detail,fixed?initial.detail:2);
  await page.getByRole('button',{name:'Keyboard shortcuts',exact:true}).click();
  const help=page.getByRole('dialog',{name:'Keyboard shortcuts',exact:true});await help.waitFor();
  assert.equal(await help.getByText('Original; hold to compare',{exact:true}).count(),fixed?0:1);assert.equal(await help.getByText('Less / more detail',{exact:true}).count(),fixed?0:1);assert.equal(await help.getByText('Caption settings',{exact:true}).count(),1);assert.equal(await help.getByText('Smaller / larger text',{exact:true}).count(),1);
  await help.getByRole('button',{name:'Close help'}).click();
  const events=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('scenecaptions.telemetry.v2.')&&/\.\d+$/.test(k)).flatMap(k=>JSON.parse(localStorage.getItem(k)||'[]')));
  const changes=events.filter((e:any)=>e.type==='profile_change'&&e.source==='participant');
  for(const field of ['size','position','backdrop','textColor','announceCaptions','shortcuts','pageWideShortcuts'])assert.ok(changes.some((e:any)=>e.field===field),`${condition}: missing ${field} telemetry`);
  if(fixed){assert.ok(changes.every((e:any)=>['size','position','backdrop','textColor','announceCaptions','shortcuts','pageWideShortcuts'].includes(e.field)));assert.equal(events.filter((e:any)=>e.type==='original').length,0)}
  else {assert.ok(changes.some((e:any)=>e.field==='detail'));assert.ok(events.some((e:any)=>e.type==='original'))}
  // Disable single-key shortcuts, then prove the effective preferences survive reload.
  await cc.click();await openAppearance(panel);await panel.getByLabel('Single-key shortcuts',{exact:true}).uncheck();await panel.getByRole('button',{name:'Close caption settings'}).click();
  await page.reload();await cc.waitFor();await cc.click();await openAppearance(panel);
  for(const [label,value] of [['Text size','large'],['Position on the video','top'],['Backdrop','translucent'],['Text colour','yellow']])assert.equal(await panel.getByLabel(label,{exact:true}).inputValue(),value);
  assert.equal(await panel.getByLabel('Announce captions to screen readers',{exact:true}).isChecked(),true);assert.equal(await panel.getByLabel('Single-key shortcuts',{exact:true}).isChecked(),false);assert.equal(await panel.getByLabel('Use shortcuts across this page',{exact:true}).isChecked(),true);
  await panel.getByRole('button',{name:'Close caption settings'}).click();await frame.focus();await page.keyboard.press('c');assert.equal(await panel.count(),0);
  await page.locator('video').evaluate((v:HTMLVideoElement,t:number)=>{v.currentTime=t},data.cues[0].start_s+.01);await page.locator('.caption-overlay.large.top.backdrop-translucent.color-yellow').waitFor();assert.ok((await announcements.textContent()).trim());
  stored=await page.evaluate((key:string)=>JSON.parse(localStorage.getItem(key)||'{}'),key);assert.deepEqual(errors,[]);
  results.push({condition,fixed,appearanceControls:labels,stored,participantChanges:changes,errors});console.log(`A2 ${condition}: controls, effective appearance/announcements/shortcuts, persistence and telemetry passed.`);
  await context.close();
 }
 mkdirSync('artifacts/dhh-fixes',{recursive:true});writeFileSync('artifacts/dhh-fixes/A2-browser.json',JSON.stringify({synthetic_media:true,results},null,2));
} finally {await browser.close()}
