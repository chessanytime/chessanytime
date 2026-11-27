// Real chess-piece recording (CC0); see sounds/CREDITS.md.
(()=>{
 let enabled=true,context,buffer;
 try{enabled=localStorage.getItem('caBoardSound')!=='false'}catch(_){}
 const asset=new URL('sounds/chess-move.mp3',document.baseURI).href;
 const bytes=fetch(asset).then(r=>{if(!r.ok)throw Error('Sound unavailable');return r.arrayBuffer()}).catch(()=>null);
 let decoding;
 function unlock(){
  if(!enabled)return;
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
   context??=new Audio();
   if(context.state==='suspended')context.resume().catch(()=>{});
   decoding??=bytes.then(data=>data?context.decodeAudioData(data):null).then(b=>{buffer=b;return b}).catch(()=>null);
  }catch(_){}
 }
 document.addEventListener('pointerdown',unlock,{capture:true});
 document.addEventListener('keydown',unlock,{capture:true});
 const buttons=[...document.querySelectorAll('[data-board-sound]')];
 function update(){buttons.forEach(b=>{b.textContent=enabled?'Sound: on':'Sound: off';b.setAttribute('aria-pressed',String(enabled))})}
 function playBuffer(move){
  if(!enabled||!context||context.state!=='running'||!buffer)return;
  const t=context.currentTime;
  function tap(at,volume,rate){
   const source=context.createBufferSource(),gain=context.createGain();
   source.buffer=buffer;source.playbackRate.value=rate;gain.gain.value=volume;
   source.connect(gain).connect(context.destination);source.start(at);
  }
  // Standard-style: checks use normal move or capture sound, not a beep.
  if(move?.captured){tap(t,.32,1.08);tap(t+.075,.56,.96)}
  else tap(t,.62,1);
 }
 window.boardSound=move=>{
  if(!enabled)return;unlock();
  if(buffer&&context?.state==='running')playBuffer(move);
  else if(decoding){const requested=performance.now();decoding.then(()=>{if(performance.now()-requested<350)playBuffer(move)})}
 };
 buttons.forEach(b=>b.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('caBoardSound',String(enabled))}catch(_){}update();if(enabled)window.boardSound({})}));
 update();
})();
