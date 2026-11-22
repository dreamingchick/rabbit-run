const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map(),events={};
class Button{};
const draws=[];
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),drawImage:(...args)=>draws.push(args)},{get:(o,k)=>o[k]||(()=>{})});
const element=s=>{if(!elements.has(s))elements.set(s,{hidden:false,textContent:'',innerHTML:'',getContext:()=>ctx,setAttribute(){},addEventListener(k,f){this[k]=f}});return elements.get(s)};
class SpriteImage{complete=true;naturalWidth=1536;naturalHeight=1024;addEventListener(){}}
const sandbox={console,Math,Image:SpriteImage,HTMLButtonElement:Button,innerWidth:1280,innerHeight:800,devicePixelRatio:1,performance:{now:()=>0},localStorage:{getItem:()=>0,setItem(){}},requestAnimationFrame(){},addEventListener:(k,f)=>events[k]=f,document:{querySelector:element,activeElement:{blur(){}},addEventListener(){}},window:{}};
vm.runInNewContext(fs.readFileSync('bunny-run/dist/bunny-sprites.js','utf8'),sandbox);
let src=fs.readFileSync('bunny-run/dist/game.js','utf8').replace('requestAnimationFrame(frame);\n})();','globalThis.test={start,jump,pause,step,frame,get time(){return time},get landing(){return landing},get status(){return state},get y(){return y},get distance(){return distance},get carrots(){return carrots},get items(){return items}};\n})();');
vm.runInNewContext(src,sandbox);const g=sandbox.test;
g.frame(16);g.start();assert.equal(g.status,'running');g.jump();g.step(.1);assert(g.y>0,'jump rises');g.pause();assert.equal(g.status,'paused');const d=g.distance;g.step(.2);assert.equal(g.distance,d,'pause freezes game');g.pause();for(let i=0;i<80&&g.status==='running';i++)g.step(1/120);assert.equal(g.y,0,'jump lands');
g.items.push({x:244,w:16,h:24,kind:'carrot',lift:35});g.step(.001);assert.equal(g.carrots,1,'collect carrot');
g.items.push({x:240,w:40,h:40,kind:'rock'});g.step(.001);assert.equal(g.status,'over','collision ends run');g.start();assert.equal(g.distance,0);assert.equal(g.carrots,0);assert.equal(g.items.length,0);g.frame(32);
console.log('PASS: rendering calls, start, jump, landing, pause/resume, carrot collection, collision, restart');
const sprite=sandbox.window.BunnySprites;
const pose=(patch={})=>sprite.select({state:'running',time:0,y:0,vy:0,...patch});
assert.equal(pose({state:'ready'}),8);assert.equal(pose({state:'ready',time:4.5}),9);
assert.equal(pose({y:10,vy:640,takeoff:.1}),4);assert.equal(pose({y:100,vy:200}),5);assert.equal(pose({y:100,vy:-200}),6);assert.equal(pose({landing:.1}),7);assert.equal(pose({state:'over'}),11);
assert.equal(new Set(Array.from({length:60},(_,i)=>pose({time:i/60}))).size,4);
g.jump();g.step(.2);g.pause();const frozen=g.time;g.step(.5);assert.equal(g.time,frozen,'paused animation does not advance');g.pause();
for(let i=0;i<60;i++)g.step(1/120);assert(g.landing>0,'landing pose is triggered');
assert(draws.length>0,'sprites actually drawn');
for(const [x,y,w,h] of sprite.frames){assert(x>=0&&y>=0&&x+w<=1536&&y+h<=1024,'valid atlas bounds');}
assert.equal(draws[0][1],72,'idle sprite drawn from A atlas');
console.log('PASS: A atlas drawing, all 4 run poses, takeoff/apex/descent/landing, blink, collision, animation pause, source bounds');
