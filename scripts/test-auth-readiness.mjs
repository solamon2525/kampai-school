// Real provider + route guards over HTTP, with a synthetic Supabase boundary.
// No production credentials, database writes, or account impersonation.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import ts from 'typescript';
import { createServer } from 'vite';
import { chromium } from 'playwright';

await mkdir('output/auth-readiness',{recursive:true});
// Execute the actual App route registration, replacing only the editor body.
const appSource=ts.createSourceFile('App.tsx',await readFile('src/App.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let editorRoute;
function findRoute(node){if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(appSource)==='Route'&&node.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(appSource)==='path'&&a.initializer&&ts.isStringLiteral(a.initializer)&&a.initializer.text==='/admin/page-builder'))editorRoute=node.getText(appSource);ts.forEachChild(node,findRoute);}
findRoute(appSource);
assert.ok(editorRoute,'App registers Page Builder');
const editorRegistration=ts.transpileModule(`const registeredEditorRoute=(${editorRoute});`,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.ESNext}}).outputText;
const html = `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><body><div id="root"></div><script type="module">
import React from 'react'; import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {AuthProvider,useAuth} from '/src/contexts/AuthProvider.tsx';
import {PortalProtectedRoute} from '/src/components/portal/PortalProtectedRoute.tsx';
import ProtectedRoute from '/src/components/admin/shared/ProtectedRoute.tsx';
import '/src/index.css';
const e=React.createElement;
const PageBuilder=()=>e('h1',null,'Page Builder fixture');
${editorRegistration}
function Probe(){const a=useAuth();window.auth=a;return null;}
function MenuGuard(){const a=useAuth(); if(a.loading)return e('p',null,'รอโหลดสิทธิ์');return a.isAdmin||a.allowedMenus.includes('settings')?e('h1',null,'ตั้งค่า'):e(Navigate,{to:'/denied'});}
createRoot(document.getElementById('root')).render(e(QueryClientProvider,{client:new QueryClient({defaultOptions:{queries:{retry:false}}})},e(AuthProvider,null,e(BrowserRouter,null,e(Probe),e(Routes,null,
e(Route,{path:'/__test/settings',element:e(ProtectedRoute,null,e(MenuGuard))}),
registeredEditorRoute,
e(Route,{path:'*',element:e('h1',null,'ไม่มีสิทธิ์ / เข้าสู่ระบบ')})
)))));
</script></body></html>`;
const fakeClient = `
const pending=[];let callback;let realtime;
const session=id=>id?{user:{id,email:'fixture@example.invalid'},access_token:'synthetic',refresh_token:'synthetic',expires_in:3600,token_type:'bearer'}:null;
window.emitAuth=(id,event='SIGNED_IN')=>callback(event,session(id));
window.realtimeAuth=()=>realtime?.();
window.resolveAuth=(table,data,error=null,userId)=>{const i=pending.findIndex(x=>x.table===table&&(!userId||x.id===userId));if(i<0)throw Error('No pending '+table);pending.splice(i,1)[0].resolve({data,error});};
window.pendingAuth=()=>pending.map(x=>({table:x.table,id:x.id}));
export const supabase={auth:{getSession:async()=>{
if(window.sessionMode==='error')throw Error('session unavailable');
if(window.sessionMode==='deferred')return new Promise(resolve=>{window.resolveSession=id=>resolve({data:{session:session(id)},error:null});});
return {data:{session:session(window.sessionMode==='anonymous'?null:'A')},error:null};
},onAuthStateChange:fn=>{callback=fn;return{data:{subscription:{unsubscribe(){callback=()=>{};}}}};}},
from(table){let id;let signal;const query={select(){return query;},eq(k,v){id=v;return query;},single(){return query;},maybeSingle(){return query;},abortSignal(s){signal=s;return query;},then(resolve,reject){pending.push({table,id,resolve,reject});}};return query;},
channel(){const c={on(t,f,fn){realtime=fn;return c;},subscribe(){return c;}};return c;},removeChannel(){}};
`;
const server=await createServer({optimizeDeps:{entries:['src/contexts/AuthProvider.tsx'],include:['react','react-dom/client','react-router-dom','@tanstack/react-query']},server:{host:'127.0.0.1',port:4188,strictPort:true},plugins:[{name:'auth-test-page',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url?.startsWith('/__test/')||req.url==='/admin/page-builder')s.transformIndexHtml(req.url,html).then(body=>{res.setHeader('Content-Type','text/html');res.end(body);}).catch(next);else next();});}}]});
let browser;
const failures=[];
try{
 await server.listen();browser=await chromium.launch();
 async function setup(path,width=360,sessionMode=null){const page=await browser.newPage({viewport:{width,height:width===360?800:720}});page.setDefaultTimeout(10000);await page.addInitScript(mode=>{window.sessionMode=mode;},sessionMode);await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();if(u.pathname==='/src/integrations/supabase/client.ts')return r.fulfill({contentType:'application/javascript',body:fakeClient});return r.continue();});await page.goto('http://127.0.0.1:4188'+path);await page.waitForFunction(()=>window.auth);if(!sessionMode)await page.waitForFunction(()=>window.pendingAuth?.().length>=2);return page;}
 async function resolve(page,role='admin',menus=[],error=null,userId){await page.evaluate(({role,menus,error,userId})=>{window.resolveAuth('user_roles',role?{role,staff_id:null,administrator_id:null}:null,error,userId);window.resolveAuth('user_menu_permissions',{menu_ids:menus},null,userId);},{role,menus,error,userId});}
 async function run(name,fn){if(process.env.AUTH_TEST_CASE&&!name.includes(process.env.AUTH_TEST_CASE))return;try{await fn();console.log('PASS',name);}catch(e){failures.push(name+': '+e.message);console.error('FAIL',name,e.message);}}
 for(const width of [360,1280]){
  await run('pending deep link '+width,async()=>{const p=await setup('/__test/settings',width);assert.equal(await p.evaluate(()=>window.auth.loading),true);assert.equal(new URL(p.url()).pathname,'/__test/settings');await p.evaluate(()=>window.resolveAuth('user_roles',{role:'admin',staff_id:null,administrator_id:null}));assert.equal(await p.evaluate(()=>window.auth.isAdmin),false,'Menu response still pending');await p.evaluate(()=>window.resolveAuth('user_menu_permissions',{menu_ids:[]}));await p.getByRole('heading',{name:'ตั้งค่า',exact:true}).waitFor();await p.screenshot({path:'output/auth-readiness/settings-'+width+'.png'});await p.close();});
  for(const role of ['admin','teacher','parent','viewer'])await run('editor '+role+' '+width,async()=>{const p=await setup('/admin/page-builder',width);await resolve(p,role);await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.getByRole('heading',{name:'Page Builder fixture',exact:true}).count(),role==='admin'?1:0);await p.close();});
  await run('error retry '+width,async()=>{const p=await setup('/admin/page-builder',width);await resolve(p,null,[],{message:'synthetic failure'});await p.getByRole('button',{name:'ลองใหม่',exact:true}).waitFor();assert.equal(await p.evaluate(()=>window.auth.isAdmin),false);await p.screenshot({path:'output/auth-readiness/error-'+width+'.png'});await p.getByRole('button',{name:'ลองใหม่',exact:true}).click();await p.waitForFunction(()=>window.pendingAuth().length>=2);await resolve(p);await p.getByRole('heading',{name:'Page Builder fixture',exact:true}).waitFor();await p.close();});
 }
 await run('signout ignores old response',async()=>{const p=await setup('/admin/page-builder');await p.evaluate(()=>window.emitAuth(null));await resolve(p);await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.evaluate(()=>window.auth.isAdmin),false);await p.close();});
 await run('switch user ignores old response',async()=>{const p=await setup('/admin/page-builder');await p.evaluate(()=>window.emitAuth('B'));await p.waitForFunction(()=>window.pendingAuth().some(x=>x.id==='B'));await resolve(p,'teacher',[],null,'B');await resolve(p,'admin',[],null,'A');await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.evaluate(()=>window.auth.role),'teacher');await p.close();});
 await run('missing role fails closed',async()=>{const p=await setup('/admin/page-builder');await resolve(p,null);await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.evaluate(()=>window.auth.isAdmin),false);assert.ok(await p.evaluate(()=>window.auth.authError));await p.close();});
 await run('menu error fails closed',async()=>{const p=await setup('/admin/page-builder');await p.evaluate(()=>{window.resolveAuth('user_roles',{role:'admin'});window.resolveAuth('user_menu_permissions',null,{message:'denied'});});await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.evaluate(()=>window.auth.isAdmin),false);assert.ok(await p.evaluate(()=>window.auth.authError));await p.close();});
 await run('realtime revokes cached role',async()=>{const p=await setup('/admin/page-builder');await resolve(p);await p.getByRole('heading',{name:'Page Builder fixture',exact:true}).waitFor();await p.evaluate(()=>window.realtimeAuth());await p.waitForFunction(()=>window.pendingAuth().length>=2);assert.equal(await p.evaluate(()=>window.auth.isAdmin),false);await resolve(p,'teacher');await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.evaluate(()=>window.auth.role),'teacher');await p.close();});
 await run('anonymous editor redirects without querying permissions',async()=>{const p=await setup('/admin/page-builder',360,'anonymous');await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.getByRole('heading',{name:'Page Builder fixture',exact:true}).count(),0);assert.equal(new URL(p.url()).pathname,'/admin');assert.equal(new URL(p.url()).searchParams.get('redirect'),'/admin/page-builder');assert.deepEqual(await p.evaluate(()=>window.pendingAuth()),[]);await p.close();});
 await run('session error retry',async()=>{const p=await setup('/admin/page-builder',360,'error');await p.getByRole('button',{name:'ลองใหม่',exact:true}).waitFor();assert.equal(await p.evaluate(()=>window.auth.isAdmin),false);await p.evaluate(()=>{window.sessionMode=null;});await p.getByRole('button',{name:'ลองใหม่',exact:true}).press('Enter');await p.waitForFunction(()=>window.pendingAuth().length>=2);await resolve(p);await p.getByRole('heading',{name:'Page Builder fixture',exact:true}).waitFor();await p.close();});
 await run('late initial session cannot replace auth event',async()=>{const p=await setup('/admin/page-builder',360,'deferred');await p.evaluate(()=>window.emitAuth('B'));await p.waitForFunction(()=>window.pendingAuth().some(x=>x.id==='B'));await resolve(p,'teacher',[],null,'B');await p.evaluate(()=>window.resolveSession('A'));await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.evaluate(()=>window.auth.user.id),'B');assert.equal(await p.evaluate(()=>window.auth.role),'teacher');await p.close();});
 await run('absent menu row is empty permissions not admin',async()=>{const p=await setup('/admin/page-builder');await p.evaluate(()=>{window.resolveAuth('user_roles',{role:'teacher',staff_id:null,administrator_id:null});window.resolveAuth('user_menu_permissions',null);});await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.evaluate(()=>window.auth.role),'teacher');assert.deepEqual(await p.evaluate(()=>window.auth.allowedMenus),[]);assert.equal(await p.evaluate(()=>window.auth.authError),null);await p.close();});
 await run('same-user token refresh revalidates permissions',async()=>{const p=await setup('/admin/page-builder');await resolve(p);await p.getByRole('heading',{name:'Page Builder fixture',exact:true}).waitFor();await p.evaluate(()=>window.emitAuth('A','TOKEN_REFRESHED'));await p.waitForFunction(()=>window.pendingAuth().length>=2);assert.equal(await p.evaluate(()=>window.auth.isAdmin),false);await resolve(p,'teacher');await p.waitForFunction(()=>!window.auth.loading);assert.equal(await p.evaluate(()=>window.auth.role),'teacher');await p.close();});
 for(const width of [360,1280])await run('full app anonymous editor '+width,async()=>{
   const p=await browser.newPage({viewport:{width,height:width===360?800:720}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   // Query string bypasses the isolated harness middleware: real main.tsx/App.
   await p.goto('http://127.0.0.1:4188/admin/page-builder?app-smoke=1');
   await p.waitForURL(u=>u.pathname==='/admin');
   await p.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).waitFor();
   assert.equal(new URL(p.url()).searchParams.get('redirect'),'/admin/page-builder?app-smoke=1');
   assert.deepEqual(errors,[],'Provider nesting must work in real App');
   await p.screenshot({path:'output/auth-readiness/app-anonymous-'+width+'.png'});await p.close();
 });
 assert.deepEqual(failures,[]);
}finally{await browser?.close();await server.close();}
