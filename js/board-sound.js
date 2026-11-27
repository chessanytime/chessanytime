// Local, synthesized chess move sounds; no external audio assets.
(()=>{
 let enabled=true,context;
 try{enabled=localStorage.getItem('caBoardSound')!=='false'}catch(_){}
 function unlock(){if(!enabled)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context??=new Audio();if(context.state==='suspended')context.resume().catch(()=>{});}catch(_){}}
 document.addEventListener('pointerdown',unlock,{capture:true});
 document.addEventListener('keydown',unlock,{capture:true});
 const buttons=[...document.querySelectorAll('[data-board-sound]')];
 function update(){buttons.forEach(b=>{b.textContent=enabled?'Sound: on':'Sound: off';b.setAttribute('aria-pressed',String(enabled))})}
 buttons.forEach(b=>b.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('caBoardSound',String(enabled))}catch(_){}update();if(enabled){unlock();window.boardSound({})}}));
 window.boardSound=(move)=>{
  if(!enabled||!context||context.state!=='running')return;
  try{
   const t=context.currentTime, capture=!!move?.captured,check=/[+#]$/.test(move?.san||'');
   const duration=capture?.095:.055, length=Math.ceil(context.sampleRate*duration);
   const buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<length;i++){const x=i/context.sampleRate;data[i]=(Math.random()*2-1)*Math.exp(-x/(capture?.016:.009));}
   const src=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   src.buffer=buffer;filter.type='lowpass';filter.frequency.value=capture?1350:2200;gain.gain.value=.24;
   src.connect(filter).connect(gain).connect(context.destination);src.start(t);
   function knock(at,freq,volume){const osc=context.createOscillator(),amp=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,at);osc.frequency.exponentialRampToValueAtTime(freq*.62,at+.045);amp.gain.setValueAtTime(volume,at);amp.gain.exponentialRampToValueAtTime(.001,at+.065);osc.connect(amp).connect(context.destination);osc.start(at);osc.stop(at+.07);}
   knock(t,capture?165:240,.13);if(check)knock(t+.085,440,.07);
  }catch(_){}
 };
 update();
})();
