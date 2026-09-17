import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base = process.env.VOCAB_TEST_URL || 'http://127.0.0.1:8080';
const browser = await chromium.launch();
try {
  for (const viewport of [{width:360,height:800},{width:1280,height:720}]) {
    const page = await browser.newPage({viewport});
    const errors=[];
    const failedRequests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('requestfailed',request=>failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
    await page.goto(base+'/play/vocab-hub');
    try {
      await page.frameLocator('iframe').locator('#hub-grid .hub-card').first().waitFor({timeout:60000});
    } catch (error) {
      throw new Error(`Wrapper did not show Vocab Hub: ${JSON.stringify({url:page.url(), body:(await page.locator('body').innerText()).slice(0,1200), frames:page.frames().map(frame=>frame.url()), errors, failedRequests:failedRequests.slice(0,8)})}`,{cause:error});
    }
    const frame=page.frames().find(f=>f.url().includes('vocab-hub.html'));
    await frame.locator('#hub-order-status').filter({hasText:'เลือกหมวดหมู่'}).waitFor({timeout:30000});
    assert.equal(await frame.locator('#hub-edit').isVisible(),false);
    assert.equal(await frame.locator('.hub-card').count(),30);
    assert.equal(await frame.locator('#hub-view').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
    assert.deepEqual(errors,[]);
    await page.screenshot({path:`output/vocab-hub-gallery-check/wrapper-${viewport.width}.png`});
    console.log(`PASS real wrapper ${viewport.width}: public gallery, remote order, admin controls hidden, no page errors`);
    await page.close();
  }
} finally {await browser.close();}
