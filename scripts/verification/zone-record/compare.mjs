// Captures the deployed original and the local redesign side by side. Real Chrome.
const {chromium}=await import(process.env.PLAYWRIGHT_PATH||'/Users/zuhairmerchant/TexPilot/yarn-erp/node_modules/playwright/index.mjs');
const out='.impeccable/review/cmp';
const targets={orig:'https://scene-captions.vercel.app',local:'http://127.0.0.1:3000'};
const browser=await chromium.launch({channel:'chrome'});
for(const [tag,base] of Object.entries(targets)){
  for(const [name,w,h] of [['desktop',1440,900],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width:w,height:h}});
    try{
      await page.goto(base+'/',{waitUntil:'load',timeout:60000});await page.waitForTimeout(2500);
      await page.screenshot({path:`${out}/${tag}-${name}-home.png`});
      const cc=page.getByRole('button',{name:/caption settings|^CC$/i}).first();
      if(await cc.count()){await cc.click();await page.waitForTimeout(500);await page.screenshot({path:`${out}/${tag}-${name}-settings.png`});}
      console.log(tag,name,'ok',await page.title());
    }catch(e){console.log(tag,name,'ERR',String(e).slice(0,120))}
    await page.close();
  }
}
await browser.close();
