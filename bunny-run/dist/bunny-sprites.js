/* A rabbit: source rectangles retain the generated PNG's real alpha channel. */
(()=>{
 'use strict';
 const atlas=new Image();
 const frames=[
  [68,36,268,268],[412,24,306,278],[800,20,302,230],[1200,76,284,228],
  [54,371,268,280],[452,361,254,222],[836,369,248,226],[1206,415,264,218],
  [72,703,246,290],[450,703,244,290],[828,703,234,290],[1172,713,314,280]
 ];
 const runFrames=[0,1,2,2,3,0];
 function select({state,time,y,vy,landing=0,takeoff=0,celebrate=0}){
  if(state==='over')return 11;
  if(y>0){if(takeoff>0)return 4;if(vy>90)return 5;if(vy< -90)return 6;return 5;}
  if(landing>0)return 7;
  if(state==='ready')return time%4.6>4.4?9:8;
  return runFrames[Math.floor(time*13)%runFrames.length];
 }
 function draw(ctx,x,bottom,scale,motion){
  if(!atlas.complete||!atlas.naturalWidth)return;
  const index=select(motion),[sx,sy,sw,sh]=frames[index];
  const unit=.35*scale,air=index===2?9*scale:0;
  let squash=1,stretch=1;
  if(index===8||index===9){stretch=1+Math.sin(motion.time*3)*.012;}
  if(motion.landing>0){const amount=Math.sin((1-motion.landing/.16)*Math.PI);squash=1+amount*.075;stretch=1-amount*.08;}
  ctx.save();ctx.translate(x+5*scale,bottom-air);ctx.scale(squash,stretch);
  ctx.drawImage(atlas,sx,sy,sw,sh,-sw*unit/2,-sh*unit,sw*unit,sh*unit);
  ctx.restore();
  if(motion.celebrate>0&&motion.state==='running'){
   ctx.save();ctx.globalAlpha=Math.min(1,motion.celebrate*3);ctx.fillStyle='#fff6bc';
   for(let i=0;i<3;i++){const px=x+(i-1)*25,py=bottom-110-(.6-motion.celebrate)*45-i%2*12;ctx.beginPath();ctx.moveTo(px,py-5);ctx.lineTo(px+3,py);ctx.lineTo(px,py+5);ctx.lineTo(px-3,py);ctx.fill();}ctx.restore();
  }
 }
 window.BunnySprites={atlas,frames,select,draw};
 atlas.src='assets/bunny-a-atlas.png';
})();
