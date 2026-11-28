// Independently generated Standard-style audio; licensing in sounds/standard-style/CREDITS.md.
(()=>{
 let enabled=true,context,ready;
 try{enabled=localStorage.getItem('caBoardSound')!=='false'}catch(_){}
 const names=['move','capture'],buffers={};
 const downloads=names.map(n=>fetch(new URL('sounds/standard-style/'+n+'.mp3',document.baseURI)).then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer()}).catch(()=>null));
 function unlock(){if(!enabled)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context??=new Audio();if(context.state==='suspended')context.resume().catch(()=>{});ready??=Promise.all(downloads.map(async(p,i)=>{try{const bytes=await p;if(bytes)buffers[names[i]]=await context.decodeAudioData(bytes)}catch(_){}}));}catch(_){}}
 document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});
 const buttons=[...document.querySelectorAll('[data-board-sound]')];
 function update(){buttons.forEach(b=>{b.textContent=enabled?'Sound: on':'Sound: off';b.setAttribute('aria-pressed',String(enabled))})}
 function play(name){if(!enabled||!context||context.state!=='running'||!buffers[name])return;const s=context.createBufferSource(),gain=context.createGain();s.buffer=buffers[name];gain.gain.value=.7;s.connect(gain).connect(context.destination);s.start()}
 window.boardSound=move=>{if(!enabled)return;unlock();const name=move?.captured?'capture':'move';if(buffers[name]&&context?.state==='running')play(name);else if(ready){const t=performance.now();ready.then(()=>{if(performance.now()-t<350)play(name)})}};
 buttons.forEach(b=>b.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('caBoardSound',String(enabled))}catch(_){}update();if(enabled)window.boardSound({})}));update();
})();
