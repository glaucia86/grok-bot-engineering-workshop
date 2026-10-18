import { test, expect } from '@playwright/test';
import { mockCobaltFeedback } from './fixtures/cobalt-feedback';
import { mkdir } from 'node:fs/promises';

// Explicitly synthetic intercepted responses. No remote database reads/writes.
for (const width of [390, 1440]) for (const locale of ['en-US', 'pt-BR']) {
 test(`visual preview ${width} ${locale}`, async ({page}, testInfo)=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript((value)=>localStorage.setItem('talkfeedback-locale',value),locale);
  await mockCobaltFeedback(page);
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await mkdir('evidence/modulify-preview',{recursive:true});
  for(const route of ['/','/feedback','/results']){
   await page.goto(route);
   await expect(page.locator('html')).toHaveAttribute('lang',locale);
   await expect(page.getByRole('heading',{level:1})).toBeVisible();
   if(route==='/results')await expect(page.getByRole('table')).toBeVisible();
   await page.evaluate(()=>document.fonts.ready);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const screenshot = await page.screenshot({path:`evidence/modulify-preview/${route==='/'?'home':route.slice(1)}-${width}-${locale}-synthetic.png`,fullPage:true});
   await testInfo.attach(`${route==='/'?'home':route.slice(1)}-${width}-${locale}-synthetic`, { body:screenshot, contentType:'image/png' });
  }
  expect(errors).toEqual([]);
 });
}
test('carries hero rating and persists locale through navigation without losing form input',async({page})=>{
 await mockCobaltFeedback(page);await page.goto('/');
 await page.getByRole('radio',{name:'4 stars',exact:true}).check();
 await page.getByRole('link',{name:'Continue with my rating'}).click();
 await expect(page.getByRole('radio',{name:'4 stars',exact:true})).toBeChecked();
 await page.getByLabel('Your name',{exact:true}).fill('Synthetic test');
 await page.getByRole('button',{name:'PT-BR',exact:true}).click();
 await expect(page.getByLabel('Seu nome',{exact:true})).toHaveValue('Synthetic test');
 await expect(page.getByRole('radio',{name:'4 estrelas',exact:true})).toBeChecked();
 await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','pt-BR');
});
