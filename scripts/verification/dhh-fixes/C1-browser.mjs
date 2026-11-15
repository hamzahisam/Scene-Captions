// Installed Chrome, synthetic media clock. node scripts/verification/dhh-fixes/C1-browser.mjs [baseURL]
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(()=>{
  Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 600}});Object.defineProperty(HTMLMediaElement.prototype,'readyState',{get(){return 1}});
  const times=new WeakMap();Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return times.get(this)||0},set(t){times.set(this,t);queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}});
 });
 await page.route('**/*.mp4',r=>r.abort());
 await page.goto(process.argv[2]||'http://127.0.0.1:3000');
 const prev=page.getByRole('button',{name:'Previous sound',exact:true}),next=page.getByRole('button',{name:'Next sound',exact:true});
 await next.waitFor();
 const info=await Promise.all([prev,next].map(b=>b.evaluate(el=>({text:el.textContent,svg:el.querySelectorAll('svg[aria-hidden="true"]').length,paths:el.querySelectorAll('path').length,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}))));
 for(const i of info){assert.equal(i.text,'');assert.equal(i.svg,1);assert.equal(i.paths,1);assert.ok(i.w>=32&&i.h>=32,JSON.stringify(i))}
 await page.locator('video').first().evaluate(v=>{v.currentTime=0.1});
 assert.equal(await next.isEnabled(),true);await next.click();await page.waitForFunction(()=>document.querySelector('video').currentTime>1);
 const t=await page.locator('video').first().evaluate(v=>v.currentTime);await next.click();await page.waitForFunction(first=>document.querySelector('video').currentTime>first,t);assert.equal(await prev.isEnabled(),true);const back=await page.locator('video').first().evaluate(v=>v.currentTime);await prev.click();await page.waitForFunction(x=>document.querySelector('video').currentTime<x,back);
 await page.locator('.transport').first().screenshot({path:'artifacts/dhh-fixes/screenshots/C1-sound-navigation.png'});
 assert.deepEqual(errors,[]);writeFileSync('artifacts/dhh-fixes/C1-browser.json',JSON.stringify({synthetic_media:true,info,afterNext:t,errors},null,2));
 console.log('C1: sound-navigation icons render with unchanged accessible names and working seeks.');
}finally{await browser.close()}
