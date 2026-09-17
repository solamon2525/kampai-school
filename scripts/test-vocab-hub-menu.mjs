import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { CATEGORY_SLUGS } from '../public/games/english/vocab-hub-order.mjs';

const base = process.env.VOCAB_TEST_URL || 'http://127.0.0.1:8080';
const output = 'output/vocab-hub-gallery-check';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
let centralOrder = [...CATEGORY_SLUGS];
const errors = [];
const checks = [];
async function open(width = 1280, height = 720, admin = false, touch = false) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, reducedMotion: 'reduce' });
  await context.exposeFunction('readOrder', () => centralOrder);
  await context.exposeFunction('saveOrder', order => { centralOrder = order; return order; });
  await context.route(base + '/__vocab_test', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><style>html,body{margin:0;width:100%;height:100%}iframe{border:0;width:100%;height:100%}</style>
    <iframe src="/games/english/vocab-hub.html?embed=1"></iframe><script>
    window.failSave=false;
    addEventListener('message',async e=>{
      const frame=document.querySelector('iframe').contentWindow;
      if(e.source!==frame||e.origin!==location.origin)return;
      if(e.data.type==='vocabHubLayoutRequest')frame.postMessage({type:'vocabHubLayoutState',order:await readOrder(),canEdit:${admin},loading:false,error:false},location.origin);
      if(e.data.type==='vocabHubLayoutSave')frame.postMessage({type:'vocabHubLayoutSaved',requestId:e.data.requestId,ok:!window.failSave,order:window.failSave?undefined:await saveOrder(e.data.order)},location.origin);
    });</script>` })) ;
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/__vocab_test');
  const frame = page.frames().find(f => f.url().includes('vocab-hub.html'));
  await frame.waitForFunction(() => !!window.VocabHubMenu);
  await frame.locator('#hub-order-status').filter({ hasText: 'เลือกหมวดหมู่' }).waitFor();
  return { page, frame, context };
}
function order(frame) { return frame.locator('[data-category]').evaluateAll(cards => cards.map(c => c.dataset.category)); }
try {
  for (const [width,height,columns] of [[360,800,[1,2,2]], [1280,720,[3,4,5]], [1920,1080,[4,5,6]]]) {
    const { page, frame, context } = await open(width,height);
    for (const [index,view] of ['large','standard','compact'].entries()) {
      await frame.locator(`[data-hub-view=${view}]`).click();
      assert.equal(await frame.locator('#hub-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), columns[index]);
      assert.equal(await frame.locator('#hub-view').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
      assert.equal(await frame.locator('#hub-edit').isVisible(), false);
      assert.equal(await frame.locator('.hc-reorder').first().isVisible(), false);
      assert.deepEqual(await order(frame), CATEGORY_SLUGS);
      await frame.locator('.hc-icon img').evaluateAll(images => images.forEach(img => { img.loading = 'eager'; }));
      await frame.waitForFunction(() => [...document.querySelectorAll('.hc-icon img')].length === 30 && [...document.querySelectorAll('.hc-icon img')].every(i => i.complete && i.naturalWidth === 640 && i.naturalHeight === 640));
      assert.equal(await frame.locator('.hc-th,.hc-en,.hc-count').evaluateAll(elements => elements.every(el => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1)), true);
      await page.screenshot({ path: `${output}/${width}-${view}.png` });
      checks.push(`${width}x${height} ${view}: columns, overflow, 30 images, labels, public controls`);
    }
    await page.reload();
    await page.frameLocator('iframe').locator('#hub-view[data-view=compact]').waitFor();
    await context.close();
  }
  const { page, frame, context } = await open(1280,720,true);
  await frame.locator('[data-hub-view=compact]').click();
  await frame.locator('#hub-edit').click();
  await frame.locator('[data-category=numbers] [data-move=after]').focus();
  await page.keyboard.press('Enter');
  assert.equal((await order(frame))[1], 'numbers');
  assert.equal(await frame.evaluate(() => location.hash), '');
  await frame.locator('#hub-cancel').click();
  assert.deepEqual(await order(frame), CATEGORY_SLUGS);
  await frame.locator('#hub-edit').click();
  const source = await frame.locator('[data-category=numbers] .hc-handle').boundingBox();
  const target = await frame.locator('[data-category=alphabet]').boundingBox();
  await page.mouse.move(source.x + source.width/2,source.y + source.height/2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width/2,target.y + 30,{ steps:12 });
  await page.mouse.up();
  assert.equal((await order(frame))[4], 'numbers');
  await page.evaluate(() => { window.failSave=true; });
  await frame.locator('#hub-save').click();
  await frame.locator('#hub-order-status').filter({hasText:'บันทึกไม่สำเร็จ'}).waitFor();
  assert.equal((await order(frame))[4], 'numbers');
  await page.evaluate(() => { window.failSave=false; });
  await frame.locator('#hub-save').click();
  await frame.locator('#hub-order-status').filter({hasText:'บันทึกแล้ว'}).waitFor();
  const second = await open();
  assert.deepEqual(await order(second.frame), centralOrder);
  await second.context.close();
  // A message from the iframe itself is not a parent response, even at the same origin.
  await frame.evaluate(() => window.postMessage({type:'vocabHubLayoutState',order:['birds'],canEdit:false},location.origin));
  await page.waitForTimeout(100);
  assert.equal(await frame.locator('#hub-edit').isVisible(), true);
  await frame.locator('#hub-edit').click();
  await frame.locator('#hub-reset').click();
  assert.deepEqual(await order(frame), CATEGORY_SLUGS);
  await frame.locator('#hub-cancel').click();
  assert.deepEqual(await order(frame), centralOrder);
  await frame.locator('#hub-edit').click();
  await frame.locator('#hub-reset').click();
  await frame.locator('#hub-save').click();
  await frame.locator('#hub-order-status').filter({hasText:'บันทึกแล้ว'}).waitFor();
  await frame.locator('[data-category=animals]').click();
  await frame.waitForFunction(() => location.hash === '#animals');
  await frame.evaluate(() => { location.hash=''; });
  await frame.locator('#hub-view').waitFor({state:'visible'});
  assert.deepEqual(await order(frame), CATEGORY_SLUGS);
  assert.equal(await frame.locator('.hc-icon img').count(),30);
  checks.push('Keyboard move, cancel, cross-row pointer drag, failed save preserves draft, shared order in second browser, forged source, reset, category return');
  await context.close();
  const mobile = await open(360,800,true,true);
  await mobile.frame.locator('[data-hub-view=compact]').click();
  await mobile.frame.locator('#hub-edit').click();
  await mobile.frame.locator('[data-category=numbers] .hc-handle').scrollIntoViewIfNeeded();
  const handle = await mobile.frame.locator('[data-category=numbers] .hc-handle').boundingBox();
  const client = await mobile.context.newCDPSession(mobile.page);
  const start={x:Math.round(handle.x+handle.width/2),y:Math.round(handle.y+handle.height/2)};
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x,y:790}]});
  await mobile.page.waitForTimeout(700);
  assert.equal(await mobile.frame.locator('#hub-view').evaluate(el=>el.scrollTop>150),true);
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await mobile.frame.evaluate(()=>location.hash),'');
  checks.push('Touch drag and edge auto-scroll without accidental navigation');
  await mobile.context.close();
  const fileContext = await browser.newContext();
  const filePage = await fileContext.newPage();
  const standaloneUrl = pathToFileURL(resolve('public/games/english/vocab-hub.html')).href;
  await filePage.goto(standaloneUrl, { waitUntil: 'domcontentloaded' });
  assert.equal(filePage.url(), standaloneUrl);
  await filePage.waitForTimeout(500);
  assert.equal(filePage.url(), standaloneUrl);
  checks.push('Standalone file:// preview does not redirect to the web app');
  await fileContext.close();
  assert.deepEqual(errors,[]);
  writeFileSync(`${output}/report.json`,JSON.stringify({checks,errors},null,2));
  console.log('PASS',checks);
} finally { await browser.close(); }
