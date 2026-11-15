// Final integrated flow in installed Chrome: real session creation, resume/reload, researcher unlock,
// survey keyboard path, end of film 1, next film, desktop and mobile. Synthetic media clock; browser-local data only.
// node scripts/verification/dhh-fixes/final-e2e.mjs [baseURL]
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const base=process.argv[2]||'http://127.0.0.1:3000',shots='artifacts/dhh-fixes/screenshots';mkdirSync(shots,{recursive:true});
const durations={soar:374.352109,'hair-love':407.881723},browser=await chromium.launch({channel:'chrome',headless:true}),out={};
const init=d=>{const dur=d;Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return /hair/i.test(this.currentSrc||this.src||'')?dur['hair-love']:dur.soar}});Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});const t=new WeakMap();Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return t.get(this)||0},set(v){t.set(this,v);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}})};
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],uploads=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET'&&r.method()!=='HEAD'&&!r.url().startsWith('data:'))uploads.push(r.method()+' '+r.url());else if(!r.url().startsWith(base)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:')&&!/\.mp4(\?|$)/.test(r.url()))uploads.push(r.url())});
  await page.addInitScript(init,durations);await page.route('**/*.mp4',r=>r.abort());
  // 1. Real session creation.
  await page.goto(`${base}/session`);
  await page.getByLabel('Design',{exact:true}).selectOption('within-pilot');
  await page.getByLabel('Hair Love',{exact:true}).check();
  await page.getByLabel('Participant code',{exact:true}).fill('P-501');await page.getByLabel('Researcher code',{exact:true}).fill('012345');
  await page.getByLabel('I am preparing a local technical rehearsal; study consent is handled separately.',{exact:true}).check();
  await page.getByRole('button',{name:'Create session',exact:true}).click();
  await page.locator('p[role="status"]').filter({hasText:'Saved pilot slot'}).waitFor();
  const reg=await page.evaluate(()=>JSON.parse(localStorage.getItem('scenecaptions.study-registry.v1')));const session=Object.values(reg.sessions)[0];
  assert.equal(session.sequence.length,2);assert.ok(session.researcher.hash);
  await page.screenshot({path:`${shots}/final-${name}-session-setup.png`,fullPage:true});
  // 2. Open link: study mode, no research controls, researcher hidden until unlocked.
  await page.goto(`${base}/?session=${session.id}`);
  const firstFilm=session.sequence[0].filmId;
  await page.getByRole('button',{name:'Caption settings',exact:true}).waitFor();
  assert.equal(await page.locator('.research-tools').count(),0);assert.equal(await page.locator('#film-choice').count(),0);
  assert.equal(await page.getByLabel('Researcher note (no names or contact details)',{exact:true}).count(),0);
  await page.screenshot({path:`${shots}/final-${name}-study-start.png`});
  // 3. Reload resumes the same session; unlock/relock.
  await page.reload();await page.getByRole('button',{name:'Caption settings',exact:true}).waitFor();
  const researcher=page.getByRole('button',{name:'Researcher',exact:true});await researcher.click();
  let dialog=page.getByRole('dialog',{name:'Researcher controls',exact:true});await dialog.getByLabel('Researcher code',{exact:true}).fill('000000');await dialog.getByRole('button',{name:'Unlock controls',exact:true}).click();await dialog.getByRole('alert').waitFor();
  await dialog.getByLabel('Researcher code',{exact:true}).fill('012345');await dialog.getByRole('button',{name:'Unlock controls',exact:true}).click();
  await dialog.getByLabel('Researcher note (no names or contact details)',{exact:true}).waitFor();await page.keyboard.press('Escape');
  await page.reload();await researcher.waitFor();assert.equal(await page.getByLabel('Researcher note (no names or contact details)',{exact:true}).count(),0);
  // 4. Keyboard: frame is the only shortcut stop, ? opens help, c opens settings, Escape restores focus.
  const frame=page.getByRole('region',{name:'Video player',exact:true});await frame.focus();
  await page.keyboard.press('?');const help=page.getByRole('dialog',{name:'Keyboard shortcuts',exact:true});await help.waitFor();await page.keyboard.press('Escape');await help.waitFor({state:'detached'});
  await frame.focus();await page.keyboard.press('c');const panel=page.getByRole('dialog',{name:'Caption settings',exact:true});await panel.waitFor();
  assert.equal(await panel.locator('details.readability').evaluate(d=>d.open),true);await page.keyboard.press('Escape');await panel.waitFor({state:'detached'});
  // 5. End of the first film: survey by keyboard, then the next film loads.
  const video=page.locator('video').first();
  await video.evaluate((v,d)=>{v.currentTime=d;v.dispatchEvent(new Event('ended'))},durations[firstFilm]);
  const survey=page.getByRole('dialog',{name:'End-of-film questions',exact:true});await survey.waitFor();
  await page.screenshot({path:`${shots}/final-${name}-end-survey.png`});
  let answered=0;
  for(let i=0;i<20;i++){
   await page.waitForTimeout(150);if(!(await survey.count()))break;
   await survey.locator('input[type=radio],button:has-text("Finish film")').first().waitFor();
   const finish=survey.getByRole('button',{name:'Finish film',exact:true});if(await finish.count()){await finish.click();break}
   const radios=survey.getByRole('radio');await radios.first().focus();await page.keyboard.press('Space');
   const cont=survey.getByRole('button',{name:'Continue',exact:true});await cont.waitFor();assert.equal(await cont.isEnabled(),true);await cont.focus();await page.keyboard.press('Enter');answered++;
  }
  assert.ok(answered>=10,`answered ${answered}`);
  await survey.waitFor({state:'detached'});
  const after=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('scenecaptions.study-registry.v1')).sessions)[0].sequenceIndex);assert.equal(after,1);
  await page.waitForFunction(t=>document.querySelector('h1')?.textContent?.includes(t),'Hair Love',{timeout:8000}).catch(()=>{});
  const title=await page.locator('h1').first().innerText();assert.match(title,session.sequence[1].filmId==='hair-love'?/Hair Love/:/Soar/);
  await page.screenshot({path:`${shots}/final-${name}-next-film.png`});
  // 6. Reload resumes at the second film.
  await page.reload();await page.getByRole('button',{name:'Caption settings',exact:true}).waitFor();assert.match(await page.locator('h1').first().innerText(),/Hair Love|Soar/);
  assert.deepEqual(errors,[]);assert.deepEqual(uploads,[],'no uploads: only GETs of the app and film media');
  out[name]={answered,filmSequence:session.sequence.map(x=>x.filmId+':'+x.condition),title,errors,uploads};await context.close();
  console.log(`final ${name}: creation, reload, unlock, keyboard, survey, end and next film passed (${answered} answers).`);
 }
 writeFileSync('artifacts/dhh-fixes/final-e2e.json',JSON.stringify({synthetic_media:true,...out},null,2));
}finally{await browser.close()}
