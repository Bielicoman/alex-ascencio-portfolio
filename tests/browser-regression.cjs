const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.TEST_URL||'http://127.0.0.1:5180';
const artifacts=process.env.TEST_ARTIFACTS||'work/qa';
fs.mkdirSync(artifacts,{recursive:true});
let browser;
async function open(context){const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('.preloader')).display==='none',{timeout:20000});return {page,errors};}
async function jump(page,id){await page.evaluate(id=>{const a=document.createElement('a');a.href='#'+id;document.body.append(a);a.click();a.remove()},id);await page.waitForTimeout(2000);}
(async()=>{
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const report=[];
 for(const width of process.env.EDITH_ONLY ? [] : [360,390,768,1440,3840]){
  const context=await browser.newContext({viewport:{width,height:width<800?844:1080},deviceScaleFactor:width<800?3:1,isMobile:width<800,hasTouch:width<800});
  const {page,errors}=await open(context);
  assert.equal(await page.evaluate(()=>window.__sfx.enabled),false,'first visit silent');
  assert.equal(await page.evaluate(()=>!!window.__sfx.ctx),false,'audio graph lazy');
  assert.equal(await page.locator('.motion-control').count(),0,'no sensor configuration label');
  if(width<800){
   await page.locator('.mobile-dock').waitFor();
   const controls=await page.locator('.mobile-dock-links a').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height};}));
   assert.ok(controls.every(r=>r.w>=44&&r.h>=44),'dock touch targets');
   await jump(page,'lab');
   const heights=await page.locator('.service').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));assert.ok(Math.max(...heights)<190,'compact services');
   await page.screenshot({path:`${artifacts}/services-${width}.png`});
   await jump(page,'metodo');
   const start=Number(await page.locator('.cc-seek').inputValue());await page.waitForTimeout(1200);const end=Number(await page.locator('.cc-seek').inputValue());assert.ok(end>start,'CapCut starts automatically');
   await page.screenshot({path:`${artifacts}/capcut-${width}.png`});
  }
  await jump(page,'arquivo');
  await page.locator('.card[data-id="34"]').scrollIntoViewIfNeeded();
  const all=await page.locator('.pbtn').evaluateAll(elements=>elements.map(el=>{
   const root=el.getBoundingClientRect(),core=el.querySelector('.pbtn-core').getBoundingClientRect(),ring=el.querySelector('.pbtn-ring').getBoundingClientRect();
   return {visible:root.width>0&&root.height>0,dx:Math.abs((core.left+core.right-ring.left-ring.right)/2),dy:Math.abs((core.top+core.bottom-ring.top-ring.bottom)/2)};
  }));
  for(const r of all.filter(r=>r.visible)){assert.ok(r.dx<1&&r.dy<1,`play alignment at ${width}: ${JSON.stringify(r)}`);}
  const media=page.locator('.card[data-id="34"] .card-media');
  if(width>=800)await media.hover();
  await page.screenshot({path:`${artifacts}/projects-${width}.png`});
  const img=page.locator('.card[data-id="34"] img');assert.ok(await img.evaluate(i=>i.complete&&i.naturalWidth>0),'new thumbnail loaded');
  await page.locator('.card[data-id="34"]').click();
  await page.locator('dialog.player[open]').waitFor();
  assert.ok(await page.locator('dialog.player').evaluate(el=>el.innerHTML.includes('9sUFp9LfQlo')||el.textContent.includes('Ele É')));
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
  await jump(page,'contato');
  await page.locator('.footer-return').scrollIntoViewIfNeeded();await page.waitForTimeout(500);
  const footer=await page.locator('.footer-return').evaluate(el=>{const b=el.querySelector('a').getBoundingClientRect(),r=el.getBoundingClientRect(),row=el.nextElementSibling.getBoundingClientRect();return {center:Math.abs((b.left+b.right)/2-innerWidth/2),gap:row.top-b.bottom,contains:b.top>=r.top&&b.bottom<=r.bottom};});
  assert.ok(footer.center<1&&footer.gap>=16&&footer.contains,`footer ${width}: ${JSON.stringify(footer)}`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`overflow at ${width}`);
  await page.screenshot({path:`${artifacts}/footer-${width}.png`});
  await page.locator('.top-btn').click();await page.waitForTimeout(1800);assert.ok(await page.evaluate(()=>scrollY<5),'back to top');
  assert.deepEqual(errors,[]);report.push({width,playsCentered:all.filter(r=>r.visible).length,footer,errors});
  await context.close();
 }
 // Reproduce delayed requests, close/reopen and consecutive messages through the actual UI.
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{
  class Recognition{start(){window.__rec=this;queueMicrotask(()=>this.onstart?.());}abort(){this.onend?.();}}
  window.SpeechRecognition=Recognition;
 });
 const {page,errors}=await open(context);
 await page.route('**/api/edth',async route=>{const {message}=route.request().postDataJSON();await new Promise(r=>setTimeout(r,500));await route.fulfill({json:{say:'Resposta: '+message,actions:[]}});});
 const launch=()=>page.getByRole('button',{name:'Falar com a EDITH, assistente por voz'}).click();
 const ask=async text=>{await page.locator('.edth-in').fill(text);await page.locator('.edth-in').press('Enter');};
 await launch();await ask('Como funciona uma lente de cinema?');await ask('Como funciona um sensor?');
 await page.getByText('Resposta: Como funciona um sensor?',{exact:true}).first().waitFor();
 await ask('Explique uma câmera');await ask('Parar');await page.getByText('Parei.',{exact:true}).first().waitFor();await page.waitForTimeout(650);assert.equal(await page.getByText('Resposta: Explique uma câmera',{exact:true}).count(),0,'stop cancels response');
 await ask('Explique uma câmera de cinema');await page.locator('.edth-x').click();await page.waitForTimeout(700);assert.equal(await page.locator('.edth').count(),0);
 await launch();assert.equal(await page.locator('.edth').count(),1);
 await page.locator('.edth-mic').click();
 await page.evaluate(()=>{window.__rec.onerror({error:'not-allowed'});});
 await page.getByText(/O microfone está bloqueado/).first().waitFor();assert.equal(await page.locator('.edth-mic').getAttribute('aria-pressed'),'false');
 await ask('Ver projetos');await page.waitForTimeout(1700);assert.ok(await page.locator('.edth-log').textContent());
 await page.screenshot({path:`${artifacts}/edith-desktop.png`});
 await page.locator('.edth-x').click();await page.waitForTimeout(400);assert.deepEqual(errors,[]);
 await context.close();
 const docs=await browser.newPage();for(const [slug,title] of [['documentacao','Documentação'],['privacidade','Privacidade'],['termos','Termos de uso'],['licenca','Licença MIT']]){const response=await docs.goto(base+'/'+slug+'/');assert.equal(response.status(),200);assert.equal(await docs.locator('h1').textContent(),title);}await docs.close();
 await browser.close();browser=null;
 // Reduced motion and a browser without speech APIs must retain navigation/text.
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',isMobile:true,hasTouch:true});
 await reduced.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined});delete window.SpeechRecognition;delete window.webkitSpeechRecognition;});
 const r=await open(reduced);await r.page.getByRole('button',{name:'Falar com a EDITH, assistente por voz'}).click();await r.page.locator('.edth-in').fill('Serviços');await r.page.locator('.edth-in').press('Enter');await r.page.waitForTimeout(600);assert.deepEqual(r.errors,[]);await reduced.close();
 fs.writeFileSync(`${artifacts}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({layouts:report,edith:'passed'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close()});
