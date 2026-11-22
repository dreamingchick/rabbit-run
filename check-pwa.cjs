const fs=require('fs'),vm=require('vm'),assert=require('assert');
const base='bunny-run/dist/',origin='https://rabbit.example/',handlers={},stores=new Map();
let online=true,skip=false,claimed=false;
const cacheAPI={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {put:async(k,v)=>m.set(k,v),match:async k=>m.get(k)}},keys:async()=>[...stores.keys()],delete:async k=>stores.delete(k)};
const sandbox={URL,Request,console,caches:cacheAPI,fetch:async request=>{if(!online)throw Error('offline');const u=new URL(typeof request==='string'?request:request.url);const relative=u.pathname==='/'?'index.html':u.pathname.slice(1);assert(fs.existsSync(base+relative),'missing cached asset '+relative);return {ok:true,redirected:false,asset:relative};},self:{registration:{scope:origin},location:{origin:origin.slice(0,-1)},clients:{claim:async()=>{claimed=true}},skipWaiting:()=>{skip=true},addEventListener:(k,f)=>handlers[k]=f}};
vm.runInNewContext(fs.readFileSync(base+'sw.js','utf8'),sandbox);
async function lifecycle(type){let result;handlers[type]({waitUntil:p=>result=p});await result;}
async function fetchFromWorker(url,mode='cors',method='GET'){let result;handlers.fetch({request:{url,mode,method},respondWith:p=>result=p});return result&&await result;}
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(base+'manifest.webmanifest'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.id,'./');
 for(const icon of manifest.icons){const buf=fs.readFileSync(base+icon.src);const size=icon.sizes.split('x').map(Number);assert.equal(buf.readUInt32BE(16),size[0]);assert.equal(buf.readUInt32BE(20),size[1]);}
 await lifecycle('install');assert(!skip,'updates must await player acceptance');
 stores.set('bunny-run-old',new Map());stores.set('another-app',new Map());await lifecycle('activate');assert(claimed);assert(!stores.has('bunny-run-old'));assert(stores.has('another-app'));
 online=false;
 assert.equal((await fetchFromWorker(origin+'?from=homescreen','navigate')).asset,'index.html');
 for(const asset of ['game.js','economy.js','shop.js','terrain.js','bunny-sprites.js','style.css','pwa.js','manifest.webmanifest','assets/bunny-a-atlas.png','assets/icons/icon-512.png'])assert.equal((await fetchFromWorker(origin+asset)).asset,asset);
 assert.equal((await fetchFromWorker(origin+'assets/bunny-a-atlas.png?retry=123')).asset,'assets/bunny-a-atlas.png');
 assert.equal(await fetchFromWorker('https://elsewhere.example/style.css'),undefined);assert.equal(await fetchFromWorker(origin+'api','cors','POST'),undefined);assert.equal(await fetchFromWorker(origin+'unknown'),undefined);
 handlers.message({data:{type:'SKIP_WAITING'}});assert(skip);
 // A new install must reject authentication redirects and cannot activate offline.
 sandbox.fetch=async()=>({ok:true,redirected:true});await assert.rejects(lifecycle('install'),/Cannot cache/);
 console.log('PASS: manifest, PNG dimensions, all shell files, offline navigation/game/sprites/icons, retry URLs, cache isolation, controlled update, redirect rejection');
 const html=fs.readFileSync(base+'index.html','utf8');assert(html.includes('rel="manifest"'));assert(html.includes('apple-touch-icon'));assert(!fs.readFileSync(base+'style.css','utf8').includes('@import'));
 // Run install UI in an unsupported browser and confirm manual iPhone guidance.
 const elements=new Map();const el=s=>{if(!elements.has(s))elements.set(s,{hidden:false,listeners:{},addEventListener(k,f){this.listeners[k]=f},showModal(){this.open=true},close(){this.open=false}});return elements.get(s)};
 const uiEvents={},uiWindow={matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener:(k,f)=>uiEvents[k]=f,dispatchEvent(){},isSecureContext:true};
 const ui={console,Event,window:uiWindow,navigator:{userAgent:'iPhone',platform:'iPhone',maxTouchPoints:1,onLine:true},document:{querySelector:el,activeElement:{blur(){}}},location:{reload(){}}};
 vm.runInNewContext(fs.readFileSync(base+'pwa.js','utf8'),ui);
 await el('#install').listeners.click();assert(el('#installHelp').open);assert(el('#installInstructions').textContent.includes('Safari'));
 let prompted=false;uiEvents.beforeinstallprompt({preventDefault(){},prompt:async()=>{prompted=true},userChoice:Promise.resolve({outcome:'accepted'})});await el('#install').listeners.click();assert(prompted);assert(el('#install').hidden);
 uiEvents.appinstalled();assert(el('#install').hidden);
 console.log('PASS: fallback install guidance, native install prompt, installed button state');
})().catch(error=>{console.error(error);process.exitCode=1});
