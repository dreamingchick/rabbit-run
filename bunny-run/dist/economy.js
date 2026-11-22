/* Local economy; commits balance and stock together before exposing a change. */
(function(root){
 'use strict';
 const KEY='bunny-run-economy-v1',PRICE=1000,LIMIT=99,DURATION=10,BOOST=1.25;
 const valid=k=>k==='speed'||k==='jump';
 const integer=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 function createStore(storage){
  let value={coins:0,speed:0,jump:0,lastRun:null};
  function load(){try{const raw=storage.getItem(KEY);if(raw===null)value={coins:0,speed:0,jump:0,lastRun:null};if(raw!==null){const v=JSON.parse(raw);if(!v||!integer(v.coins)||!integer(v.speed,LIMIT)||!integer(v.jump,LIMIT)||!(v.lastRun===null||typeof v.lastRun==='string'))throw Error('invalid save');value={coins:v.coins,speed:v.speed,jump:v.jump,lastRun:v.lastRun};}return true;}catch{return false;}}
  const snapshot=()=>({...value});
  load();
  const fail=message=>({ok:false,message,snapshot:snapshot()});
  function commit(next,extra={}){try{storage.setItem(KEY,JSON.stringify(next));value=next;return {ok:true,...extra,snapshot:snapshot()};}catch{return fail('저장 공간을 사용할 수 없어요. 브라우저의 사이트 데이터 설정을 확인해주세요.');}}
  function reward(runId,distance,carrots){
   if(typeof runId!=='string'||!runId||!Number.isFinite(distance)||distance<0||!integer(carrots))return fail('기록을 확인할 수 없어요.');
   if(!load())return fail('저장된 코인 정보를 읽을 수 없어요.');
   const earned=Math.floor(Math.floor(distance)/3)+carrots;
   if(!Number.isSafeInteger(earned))return fail('기록을 확인할 수 없어요.');
   if(value.lastRun===runId)return {ok:true,earned:0,duplicate:true,snapshot:snapshot()};
   return commit({...value,coins:Math.min(Number.MAX_SAFE_INTEGER,value.coins+earned),lastRun:runId},{earned});
  }
  function buy(kind,quantity=1){
   if(!valid(kind)||!Number.isInteger(quantity)||quantity<1||quantity>LIMIT)return fail('구매 수량은 1~99개로 입력해주세요.');
   if(!load())return fail('저장된 코인 정보를 읽을 수 없어요.');
   if(value[kind]+quantity>LIMIT)return fail('이 물약은 최대 99개까지 보유할 수 있어요.');
   if(value.coins<PRICE*quantity)return fail('코인이 부족해요. 달리기로 코인을 모아보세요.');
   return commit({...value,coins:value.coins-PRICE*quantity,[kind]:value[kind]+quantity});
  }
  function use(kind){
   if(!valid(kind))return fail('물약을 확인할 수 없어요.');
   if(!load())return fail('저장된 물약 정보를 읽을 수 없어요.');
   if(value[kind]<1)return fail('보유한 물약이 없어요. 상점에서 구매해주세요.');
   return commit({...value,[kind]:value[kind]-1});
  }
  return {snapshot,refresh(){load();return snapshot()},reward,buy,use};
 }
 function createBuffs(){
  const remaining={speed:0,jump:0};
  return {remaining,reset(){remaining.speed=remaining.jump=0;},activate(kind){if(!valid(kind)||remaining[kind]>0)return false;remaining[kind]=DURATION;return true;},tick(dt){if(!Number.isFinite(dt)||dt<=0)return;for(const kind of ['speed','jump'])remaining[kind]=Math.max(0,remaining[kind]-dt);},speedFactor(){return remaining.speed>0?BOOST:1;},jumpImpulse(){return 640*Math.sqrt(remaining.jump>0?BOOST:1);}};
 }
 const api={KEY,PRICE,LIMIT,DURATION,BOOST,createStore,createBuffs};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BunnyEconomy=api;
})(globalThis);
