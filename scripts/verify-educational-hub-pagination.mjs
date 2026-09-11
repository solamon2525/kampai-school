import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? process.env.EDU_HUB_URL ?? 'https://kampai-school.vercel.app/h/nattapong';
const viewports = process.env.EDU_HUB_VIEWPORT_WIDTH
  ? [{
      width: Number(process.env.EDU_HUB_VIEWPORT_WIDTH),
      height: Number(process.env.EDU_HUB_VIEWPORT_HEIGHT ?? 720),
    }]
  : [
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
    ];
const browser = await chromium.launch({ headless: true });

const waitForItems = async (page) => {
  await page.locator('[data-edu-hub-items]').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('[data-edu-hub-items]')?.getAttribute('aria-busy') === 'false');
};

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}?cat=media`, { waitUntil: 'networkidle' });
    await waitForItems(page);

    const mediaResult = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-edu-hub-item-id]')];
      const ids = cards.map((card) => card.getAttribute('data-edu-hub-item-id'));
      const count = Number(document.querySelector('[data-edu-hub-category-count]')?.getAttribute('data-edu-hub-category-count'));
      return {
        cardCount: cards.length,
        uniqueCount: new Set(ids).size,
        displayedCount: count,
        hasPagination: Boolean(document.querySelector('nav[aria-label="หน้ารายการสื่อ"]')),
        hasPageLabel: /หน้า\s+\d+\s+จาก\s+\d+/.test(document.body.innerText),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    assert.ok(mediaResult.cardCount > 0, `media cards should render at ${viewport.width}px`);
    assert.equal(mediaResult.cardCount, mediaResult.uniqueCount, 'media cards must not be duplicated');
    assert.equal(mediaResult.cardCount, mediaResult.displayedCount, 'media count must match all rendered cards');
    assert.equal(mediaResult.hasPagination, false, 'media must not render pagination controls');
    assert.equal(mediaResult.hasPageLabel, false, 'media must not render a page label');
    assert.equal(mediaResult.horizontalOverflow, false, `media must not overflow at ${viewport.width}px`);
    await page.close();
  }

  const redirectPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await redirectPage.goto(`${baseUrl}?cat=lesson-packs`, { waitUntil: 'networkidle' });
  await redirectPage.waitForURL(/cat=media/);
  assert.equal(await redirectPage.locator('nav[aria-label="หน้ารายการสื่อ"]').count(), 0);
  await redirectPage.close();

  const interactionPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await interactionPage.goto(`${baseUrl}?cat=media`, { waitUntil: 'networkidle' });
  await waitForItems(interactionPage);
  const initialCount = await interactionPage.locator('[data-edu-hub-item-id]').count();
  let mediaQueriesAfterResize = 0;
  const countMediaQueries = (request) => {
    if (request.url().includes('/rest/v1/educational_hub_items?') && request.url().includes('category_id=eq.')) {
      mediaQueriesAfterResize += 1;
    }
  };
  interactionPage.on('request', countMediaQueries);
  await interactionPage.setViewportSize({ width: 768, height: 1024 });
  await interactionPage.setViewportSize({ width: 1280, height: 720 });
  await interactionPage.waitForTimeout(500);
  interactionPage.off('request', countMediaQueries);
  assert.equal(mediaQueriesAfterResize, 0, 'resizing media must not issue a new item-page query');

  const subjectButton = interactionPage.locator('[data-edu-hub-subject-filter]').first();
  const selectedSubject = await subjectButton.getAttribute('data-edu-hub-subject-filter');
  assert.ok(selectedSubject, 'at least one subject filter should be available');
  await subjectButton.click();
  await interactionPage.waitForLoadState('networkidle');
  await waitForItems(interactionPage);
  const filteredSubjects = await interactionPage.locator('[data-edu-hub-item-id]').evaluateAll((cards) =>
    cards.map((card) => card.getAttribute('data-edu-hub-item-subject')),
  );
  assert.ok(filteredSubjects.length > 0 && filteredSubjects.length <= initialCount);
  assert.ok(filteredSubjects.every((subject) => subject === selectedSubject), 'subject filter must apply to every loaded batch');

  await interactionPage.locator('[aria-label="ตัวกรองวิชาหลัก"] button').filter({ hasText: 'ทั้งหมด' }).click();
  await interactionPage.waitForLoadState('networkidle');
  await waitForItems(interactionPage);
  assert.equal(await interactionPage.locator('[data-edu-hub-item-id]').count(), initialCount);

  const firstTitle = await interactionPage.locator('[data-edu-hub-item-id]').first().getAttribute('data-edu-hub-item-title');
  assert.ok(firstTitle, 'media card title should be available');
  await interactionPage.getByRole('searchbox', { name: 'ค้นหาในชื่อหรือคำอธิบาย' }).fill(firstTitle);
  await interactionPage.getByRole('button', { name: 'ยืนยันการค้นหา' }).click();
  await interactionPage.waitForLoadState('networkidle');
  await waitForItems(interactionPage);
  const searchTitles = await interactionPage.locator('[data-edu-hub-item-id]').evaluateAll((cards) =>
    cards.map((card) => card.getAttribute('data-edu-hub-item-title')),
  );
  assert.ok(searchTitles.includes(firstTitle), 'search should keep the matching media card');

  await interactionPage.getByRole('button', { name: 'ล้างคำค้น' }).click();
  await interactionPage.waitForLoadState('networkidle');
  await waitForItems(interactionPage);
  await interactionPage.getByRole('combobox').click();
  await interactionPage.getByRole('option', { name: 'ก-ฮ / A-Z' }).click();
  await interactionPage.waitForLoadState('networkidle');
  await waitForItems(interactionPage);
  const pinnedStates = await interactionPage.locator('[data-edu-hub-item-id]').evaluateAll((cards) =>
    cards.map((card) => card.getAttribute('data-edu-hub-pinned')),
  );
  const firstUnpinned = pinnedStates.indexOf('false');
  assert.ok(firstUnpinned < 0 || pinnedStates.slice(firstUnpinned).every((state) => state === 'false'), 'pinned media must stay above unpinned media');
  await interactionPage.close();

  const worksheetPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await worksheetPage.goto(`${baseUrl}?cat=worksheets`, { waitUntil: 'networkidle' });
  await waitForItems(worksheetPage);
  assert.ok(await worksheetPage.locator('nav[aria-label="หน้ารายการสื่อ"]').count() > 0, 'worksheets should keep pagination');
  await worksheetPage.close();

  const failurePage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const itemRequest = /\/rest\/v1\/educational_hub_items\?/;
  await failurePage.route(itemRequest, (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'forced browser QA failure' }),
  }));
  await failurePage.goto(`${baseUrl}?cat=media`, { waitUntil: 'domcontentloaded' });
  await failurePage.getByRole('alert').waitFor({ state: 'visible', timeout: 45000 });
  await failurePage.unroute(itemRequest);
  await failurePage.getByRole('button', { name: 'ลองใหม่' }).click();
  await waitForItems(failurePage);
  assert.ok(await failurePage.locator('[data-edu-hub-item-id]').count() > 0, 'retry should recover the full media list');
  await failurePage.close();

  console.log(`Educational Hub media all-items browser QA passed at ${viewports.map((item) => item.width).join(', ')}px, including filters, sorting, redirect, retry, and worksheet pagination.`);
} finally {
  await browser.close();
}
