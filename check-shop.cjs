const fs=require('fs'),vm=require('vm'),assert=require('assert');
const E=require('./bunny-run/dist/economy.js'),T=require('./bunny-run/dist/terrain.js');
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
let store=E.createStore(storage);
assert.deepEqual(store.snapshot().levels,{speed:0,jump:0});assert(!store.upgrade('speed').ok);assert(!store.select('jump',3).ok);
assert.equal(store.reward('first',100.9,7).earned,40);assert.equal(store.reward('first',100.9,7).earned,0);assert.equal(store.snapshot().coins,40);
assert.equal(store.reward('second',2.9,2).earned,2);assert(!store.reward('bad',-1,0).ok);
store.reward('funding',300000,0);const funded=store.snapshot().coins;
const costs=[1000,2000,4000,8000,16000];assert.deepEqual(costs.map((_,i)=>E.cost(i)),costs);
for(const kind of ['speed','jump'])for(let level=1;level<=5;level++){const result=store.upgrade(kind);assert(result.ok);assert.equal(result.price,costs[level-1]);assert.equal(result.level,level);assert.equal(store.snapshot().selected[kind],level);}
assert.equal(store.snapshot().coins,funded-62000);assert(!store.upgrade('jump').ok);assert.equal(E.cost(5),null);assert(!store.select('jump',6).ok);assert(!store.select('jump',1.5).ok);
assert(store.select('speed',1).ok);assert(store.select('jump',3).ok);const loaded=E.createStore(storage);assert.deepEqual(loaded.snapshot().selected,{speed:1,jump:3});assert.deepEqual(loaded.snapshot().levels,{speed:5,jump:5});
const copy=loaded.snapshot();copy.levels.speed=0;assert.equal(loaded.snapshot().levels.speed,5);
for(let n=0;n<=5;n++){const effect=E.effects({speed:n,jump:n});assert.equal(effect.speedFactor,1+n*.1);assert(Math.abs((effect.jumpImpulse/640)**2-(1+n*.1))<1e-12);}
const legacyData=new Map([[E.LEGACY,JSON.stringify({coins:125,speed:2,jump:3,lastRun:'old'})]]),legacy={getItem:k=>legacyData.get(k)??null,setItem:(k,v)=>legacyData.set(k,v)};
const migrated=E.createStore(legacy);assert.equal(migrated.snapshot().coins,5125);assert.equal(migrated.snapshot().migrationRefund,5000);assert.equal(E.createStore(legacy).snapshot().coins,5125);assert.deepEqual(migrated.snapshot().levels,{speed:0,jump:0});assert.equal(migrated.reward('old',100,1).earned,0);
const failureData=new Map([[E.KEY,JSON.stringify({coins:10000,levels:{speed:0,jump:0},selected:{speed:0,jump:0},lastRun:null,migrationRefund:0})]]);
const failing=E.createStore({getItem:k=>failureData.get(k)??null,setItem(){throw Error('quota')}});const unchanged=failing.snapshot();assert(!failing.upgrade('speed').ok);assert.deepEqual(failing.snapshot(),unchanged);assert(!failing.select('jump',0).ok);assert.deepEqual(failing.snapshot(),unchanged);
console.log('PASS: doubled costs, permanent 5-level cap, selected vs unlocked levels, 10% linear effects, coin receipts, reload, one-time potion refund, failed-save atomicity');
for(const fps of [30,60,120])for(let level=0;level<=5;level++){
 const platform={x:0,w:2000,h:T.HIGH_PATH},impulse=E.effects({speed:0,jump:level}).jumpImpulse;let body={y:0,vy:impulse,support:null},landed=false,max=0;
 for(let n=0;n<fps*2;n++){body=T.advance(body,1/fps,[platform],100);max=Math.max(max,body.y);if(body.support){landed=true;break;}if(body.y===0)break;}
 assert.equal(landed,level>=3,'jump '+level+' at '+fps+' fps');if(level<3)assert(max<T.HIGH_PATH);
}
const ledge={x:0,w:300,h:150};let body={y:150,vy:0,support:ledge};assert.equal(T.advance(body,1/60,[ledge],100).y,150);ledge.x=-500;body=T.advance(body,1/60,[ledge],100);assert(body.y<150&&!body.support);for(let n=0;n<100;n++)body=T.advance(body,1/60,[],100);assert.equal(body.y,0);
console.log('PASS: high path unreachable at Lv.0-2, reachable at Lv.3-5 at 30/60/120fps; standing, walking off, safe landing');
let harness=fs.readFileSync('check-game.cjs','utf8');
harness=harness.replace('get time(){return time}','get traits(){return runTraits},get zones(){return zones},get standing(){return standingOn},get speed(){return speed},get vy(){return vy},end,setRecord(d,c){distance=d;carrots=c},get time(){return time}');
harness+=`
const wallet=sandbox.window.BunnyEconomy.createStore(sandbox.localStorage);wallet.reward('fund',300000,0);wallet.upgrade('speed');wallet.upgrade('speed');wallet.upgrade('jump');wallet.upgrade('jump');wallet.upgrade('jump');wallet.select('speed',1);wallet.select('jump',3);events.storage?.({key:sandbox.window.BunnyEconomy.KEY});g.start();assert.equal(g.traits.speed,1);assert.equal(g.traits.jump,3);g.step(.01);assert.equal(g.speed,330);g.jump();assert(g.vy>729);wallet.select('speed',0);assert.equal(g.traits.speed,1,'active run is frozen');g.pause();assert(elements.get('#select-speed').disabled);const frozenHeight=g.y;g.step(5);assert.equal(g.y,frozenHeight);g.pause();g.setRecord(101,5);const before=wallet.refresh().coins;g.end();assert.equal(wallet.refresh().coins,before+38);g.end();assert.equal(wallet.refresh().coins,before+38);g.start();assert.equal(g.traits.speed,0);assert.equal(g.traits.jump,3);
const platform={x:0,w:3000,h:150};g.zones.push(platform);g.jump();for(let n=0;n<65;n++)g.step(1/120);assert.equal(g.standing,platform);assert.equal(g.y,150);g.items.push({x:1280*.19+3,w:16,h:24,kind:'carrot',lift:185,minHeight:150});g.step(1/120);assert.equal(g.carrots,1);g.frame(1000);g.jump();assert.equal(g.standing,null);const firstImpulse=g.vy;g.jump();assert.equal(g.vy,firstImpulse,'no double jump');g.end();wallet.select('jump',2);g.start();g.zones.push({x:0,w:3000,h:150});g.jump();let maxHeight=0;for(let n=0;n<100;n++){g.step(1/120);maxHeight=Math.max(maxHeight,g.y);assert(!g.standing);}assert(maxHeight<150);assert.equal(g.y,0);assert.equal(g.status,'running','lower path remains safe');g.end();g.start();g.setRecord(80,0);g.step(.01);assert.equal(g.zones.length,1);assert(g.items.filter(o=>o.minHeight===150).length>=15);console.log('PASS: real game trait snapshot, selected speed, jump impulse, pause/coins, platform landing/running/jumping, high carrot pickup, safe lower path and zone generation');
`;
vm.runInNewContext(harness,{require,console},{filename:'trait-integration-test.cjs'});
