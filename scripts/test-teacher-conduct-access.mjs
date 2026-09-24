// Browser regression: real QuickMenu/catalog/router/form, synthetic auth only.
// All non-local requests are intercepted; never submits production scores.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const out = 'output/teacher-conduct-access';
await mkdir(out, { recursive: true });
const selected = ['waste-bank', 'attendance', 'conduct', 'scores', 'scan'];
const html = `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickMenu } from '/src/components/admin/shared/QuickMenu.tsx';
import { ConductManagement } from '/src/components/admin/conduct/ConductManagement.tsx';
import { ADMIN_QUICK_MENU_CATALOG } from '/src/lib/quickMenuCatalog.ts';
import '/src/index.css';
const q = new QueryClient({defaultOptions:{queries:{retry:false,staleTime:Infinity,refetchOnWindowFocus:false}}});
q.setQueryData(['shared-quick-menu'], {menu_item_ids:${JSON.stringify(selected)},known_catalog_ids:ADMIN_QUICK_MENU_CATALOG.map(x=>x.id)});
const e = React.createElement;
createRoot(document.getElementById('root')).render(e(QueryClientProvider,{client:q},e(BrowserRouter,null,e('main',{className:'p-4'},e(Routes,null,
 e(Route,{path:'/admin/dashboard/conduct',element:e(ConductManagement)}),
 e(Route,{path:'*',element:e(QuickMenu,{context:window.fixture.context})})
)))));
</script></body></html>`;
const server = await createServer({ optimizeDeps: { entries: ['src/components/admin/shared/QuickMenu.tsx','src/components/admin/conduct/ConductManagement.tsx'], include: ['react','react-dom/client','react-router-dom','@tanstack/react-query'] }, server: { host: '127.0.0.1', port: 4187, strictPort: true }, plugins: [{
  name: 'conduct-test-only-page',
  configureServer(s) { s.middlewares.use((req, res, next) => {
    if (req.url?.startsWith('/__test/')) {
      s.transformIndexHtml(req.url, html).then(body => { res.setHeader('Content-Type','text/html'); res.end(body); }).catch(next);
    } else next();
  }); },
}] });
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const cases = [
    {role:'teacher',allowedMenus:[],enabled:true,name:'teacher-core'},
    {role:'teacher',allowedMenus:['docs-hub','budget','sar','ics','action-plan','doc-templates','student-docs','documents','saraban','incoming-letters','outgoing-letters','orders','meetings','leave','training','pa','academic','administrators','dashboard-school','curriculum','activities','milestones','facilities','waste-bank','savings-bank','educational-hub','games','analytics'],enabled:true,name:'teacher-28'},
    {role:'admin',allowedMenus:[],enabled:true,name:'admin'},
    {role:'parent',allowedMenus:[],enabled:false,name:'parent'},
    {role:'viewer',allowedMenus:[],enabled:false,name:'viewer'},
    {role:null,allowedMenus:[],enabled:false,name:'unknown'},
  ];
  let checks = 0;
  for (const width of [360,1280]) for (const context of ['admin','teacher']) for (const fixture of cases) {
    const page = await browser.newPage({viewport:{width,height:width===360?800:720}});
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(f => { window.fixture=f; }, {...fixture,context});
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== '127.0.0.1') {
        // Read-only empty fixtures for form data; fail on any attempted write.
        assert.equal(route.request().method(), 'GET', 'No external mutations in this test');
        return route.fulfill({status:200,contentType:'application/json',body:'[]',headers:{'access-control-allow-origin':'*'}});
      }
      if (url.pathname === '/src/contexts/AuthProvider.tsx') return route.fulfill({contentType:'application/javascript',body:`export const useAuth=()=>({...window.fixture,user:{id:'00000000-0000-4000-8000-000000000001'},isAdmin:window.fixture.role==='admin',isTeacher:window.fixture.role==='teacher',loading:false});`});
      return route.continue();
    });
    await page.goto('http://127.0.0.1:4187/__test/quick-menu');
    const button = page.getByRole('button',{name:'ธนาคารความดี',exact:true});
    await button.waitFor();
    assert.equal(await button.isEnabled(), fixture.enabled, `${fixture.name}/${context}/${width}: conduct access`);
    assert.equal(await page.getByRole('button',{name:'สแกน QR',exact:true}).isEnabled(),fixture.role==='admin','Do not unlock QR for teachers');
    if (fixture.role==='parent'||fixture.role==='viewer'||fixture.role===null) {
      assert.equal(await page.getByRole('button',{name:'เช็คชื่อ',exact:true}).isEnabled(),false,'Teacher core requires teacher role');
    }
    const labels = await page.locator('main button').filter({has:page.locator('svg')}).allTextContents();
    assert.deepEqual(labels.filter(x=>x!=='จัดการ').map(x=>x.trim()),['ธนาคารขยะ','เช็คชื่อ','ธนาคารความดี','คะแนน','สแกน QR'],'Shared menu order stays unchanged');
    if (fixture.name==='teacher-core') {
      const box = await button.boundingBox();
      assert.ok(box && box.x>=0 && box.x+box.width<=width,'Menu stays inside viewport');
      await page.screenshot({path:`${out}/${context}-${width}.png`});
      await button.click();
      await page.getByRole('heading',{name:'ระบบธนาคารความดี',exact:true}).waitFor();
      assert.equal(new URL(page.url()).pathname,'/admin/dashboard/conduct');
      await page.getByRole('tab',{name:'ทีละคน',exact:true}).waitFor();
      const bulkTab = page.getByRole('tab',{name:'หลายคน',exact:true});
      await bulkTab.focus();
      await bulkTab.press('Enter');
      await page.waitForFunction(() => Array.from(document.querySelectorAll('[role="tab"]')).some(x=>x.textContent.includes('หลายคน') && x.getAttribute('aria-selected')==='true'));
      await page.screenshot({path:`${out}/${context}-form-${width}.png`});
    }
    assert.deepEqual(errors,[],'No runtime errors');
    await page.close();
    checks++;
  }
  console.log(`PASS ${checks} role/context/viewport checks; real menu + conduct forms, no score writes`);
} finally {
  await browser?.close();
  await server.close();
}
