(function(root){
 'use strict';
 const KEY='bunny-run-traits-v2',LEGACY='bunny-run-economy-v1',MAX_LEVEL=5;
 const valid=k=>k==='speed'||k==='jump';
 const int=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 const empty=()=>({coins:0,levels:{speed:0,jump:0},selected:{speed:0,jump:0},lastRun:null,migrationRefund:0});
 const cost=level=>int(level,4)?1000*2**level:null;
 function effects(selected){return {speedFactor:1+selected.speed*.1,jumpImpulse:640*Math.sqrt(1+selected.jump*.1)};}
 function createStore(storage){
  let value=empty();
  const snapshot=()=>({...value,levels:{...value.levels},selected:{...value.selected}});
  function load(){try{
   const raw=storage.getItem(KEY);
   if(raw!==null){const v=JSON.parse(raw);if(!v||!int(v.coins)||!v.levels||!v.selected||!['speed','jump'].every(k=>int(v.levels[k],5)&&int(v.selected[k],v.levels[k]))||!(v.lastRun===null||typeof v.lastRun==='string')||!int(v.migrationRefund??0))throw Error('invalid save');value={coins:v.coins,levels:{...v.levels},selected:{...v.selected},lastRun:v.lastRun,migrationRefund:v.migrationRefund??0};}
   else{
    const old=storage.getItem(LEGACY);const next=empty();
    if(old!==null){const v=JSON.parse(old);if(!v||!int(v.coins)||!int(v.speed,99)||!int(v.jump,99))throw Error('invalid legacy');const refund=(v.speed+v.jump)*1000;next.coins=Math.min(Number.MAX_SAFE_INTEGER,v.coins+refund);next.lastRun=typeof v.lastRun==='string'?v.lastRun:null;next.migrationRefund=refund;storage.setItem(KEY,JSON.stringify(next));}
    value=next;
   }return true;
  }catch{return false;}}
  const fail=message=>({ok:false,message,snapshot:snapshot()});
  function commit(next,extra={}){try{storage.setItem(KEY,JSON.stringify(next));value=next;return {ok:true,...extra,snapshot:snapshot()};}catch{return fail('저장하지 못했어요. 브라우저의 사이트 데이터 설정을 확인해주세요.');}}
  load();
  function reward(runId,distance,carrots){if(typeof runId!=='string'||!runId||!Number.isFinite(distance)||distance<0||!int(carrots))return fail('기록을 확인할 수 없어요.');if(!load())return fail('저장 정보를 읽을 수 없어요.');const earned=Math.floor(distance/3)+carrots;if(!int(earned))return fail('기록을 확인할 수 없어요.');if(value.lastRun===runId)return {ok:true,earned:0,duplicate:true,snapshot:snapshot()};return commit({...value,coins:Math.min(Number.MAX_SAFE_INTEGER,value.coins+earned),lastRun:runId},{earned});}
  function upgrade(kind){if(!valid(kind))return fail('특성을 확인해주세요.');if(!load())return fail('저장 정보를 읽을 수 없어요.');const price=cost(value.levels[kind]);if(price===null)return fail('최고 레벨이에요.');if(value.coins<price)return fail('코인이 부족해요.');const level=value.levels[kind]+1;return commit({...value,coins:value.coins-price,levels:{...value.levels,[kind]:level},selected:{...value.selected,[kind]:level}},{level,price});}
  function select(kind,level){if(!valid(kind)||!int(level,5))return fail('적용 레벨을 확인해주세요.');if(!load())return fail('저장 정보를 읽을 수 없어요.');if(level>value.levels[kind])return fail('먼저 해당 레벨까지 강화해주세요.');return commit({...value,selected:{...value.selected,[kind]:level}});}
  return {snapshot,refresh(){load();return snapshot()},reward,upgrade,select};
 }
 const api={KEY,LEGACY,MAX_LEVEL,cost,effects,createStore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BunnyEconomy=api;
})(globalThis);
