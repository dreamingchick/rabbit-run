(()=>{
 'use strict';
 const E=window.BunnyEconomy,$=s=>document.querySelector(s);
 let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('unavailable')},setItem(){throw Error('unavailable')}};}
 const store=E.createStore(storage),dialog=$('#shopDialog');let state='ready',current={speed:0,jump:0};
 const text=(el,v)=>{if(el.textContent!==String(v))el.textContent=String(v)};
 const status=message=>{text($('#shopFeedback'),message);text($('#announcement'),message)};
 const name=kind=>kind==='speed'?'이동속도':'점프 높이';
 function render(){
  const save=store.snapshot();for(const id of ['#menuCoins','#shopCoins'])text($(id),save.coins.toLocaleString('ko-KR'));
  for(const kind of ['speed','jump']){
   const level=save.levels[kind],price=E.cost(level),button=$('#upgrade-'+kind),select=$('#select-'+kind);
   text($('#level-'+kind),level);text($('#effect-'+kind),'+'+(level*10)+'%');
   button.disabled=price===null||save.coins<price;
   text(button,price===null?'최고 레벨 달성':(level+1)+'레벨 강화 · '+price.toLocaleString('ko-KR')+' 코인');
   text($('#next-'+kind),price===null?'모든 성장을 마쳤어요.':'다음 효과 +'+((level+1)*10)+'%');
   const options=Array.from({length:level+1},(_,n)=>'<option value="'+n+'">Lv.'+n+' · +'+(n*10)+'%</option>').join('');if(select.innerHTML!==options)select.innerHTML=options;select.value=String(save.selected[kind]);
  }
  text($('#migrationNote'),save.migrationRefund?'기존 보유 물약을 '+save.migrationRefund.toLocaleString('ko-KR')+'코인으로 환불했어요.':'특성은 영구 유지되며 코인과 함께 이 브라우저에 저장됩니다.');update({state,traits:current});
 }
 function update(next){state=next.state;current=next.traits||current;const inRun=state==='running'||state==='paused';$('#runTraits').hidden=!inRun;
  for(const kind of ['speed','jump']){$('#select-'+kind).disabled=inRun;text($('#active-'+kind),'Lv.'+current[kind]+' · +'+(current[kind]*10)+'%');}
  text($('#selectionHint'),inRun?'현재 달리기의 레벨은 고정돼요. 변경한 강화는 다음 판부터 적용됩니다.':'구매한 범위에서 적용 레벨을 선택한 뒤 시작하세요.');
 }
 $('#openShop').addEventListener('click',()=>{document.activeElement?.blur();window.dispatchEvent(new Event('bunny:pause'));store.refresh();render();status('최대 5레벨 · 레벨당 10% · 강화 비용은 매번 2배');dialog.showModal();});
 $('#closeShop').addEventListener('click',()=>dialog.close());
 for(const kind of ['speed','jump']){
  $('#upgrade-'+kind).addEventListener('click',()=>{const r=store.upgrade(kind);render();status(r.ok?name(kind)+' '+r.level+'레벨로 강화했어요.':r.message);});
  $('#select-'+kind).addEventListener('change',()=>{if(state==='running'||state==='paused'){render();return;}const r=store.select(kind,Number($('#select-'+kind).value));render();if(!r.ok)status(r.message);});
 }
 window.addEventListener('storage',event=>{if(event.key===E.KEY||event.key===null){store.refresh();render();}});
 window.BunnyShop={update,selected(){store.refresh();render();return {...store.snapshot().selected};},reward(runId,distance,carrots){const r=store.reward(runId,distance,carrots);render();return r;}};render();
})();
