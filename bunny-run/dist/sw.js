'use strict';
const CACHE='bunny-run-v05-dads-arcade-20261123';
const SHELL=['./','./index.html','./style.css','./game.js','./bunny-sprites.js','./pwa.js','./economy.js','./shop.js','./terrain.js','./manifest.webmanifest','./assets/bunny-a-atlas.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/icon-maskable-512.png','./assets/icons/apple-touch-icon.png'];
const assetURLs=new Set(SHELL.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // Reject login/error pages instead of storing a broken offline shell.
  for(const path of SHELL){
   const url=new URL(path,self.registration.scope).href;
   const response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin'}));
   if(!response.ok||response.redirected)throw new Error('Cannot cache '+path);
   await cache.put(url,response);
  }
 })());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('bunny-run-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const plain=new URL(url);plain.search='';plain.hash='';
 if(request.mode==='navigate'){
  if(!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   return await cache.match(new URL('./index.html',self.registration.scope).href)||fetch(request);
  })());return;
 }
 if(assetURLs.has(plain.href))event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  return await cache.match(plain.href)||fetch(request);
 })());
});
