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
   if(route==='/'){
    const footnote=await page.locator('.tf-card-footnote').boundingBox();
    const badge=await page.locator('.tf-floating-note').boundingBox();
    expect(badge!.y).toBeGreaterThanOrEqual(footnote!.y+footnote!.height);
    const hero=await page.locator('.tf-hero').boundingBox();
    const summary=await page.locator('.tf-summary').boundingBox();
    const card=await page.locator('.tf-rating-card').boundingBox();
    const cta=await page.locator('.tf-final-cta').boundingBox();
    expect(summary!.y).toBeLessThan(hero!.y+hero!.height);
    expect(summary!.y+summary!.height).toBeGreaterThan(hero!.y+hero!.height);
    expect(card!.width).toBeLessThanOrEqual(448);
    expect(cta!.x).toBeGreaterThanOrEqual(width===390?20:32);
    expect(await page.locator('.tf-results-band').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(15, 12, 23)');
    if(width===1440){
     expect((await page.locator('.tf-header-inner').boundingBox())!.height).toBe(64);
     expect((await page.locator('.tf-hero-inner').boundingBox())!.width).toBe(1152);
     expect(card!.width).toBe(448);
    }

   }
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

test('home header stays visible and becomes glass while scrolling',async({page})=>{
 await mockCobaltFeedback(page);
 await page.goto('/');
 const header=page.locator('.tf-header');
 await expect(header).toHaveAttribute('data-scrolled','false');
 await expect(header).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await page.evaluate(()=>window.scrollTo({top:500,behavior:'instant'}));
 await expect(header).toHaveAttribute('data-scrolled','true');
 await expect(header).toHaveCSS('background-color','rgba(15, 12, 23, 0.8)');
 expect((await header.boundingBox())!.y).toBe(0);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await expect(header).toHaveAttribute('data-scrolled','false');
 await expect(header).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
});
