(function(root){
 'use strict';
 const GRAVITY=1700,HIGH_PATH=150;
 const overlaps=(x,p)=>x+12>p.x&&x-12<p.x+p.w;
 function advance(body,dt,platforms,x){
  let {y,vy,support}=body;
  if(support&&platforms.includes(support)&&overlaps(x,support)&&vy===0)return {y:support.h,vy:0,support,landed:false};
  support=null;const previous=y;y+=vy*dt-.5*GRAVITY*dt*dt;vy-=GRAVITY*dt;
  if(vy<=0){const tops=platforms.filter(p=>overlaps(x,p)&&previous>=p.h-1e-7&&y<=p.h).sort((a,b)=>b.h-a.h);if(tops.length)return {y:tops[0].h,vy:0,support:tops[0],landed:true};}
  if(y<=0)return {y:0,vy:0,support:null,landed:previous>0};
  return {y,vy,support:null,landed:false};
 }
 const api={GRAVITY,HIGH_PATH,overlaps,advance};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BunnyTerrain=api;
})(globalThis);
