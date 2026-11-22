(()=>{
 'use strict';
 const E=window.BunnyEconomy,$=s=>document.querySelector(s);
 let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('unavailable')},setItem(){throw Error('unavailable')}};}
 const store=E.createStore(storage),dialog=$('#shopDialog');
 let motion={state:'ready',speedTime:0,jumpTime:0};
 const text=(el,value)=>{if(el.textContent!==String(value))el.textContent=String(value)};
 const announce=message=>text($('#announcement'),message);
 const status=message=>{text($('#shopFeedback'),message);announce(message)};
 const name=kind=>kind==='speed'?'이동속도 물약':'점프 물약';
 function render(){
  const inventory=store.snapshot();
  for(const selector of ['#menuCoins','#shopCoins'])text($(selector),inventory.coins.toLocaleString('ko-KR'));
  for(const kind of ['speed','jump']){
   const qty=$('#qty-'+kind),buy=$('#buy-'+kind),count=Number(qty.value),valid=Number.isInteger(count)&&count>=1&&count<=99;
   text($('#owned-'+kind),inventory[kind]);
   const full=inventory[kind]>=99,overflow=valid&&inventory[kind]+count>99,lacking=valid&&inventory.coins<count*E.PRICE;
   buy.disabled=full||!valid||overflow||lacking;
   text(buy,full?'최대 수량 보유':!valid?'수량 확인':overflow?'최대 99개 보유':lacking?'코인 부족':(count*E.PRICE).toLocaleString('ko-KR')+' 코인 · 구매');
   buy.setAttribute('aria-label',name(kind)+' '+(valid?count:0)+'개 구매');
  }
  update(motion);
 }
 function update(next){
  motion=next;$('#potionBar').hidden=motion.state!=='running'&&motion.state!=='paused';
  const inventory=store.snapshot();
  for(const kind of ['speed','jump']){
   const remaining=motion[kind+'Time']||0,button=$('#use-'+kind);
   text($('#stock-'+kind),inventory[kind]);
   text($('#timer-'+kind),remaining>0?Math.ceil(remaining)+'초':(kind==='speed'?'속도 +25%':'높이 +25%'));
   button.disabled=motion.state!=='running'||remaining>0||inventory[kind]===0;
   button.classList.toggle('active',remaining>0);
   button.setAttribute('aria-label',name(kind)+', '+inventory[kind]+'개 보유'+(remaining>0?', '+Math.ceil(remaining)+'초 남음':', 사용'));
  }
 }
 $('#openShop').addEventListener('click',()=>{document.activeElement?.blur();window.dispatchEvent(new Event('bunny:pause'));store.refresh();render();status('각 1,000코인 · 종류별 최대 99개 · 달리는 중 사용');dialog.showModal();});
 $('#closeShop').addEventListener('click',()=>dialog.close());
 for(const kind of ['speed','jump']){
  $('#qty-'+kind).addEventListener('input',render);
  $('#buy-'+kind).addEventListener('click',()=>{const count=Number($('#qty-'+kind).value),result=store.buy(kind,count);render();status(result.ok?name(kind)+' '+count+'개를 구매했어요.':result.message);});
  $('#use-'+kind).addEventListener('click',()=>{document.activeElement?.blur();window.dispatchEvent(new CustomEvent('bunny:use-potion',{detail:kind}));});
 }
 window.addEventListener('storage',event=>{if(event.key===E.KEY||event.key===null){store.refresh();render();}});
 window.BunnyShop={update,consume(kind){const result=store.use(kind);render();if(!result.ok)announce(result.message);return result.ok;},reward(runId,distance,carrots){const result=store.reward(runId,distance,carrots);render();return result;}};
 render();
})();
