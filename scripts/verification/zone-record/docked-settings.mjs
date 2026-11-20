// Docked caption settings: visible by default, live preview, collapse/expand, remembered, keyboard C; grouped research tools; speed options.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const base=process.argv[2]||'http://127.0.0.1:3000';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/');await page.getByRole('region',{name:'Video player',exact:true}).waitFor();
const panel=page.getByRole('region',{name:'Caption settings',exact:true});
await panel.waitFor();
assert.equal(await page.getByRole('button',{name:'Caption settings',exact:true}).isVisible(),false,'CC button is redundant while docked');
assert.equal(await panel.getByText('Preview',{exact:true}).count(),1);
const legends=await panel.locator('legend').allInnerTexts();assert.equal(legends[0].toLowerCase(),'sound captions','sound captions come first');
assert.ok(legends.some(l=>/amount of detail/i.test(l)));
assert.equal(await panel.getByRole('radio',{name:/Essential/}).count(),1);
assert.deepEqual(await panel.locator('.pace-options label').allInnerTexts().then(a=>a.map(x=>x.trim())),['15 · Slower','17 · Standard','20 · Faster']);
// Live preview follows appearance.
await panel.locator('#size').selectOption('extra-large');assert.match(await panel.locator('.sp-caption').getAttribute('class'),/size-extra-large/);
await panel.locator('#text-color').selectOption('yellow');assert.match(await panel.locator('.sp-caption').getAttribute('class'),/tc-yellow/);
// Collapse, remember, expand.
const toggle=page.getByRole('button',{name:'Hide',exact:false}).first();assert.equal(await toggle.getAttribute('aria-expanded'),'true');
await toggle.click();await panel.waitFor({state:'hidden'});
const show=page.getByRole('button',{name:'Show caption settings'});assert.equal(await show.getAttribute('aria-expanded'),'false');
await page.reload();await page.getByRole('region',{name:'Video player',exact:true}).waitFor();await page.getByRole('button',{name:'Show caption settings'}).waitFor();
assert.equal(await panel.isVisible(),false,'collapsed state is remembered');
// Keyboard C expands and moves focus into the panel.
await page.getByRole('region',{name:'Video player',exact:true}).focus();await page.keyboard.press('c');await panel.waitFor();await page.waitForTimeout(250);
assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('#caption-settings')),true);
assert.equal(await page.locator('#size').inputValue(),'extra-large','saved appearance persisted');
await page.getByRole('button',{name:'Hide'}).first().click();await page.getByRole('button',{name:'Show caption settings'}).click();await panel.waitFor();
// Playback speeds.
const speeds=await page.locator('#speed option').allInnerTexts();assert.equal(speeds.length,7);assert.ok(speeds[0].startsWith('0.5')&&speeds.at(-1).startsWith('2'));
// Research tools are grouped.
await page.locator('.research-tools>summary').click();
for(const h of ['Recording','Caption condition','Sound timeline','Saved rehearsals'])assert.equal(await page.getByRole('heading',{name:h,exact:true,level:3}).count(),1,h);
// Below 1100px the in-frame sheet returns.
await page.setViewportSize({width:1000,height:800});await page.getByRole('button',{name:'Caption settings',exact:true}).waitFor();
assert.equal(await panel.isVisible(),false);
assert.deepEqual(errors,[]);
console.log('docked settings: default visible, preview, collapse/expand remembered, keyboard C, 7 speeds, grouped research tools, in-frame sheet below 1100px passed.');
await browser.close();
