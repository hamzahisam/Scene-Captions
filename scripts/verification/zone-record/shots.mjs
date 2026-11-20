// Zone Record visual check: opens caption settings and captures desktop/mobile. Real Chrome; screenshots to .impeccable/review/zr.
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
import {mkdirSync} from 'node:fs';
const out='.impeccable/review/zr';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
for(const [name,w,h] of [['desktop',1440,900],['laptop',1366,657],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width:w,height:h}});
  await page.goto('http://127.0.0.1:3000/');await page.waitForLoadState('networkidle');
  await page.screenshot({path:`${out}/${name}-home.png`});
  await page.getByRole('button',{name:/caption settings/i}).first().click();
  await page.waitForTimeout(300);
  await page.screenshot({path:`${out}/${name}-settings.png`});
  await page.close();
}
await browser.close();console.log('done');
