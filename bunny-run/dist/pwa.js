(()=>{
 'use strict';
 const install=document.querySelector('#install'),help=document.querySelector('#installHelp');
 const instructions=document.querySelector('#installInstructions'),status=document.querySelector('#pwaStatus');
 const updateBar=document.querySelector('#updateBar'),update=document.querySelector('#updateApp');
 let deferred=null,registration=null,offlineReady=false,reloadForUpdate=false;
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const syncInstall=()=>{install.hidden=standalone();};
 function announce(message){document.querySelector('#announcement').textContent=message;}
 function showStatus(){status.hidden=false;status.textContent=offlineReady?(navigator.onLine?'오프라인 플레이 준비 완료':'오프라인으로 플레이 중'):(navigator.onLine?'오프라인 플레이 준비 중…':'첫 실행에는 인터넷 연결이 필요해요');document.querySelector('#offlineInfo').textContent=offlineReady?'게임 저장이 완료됐어요. 이제 인터넷 없이도 플레이할 수 있어요.':'첫 실행 시 게임 저장이 완료되면 인터넷 없이도 즐길 수 있어요.';}
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;syncInstall();});
 window.addEventListener('appinstalled',()=>{deferred=null;install.hidden=true;announce('버니 런이 설치되었어요.');});
 window.addEventListener('online',showStatus);window.addEventListener('offline',showStatus);
 window.matchMedia('(display-mode: standalone)').addEventListener?.('change',syncInstall);
 install.addEventListener('click',async()=>{
  document.activeElement?.blur();window.dispatchEvent(new Event('bunny:pause'));
  if(deferred){const prompt=deferred;deferred=null;try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')install.hidden=true;}catch{showHelp();}return;}
  showHelp();
 });
 function showHelp(){
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  instructions.textContent=ios?'Safari에서 이 링크를 열고, 공유 메뉴에서 “홈 화면에 추가”를 선택해주세요.':'Chrome 또는 Edge에서 이 링크를 열고, 주소창의 설치 아이콘이나 브라우저 메뉴의 “앱 설치” 또는 “홈 화면에 추가”를 선택해주세요. 다른 앱 안에서 열었다면 먼저 기본 브라우저로 열어주세요.';
  help.showModal();
 }
 document.querySelector('#closeInstall').addEventListener('click',()=>help.close());
 function offerUpdate(){if(registration?.waiting){updateBar.hidden=false;announce('새 버전이 준비됐어요. 업데이트 버튼으로 적용할 수 있어요.');}}
 update.addEventListener('click',()=>{if(!registration?.waiting)return;document.activeElement?.blur();window.dispatchEvent(new Event('bunny:pause'));reloadForUpdate=true;registration.waiting.postMessage({type:'SKIP_WAITING'});});
 syncInstall();
 if('serviceWorker' in navigator&&window.isSecureContext){
  showStatus();
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadForUpdate)location.reload();else{offlineReady=true;showStatus();}});
  window.addEventListener('load',async()=>{
   try{
    registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    offerUpdate();
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offerUpdate();});});
    navigator.serviceWorker.ready.then(()=>{offlineReady=true;showStatus();});
    registration.update().catch(()=>{});
   }catch{status.textContent='오프라인 저장을 완료하지 못했어요. 연결 후 다시 열어주세요.';}
  });
 }
})();
