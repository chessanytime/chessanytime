/* Short welcome animation: once per tab, with a skip control and reduced-motion support. */
(function(){
 const intro=document.getElementById('ca-intro');
 if(!intro)return;
 try{if(sessionStorage.getItem('ca-intro-seen')==='1'){intro.remove();return;}}catch(e){}
 const finish=()=>{intro.classList.add('ca-hide');try{sessionStorage.setItem('ca-intro-seen','1')}catch(e){};setTimeout(()=>intro.remove(),500)};
 const skip=document.getElementById('ca-intro-skip');
 if(skip)skip.addEventListener('click',finish);
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 setTimeout(finish,reduced?120:2400);
})();
/* ---- ADD A NEW PUZZLE EACH DAY HERE ----
 date: YYYY-MM-DD · fen: starting position · moves: solution in order (your move, reply, your move...) */
const PUZZLES=[
{date:'2026-11-11',fen:'6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',moves:['a1a8'],rating:600,theme:'Back-rank mate'},
{date:'2026-11-12',fen:'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',moves:['h5f7'],rating:700,theme:'Mate in 1'},
{date:'2026-11-13',fen:'3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',moves:['d1d8'],rating:650,theme:'Back-rank mate'}];
const $=s=>document.querySelector(s),G={w:'♚♛♜♝♞♟'};
const GL={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const pages=['home','blog','post','about','programs','community','puzzles','demo','contact','login','portal'];let me=null,solved={};
function route(){let h=location.hash.slice(1);let slug=null;if(h.startsWith('blog-')){slug=h.slice(5);h='post'}if(!pages.includes(h))h='home';if(h==='login'&&me)h='portal';if(h==='portal'&&!me)h='login';renderMe();if(h==='blog')renderBlog();if(h==='post')renderPost(slug);pages.forEach(p=>$('#'+p).classList.toggle('on',p===h));document.querySelectorAll('nav a.l').forEach(a=>a.classList.toggle('on',a.dataset.p===(h==='post'?'blog':h)));if(h==='puzzles')loadDaily()}
addEventListener('hashchange',route);
let g,cur,idx,sel,last,flip,done,failed,hintSq;let boardMarks=[],activeGesture=null;
const localDate=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const today=()=>{const t=localDate();let l=0;PUZZLES.forEach((p,i)=>{if(p.date<=t)l=i});return l};
function startPuzzle(){g=new Chess(cur.fen);idx=0;sel=null;last=null;done=false;failed=false;hintSq=null;boardMarks=[];activeGesture=null;clearGhost();flip=g.turn()==='b';
$('#st').className='';$('#st').textContent='Your turn';$('#mt').textContent='Find the best move for '+(g.turn()==='w'?'white':'black')+' · Rating '+cur.rating+' · '+cur.theme;draw()}
async function loadDaily(){const info=$('#daily-info'),button=$('#daily-load');if(info)info.textContent='Loading today’s Lichess puzzle…';if(button)button.disabled=true;try{const res=await fetch('https://lichess.org/api/puzzle/daily',{headers:{Accept:'application/json'},cache:'no-store'});if(!res.ok)throw new Error('Lichess returned '+res.status);const data=await res.json(),p=data.puzzle;if(!p||!Array.isArray(p.solution)||!p.solution.length||!data.game||!data.game.pgn||!Number.isInteger(p.initialPly))throw new Error('Lichess returned incomplete puzzle data');const fullGame=new Chess();if(!fullGame.load_pgn(data.game.pgn))throw new Error('Could not read the puzzle game PGN');const history=fullGame.history({verbose:true});if(p.initialPly<0||p.initialPly>=history.length)throw new Error('Invalid puzzle starting ply');const position=new Chess();for(const m of history.slice(0,p.initialPly+1)){if(!position.move({from:m.from,to:m.to,promotion:m.promotion}))throw new Error('Could not reconstruct puzzle position')}for(const uci of p.solution){if(typeof uci!=='string'||uci.length<4||!position.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci.length>4?uci[4]:'q'}))throw new Error('Puzzle solution contains an illegal move')}const puzzlePosition=new Chess();for(const m of history.slice(0,p.initialPly+1)){puzzlePosition.move({from:m.from,to:m.to,promotion:m.promotion})}cur={date:localDate(),fen:puzzlePosition.fen(),moves:p.solution,rating:p.rating||'Daily',theme:(p.themes||[]).slice(0,3).join(', ')||'Lichess Daily',side0:puzzlePosition.turn(),daily:true,id:p.id};startPuzzle();if(info)info.textContent='Today’s puzzle · Rating '+(p.rating||'—')+' · '+((p.themes||[]).slice(0,3).join(', ')||'Daily challenge')}catch(err){console.error('Lichess daily puzzle error:',err);g=null;cur=null;$('#bd').innerHTML='';$('#st').textContent='Daily puzzle unavailable';$('#st').className='no';$('#mt').textContent='Please try again shortly, or open the Lichess Daily Puzzle page.';if(info)info.textContent='Could not load the Lichess Daily Puzzle: '+err.message}finally{if(button)button.disabled=false}}
function draw(){const bd=$('#bd');bd.innerHTML='';const bo=g.board(),targets={};if(sel)g.moves({square:sel,verbose:true}).forEach(m=>{if(!m.captured)targets[m.to]='dot'});
for(let v=0;v<64;v++){let r=Math.floor(v/8),f=v%8;if(flip){r=7-r;f=7-f}const sq='abcdefgh'[f]+(8-r),pc=bo[r][f];
const d=document.createElement('div');d.className='sq '+((r+f)%2?'d':'l');d.dataset.s=sq;
if(last&&(last[0]===sq||last[1]===sq))d.classList.add('last');if(sel===sq)d.classList.add('sel');if(hintSq===sq)d.classList.add('hint');if(targets[sq])d.classList.add(targets[sq]);
if(pc){const s=document.createElement('img');s.className='pc';s.alt='';s.draggable=false;s.src='https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/'+(pc.color==='w'?'w':'b')+pc.type.toUpperCase()+'.svg';d.appendChild(s)}
if(v%8===7){const c=document.createElement('i');c.className='co r';c.textContent=8-r;d.appendChild(c)}
if(v>55){const c=document.createElement('i');c.className='co f';c.textContent='abcdefgh'[f];d.appendChild(c)}
bd.appendChild(d)}
const svgNS='http://www.w3.org/2000/svg',svg=document.createElementNS(svgNS,'svg');svg.setAttribute('class','marks');svg.setAttribute('viewBox','0 0 8 8');svg.innerHTML='<defs><marker id="puzzle-arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L4 2 L0 4 Z" fill="rgba(72,142,55,.9)"/></marker></defs>';
const xy=sq=>{let x='abcdefgh'.indexOf(sq[0]),y=8-Number(sq[1]);if(flip){x=7-x;y=7-y}return [x+.5,y+.5]};
boardMarks.forEach(m=>{const [x1,y1]=xy(m.from),[x2,y2]=xy(m.to);if(m.from===m.to){const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',x1);c.setAttribute('cy',y1);c.setAttribute('r','.43');svg.appendChild(c)}else{const l=document.createElementNS(svgNS,'line');l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);svg.appendChild(l)}});bd.appendChild(svg)}
// Board interactions: click-to-move, drag-and-drop, coloured arrows and square marks.
const puzzleBoard=$('#bd');
let dragGhost=null;
const markColours={g:'rgba(72,142,55,.9)',r:'rgba(205,65,65,.92)',b:'rgba(55,125,220,.92)',y:'rgba(220,165,35,.95)'};
function squareAtPoint(e){
 const r=puzzleBoard.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 if(x<0||y<0||x>=r.width||y>=r.height)return null;
 let file=Math.min(7,Math.floor(x/r.width*8)),rank=Math.min(7,Math.floor(y/r.height*8));
 if(flip){file=7-file;rank=7-rank}
 return 'abcdefgh'[file]+(8-rank);
}
function gestureColour(e){return e.shiftKey?'r':(e.ctrlKey||e.metaKey)?'b':e.altKey?'y':'g'}
function clearGhost(){
 if(dragGhost){dragGhost.remove();dragGhost=null}
 puzzleBoard.querySelectorAll('.drag-source').forEach(x=>x.classList.remove('drag-source'));
}
function moveGhost(e){
 if(!dragGhost)return;
 const r=puzzleBoard.getBoundingClientRect();
 dragGhost.style.left=(e.clientX-r.left)+'px';
 dragGhost.style.top=(e.clientY-r.top)+'px';
}
function paintMarks(){
 const svgNS='http://www.w3.org/2000/svg',svg=document.createElementNS(svgNS,'svg');
 svg.setAttribute('class','marks');svg.setAttribute('viewBox','0 0 8 8');
 const defs=document.createElementNS(svgNS,'defs');
 Object.entries(markColours).forEach(([key,color])=>{
  const marker=document.createElementNS(svgNS,'marker');
  marker.setAttribute('id','puzzle-arrow-'+key);marker.setAttribute('markerWidth','.34');marker.setAttribute('markerHeight','.34');
  marker.setAttribute('refX','.31');marker.setAttribute('refY','.17');marker.setAttribute('orient','auto');marker.setAttribute('markerUnits','userSpaceOnUse');
  const path=document.createElementNS(svgNS,'path');path.setAttribute('d','M0 0 L.34 .17 L0 .34 Z');path.setAttribute('fill',color);marker.appendChild(path);defs.appendChild(marker);
 });
 svg.appendChild(defs);
 const xy=sq=>{let x='abcdefgh'.indexOf(sq[0]),y=8-Number(sq[1]);if(flip){x=7-x;y=7-y}return [x+.5,y+.5]};
 boardMarks.forEach(m=>{
  const [x1,y1]=xy(m.from),[x2,y2]=xy(m.to),color=markColours[m.col]||markColours.g;
  if(m.from===m.to){
   const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',x1);c.setAttribute('cy',y1);c.setAttribute('r','.43');
   c.setAttribute('fill',color.replace(/\.9[025]?\)/,',.28)'));c.setAttribute('stroke',color);svg.appendChild(c);
  }else{
   const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
   const l=document.createElementNS(svgNS,'line');
   l.setAttribute('x1',x1);l.setAttribute('y1',y1);
   l.setAttribute('x2',x2-ux*.22);l.setAttribute('y2',y2-uy*.22);
   l.setAttribute('stroke',color);l.setAttribute('marker-end','url(#puzzle-arrow-'+(m.col||'g')+')');svg.appendChild(l);
  }
 });
 puzzleBoard.appendChild(svg);
}
function draw(){
 const bd=$('#bd');bd.innerHTML='';const bo=g.board(),targets={};
 if(sel)g.moves({square:sel,verbose:true}).forEach(m=>targets[m.to]=m.captured?'cap':'dot');
 for(let v=0;v<64;v++){
  let r=Math.floor(v/8),f=v%8;if(flip){r=7-r;f=7-f}
  const sq='abcdefgh'[f]+(8-r),pc=bo[r][f],d=document.createElement('div');
  d.className='sq '+((r+f)%2?'d':'l');d.dataset.s=sq;
  if(last&&(last[0]===sq||last[1]===sq))d.classList.add('last');
  if(sel===sq)d.classList.add('sel');if(hintSq===sq)d.classList.add('hint');if(targets[sq])d.classList.add(targets[sq]);
  if(activeGesture&&activeGesture.mode==='piece'&&activeGesture.from===sq)d.classList.add('drag-source');
  if(pc){
   const im=document.createElement('img');im.className='pc';im.alt='';im.draggable=false;
   im.src='https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/'+(pc.color==='w'?'w':'b')+pc.type.toUpperCase()+'.svg';d.appendChild(im);
  }
  if(v%8===7){const c=document.createElement('i');c.className='co r';c.textContent=8-r;d.appendChild(c)}
  if(v>55){const c=document.createElement('i');c.className='co f';c.textContent='abcdefgh'[f];d.appendChild(c)}
  bd.appendChild(d);
 }
 paintMarks();
}
function toggleMark(from,to,col){
 const i=boardMarks.findIndex(m=>m.from===from&&m.to===to&&m.col===col);
 if(i>=0)boardMarks.splice(i,1);else boardMarks.push({from,to,col});
}
puzzleBoard.addEventListener('pointerdown',e=>{
 const sq=squareAtPoint(e);if(!sq||!g)return;
 if(e.button!==0&&e.button!==2)return;
 e.preventDefault();try{puzzleBoard.setPointerCapture(e.pointerId)}catch(_){}
 const colour=gestureColour(e);
 if(e.button===2){
  activeGesture={mode:'mark',from:sq,to:sq,pointerId:e.pointerId,col:colour};
  return;
 }
 if(done)return;
 const p=g.get(sq);
 if(p&&p.color===g.turn()&&p.color===cur.side0){
  sel=sq;hintSq=null;
  activeGesture={mode:'piece',from:sq,to:sq,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};
  draw();
  const im=puzzleBoard.querySelector('.sq[data-s="'+sq+'"] .pc');
  if(im){
   dragGhost=document.createElement('div');dragGhost.className='drag-ghost';
   const clone=document.createElement('img');clone.src=im.src;clone.alt='';dragGhost.appendChild(clone);puzzleBoard.appendChild(dragGhost);moveGhost(e);
  }
 }else{
  activeGesture={mode:'click',from:sq,to:sq,pointerId:e.pointerId};
 }
});
puzzleBoard.addEventListener('pointermove',e=>{
 if(!activeGesture||activeGesture.pointerId!==e.pointerId)return;
 const to=squareAtPoint(e);if(to)activeGesture.to=to;
 if(activeGesture.mode==='piece'){
  if(Math.hypot(e.clientX-activeGesture.startX,e.clientY-activeGesture.startY)>5)activeGesture.moved=true;
  if(activeGesture.moved)moveGhost(e);
 }
});
puzzleBoard.addEventListener('pointerup',e=>{
 if(!activeGesture||activeGesture.pointerId!==e.pointerId)return;
 e.preventDefault();const a=activeGesture;activeGesture=null;
 const to=squareAtPoint(e)||a.to;clearGhost();
 if(a.mode==='mark'){
  toggleMark(a.from,to,a.col);draw();return;
 }
 if(a.mode==='piece'){
  if(a.moved&&to&&to!==a.from&&g.moves({square:a.from,verbose:true}).some(m=>m.to===to)){
   boardMarks=[];play(a.from,to);return;
  }
  if(a.moved){sel=null;draw();return}
  // A simple tap selects the piece; a second tap on a legal destination moves it.
  if(to===a.from){draw();return}
  if(to&&sel===a.from&&g.moves({square:a.from,verbose:true}).some(m=>m.to===to)){boardMarks=[];play(a.from,to);return}
 }
 if(a.mode==='click'&&to)click(to);
});
puzzleBoard.addEventListener('pointercancel',()=>{activeGesture=null;clearGhost();draw()});
puzzleBoard.addEventListener('contextmenu',e=>e.preventDefault());
function click(sq){
 if(done)return;const p=g.get(sq);hintSq=null;
 if(sel&&sel!==sq&&g.moves({square:sel,verbose:true}).some(m=>m.to===sq)){boardMarks=[];play(sel,sq);return}
 if(p&&p.color===g.turn()&&p.color===cur.side0){sel=sq;draw();return}
 sel=null;draw();
}
function play(a,b){const m=g.move({from:a,to:b,promotion:'q'});sel=null;if(!m)return;last=[a,b];const uci=a+b,exp=cur.moves[idx];
if(uci===exp||g.in_checkmate()){idx++;if(idx>=cur.moves.length||g.in_checkmate()){done=true;const puzzleIndex=PUZZLES.indexOf(cur);if(!failed&&puzzleIndex>=0)solved[puzzleIndex]=1;say('Success!','ok',failed?'Solved with help':'Puzzle complete')}else{say('Best move!','ok','Keep going');draw();setTimeout(()=>{const o=cur.moves[idx++];g.move({from:o.slice(0,2),to:o.slice(2,4),promotion:'q'});last=[o.slice(0,2),o.slice(2,4)];say('Your turn','','Find the best move');draw()},450);return}}
else{g.undo();failed=true;say('That’s not the move!','no','Try something else');$('#bd').classList.remove('shake');void $('#bd').offsetWidth;$('#bd').classList.add('shake');last=null}
draw()}
function say(t,c,m){$('#st').textContent=t;$('#st').className=c;$('#mt').textContent=m}
$('#bh').onclick=()=>{if(done)return;hintSq=cur.moves[idx].slice(0,2);draw()};
$('#daily-load').onclick=loadDaily;
PUZZLES.forEach(p=>p.side0=new Chess(p.fen).turn());
$('#df').onsubmit=e=>{e.preventDefault();const m='Hello Chess AnyTime, I would like to book a demo class.\nParent: '+$('#dp').value+'\nChild: '+$('#dk').value+'\nPhone: '+$('#dn').value;$('#dm').textContent='Thank you, '+$('#dp').value+'. WhatsApp is opening so you can send your request. We will confirm the demo class time shortly.';open('https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(m),'_blank')};
const WA_NUMBER='919911966706';
$('#cf').onsubmit=e=>{e.preventDefault();const m='Hello Chess AnyTime, I want to enroll '+$('#cn').value+' in '+$('#cp').value+'.';if(!WA_NUMBER){$('#cf button').textContent='Enrollment opens soon';return}open('https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(m),'_blank')};
const STUDENTS={demo:{name:'Demo Student',code:'1234',hw:[0,1,2]}}; /* preview only: add students and their homework (puzzle numbers) here */
function renderMe(){$('#tl').innerHTML=me?'Hi, '+STUDENTS[me].name+' · <a href="#portal">My homework</a>':'<a href="#login">Student Login</a>';if(!me)return;$('#pw').textContent='Welcome, '+STUDENTS[me].name;$('#hw').innerHTML='';STUDENTS[me].hw.forEach((i,k)=>{const p=PUZZLES[i],b=document.createElement('button');b.textContent=(solved[i]?'Done · ':'')+'Homework '+(k+1)+' · '+p.theme+' · rating '+p.rating;b.onclick=()=>{load(i);location.hash='#puzzles'};$('#hw').appendChild(b)})}
$('#lf').onsubmit=e=>{e.preventDefault();const id=$('#li').value.trim().toLowerCase(),s=STUDENTS[id];if(s&&s.code===$('#lc').value){me=id;location.hash='#portal';route()}else $('#lm').textContent='Student ID or password is incorrect.'};
$('#lo').onclick=()=>{me=null;location.hash='#login';route()};
document.querySelectorAll('.ph').forEach(e=>{e.textContent='';const i=document.createElement('img');i.src=document.querySelector('.brand img').src;i.alt='Chess AnyTime logo';e.appendChild(i)});
/* ---- ADD A NEW BLOG ARTICLE EACH WEEK HERE ----
 Copy one block, paste it ABOVE the others, and change: slug (short-name-with-dashes, no spaces), date (YYYY-MM-DD),
 title, summary (1-2 lines shown on the list) and body (the article, written in simple HTML: <p>, <h2>, <ul><li>, <img>).
 A post with a future date stays hidden until that day, so you can write several weeks ahead. */
const POSTS=[
{slug:'tips-to-improve-bullet-chess',date:'2026-07-04',title:'Tips To Improve Bullet Chess!!',
summary:'I have maintained a 2500+ Bullet rating for over a year. Here are the practical habits that helped me think faster, stay calm and win more games.',
body:`<p class="post-author"><a href="https://lichess.org/@/Shubham-Singh" target="_blank" rel="noopener">Shubham-Singh</a> · July 4, 2026 · 114 views</p>
<div class="post-cover"><div class="cover-mark">♜</div><div><span class="cover-kicker">THE CHESS ANYTIME GUIDE</span><strong>BULLET CHESS<br>GUIDE</strong><span class="cover-sub">HOW TO PLAY FAST AND WIN</span></div></div>
<div class="post-tags"><span>English (US)</span><a href="https://lichess.org/blog/topic/Chess" target="_blank" rel="noopener">Chess</a><a href="https://lichess.org/blog/topic/Analysis" target="_blank" rel="noopener">Analysis board</a><a href="https://lichess.org/blog/topic/Strategy" target="_blank" rel="noopener">Strategy</a></div>
<p class="post-lead"><b>I've maintained a 2500+ Bullet rating for over a year, and let me tell you: it's not just about moving fast, it's about thinking faster and staying cool under pressure. Now I'm sharing some key tips that helped me make this leap, so you can increase your bullet rating by winning more games!</b></p>
<h2>1. Your Opening Repertoire Should Be as Bulletproof as a King's Fortress</h2>
<ul><li>Choose <b>closed openings</b> that require less calculation and more pattern recognition. This also keeps the king safe and allows you to premove more.</li><li>Aim for <i>structures you understand deeply</i>, like the London, King's Indian setups, or the Scandinavian (in my case).</li><li>Avoid wild gambits unless you've practised them by heart.</li></ul>
<h3>A game against a Grandmaster</h3>
<p>Here is a game against GM <a href="https://lichess.org/@/Mrjoeyg" target="_blank" rel="noopener">Mrjoeyg</a> (2517), where I used my Scandinavian Defence to win. I was playing as Shubham-Singh (2478). Black won by checkmate with 00:20 remaining on my clock.</p>
<div class="game-embed"><iframe src="https://lichess.org/embed/game/XN40BMpc?theme=auto&amp;bg=auto" title="Shubham-Singh vs Mrjoeyg on Lichess" allowtransparency="true" frameborder="0"></iframe></div>
<p class="meta">View the <a href="https://lichess.org/game/XN40BMpc" target="_blank" rel="noopener">full game on Lichess</a>.</p>
<h2>2. Pre-Moves Are Real Hacks</h2>
<ul><li>Practise <b>accurate premoving</b>, especially in endgames, familiar opening moves and recaptures.</li><li>But <i>don't premove blindly</i>, or you'll hang your queen or blunder your rook faster than Fool's Mate.</li></ul>
<h2>3. Time Management &gt; Piece Management</h2>
<ul><li>Never use more than <b>1 second per move</b> unless the position demands it. Remember, any safe good move is better than the best move if the latter burns too much time.</li><li>Develop an internal <i>position complexity meter</i>: spend a little extra time on tricky moves.</li><li>When your opponent is low on time, speed up! Pressure checkmates brains!</li></ul>
<h2>4. Endgames</h2>
<ul><li>Master <b>simple king and pawn endgames</b>. Many games come down to promoting that one extra pawn. Check out <a href="https://www.youtube.com/@chessanytime" target="_blank" rel="noopener">Chess AnyTime on YouTube</a> for basic endgame lessons.</li><li>Learn <i>flagging tricks</i>, triangulation and fortress-building with just seconds left.</li><li>In time scrambles, if your position is losing, <b>create chaos</b>: push pawns, threaten checks and sacrifice pieces if it causes hesitation.</li><li>Keep giving checks in the last moments. It is difficult to find a way out of random checks under time pressure.</li><li><i>“In bullet, bishops may cut long diagonals but in time scrambles, it's pawns that checkmate the clock!”</i></li></ul>
<h2>5. Other Requirements</h2>
<ul><li>A good internet connection is essential. A ping below <b>200 ms</b> is best.</li><li>Use a <b>gaming mouse</b> or a touchscreen if it helps you move faster.</li><li>Customise your board settings: high-contrast pieces, a large board and premove animations off. I prefer a customised dark Lichess background to keep my focus on the board.</li><li><b>Autopromote to queen</b> should be on. If you want to underpromote, hold CTRL while promoting.</li></ul>
<h2>6. Keep Calm in Chaos: Be the King Even When the Board Is Burning</h2>
<ul><li>Bullet is psychological warfare. <i>Stay cool when you blunder</i>; everyone does!</li><li>Play for tricks when you're down material. Swindles are part of the game.</li></ul>
<h2>7. Berserk Smartly (For Tournaments Only)</h2>
<ul><li>Berserking helps your climb only if you win <b>60–70% of the time</b>. Berserk against weaker opponents!</li><li>Avoid berserking strong opponents unless they are much stronger. They are likely to berserk back, neutralising your time risk. That's how I secured <b>Rank 30 in the Lichess Spring Marathon 2025</b> (<a href="https://lichess.org/tournament/spring25" target="_blank" rel="noopener">tournament page</a>).</li><li>In general, you can berserk in 2+1 and 2+0, but not 1+0.</li></ul>
<h2>8. Study Your Games</h2>
<ul><li>Use <b>Lichess or Chess.com analysis</b> to find common mistakes.</li><li>Focus on pattern blunders, repeated tactical oversights and consistent time mismanagement.</li><li>Practise common tactical puzzles at <a href="https://blitztactics.com" target="_blank" rel="noopener">Blitz Tactics</a>.</li><li>Practise common mating patterns.</li></ul>
<h2>9. Stalemates: Don't Let Winning Positions Die a Quiet Death</h2>
<ul><li>In bullet, <b>stalemates are silent assassins</b>. You might be up a queen and two rooks, but one careless move and it's ½–½ instead of GG.</li><li>Learn to recognise basic stalemate patterns, especially when your opponent has only their king left.</li><li>When low on time, push for mate efficiently. Don't waste moves chasing a king into a corner if it means you'll box yourself into a draw.</li><li><b>Don't resign</b> if there is any possibility of stalemate, flagging or counterplay!</li></ul>
<h2>10. Psychology: Believe You're the Bullet Boss</h2>
<ul><li>Visualise yourself reaching your aim. Believe it's just <b>a matter of time</b>.</li><li>Trash-talk the clock in your head: <i>“You're not faster than me; you're just a ticking spectator.”</i></li><li><i>“If you think like a king and move like a rook, nothing can stop your promotion!”</i></li></ul>
<hr>
<p class="post-question"><b>What's your current bullet rating?</b> Drop your biggest struggle below. I'll reply with one specific tip to help you improve. Let's climb together!</p>`}
];
const fmt=d=>new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
const livePosts=()=>{const t=localDate();return POSTS.filter(x=>x.date<=t).sort((a,b)=>b.date.localeCompare(a.date))};
function renderBlog(){document.title='Blog | Chess AnyTime';const l=$('#bl');l.innerHTML='';const ps=livePosts();if(!ps.length){l.textContent='New articles coming soon.';return}
ps.forEach(x=>{const a=document.createElement('a');a.className='card pc2';a.href='#blog-'+x.slug;const img=document.createElement('div');img.className='blog-thumb-fallback';img.innerHTML='BULLET CHESS GUIDE<span>HOW TO PLAY FAST AND WIN</span>';const h3=document.createElement('h3');h3.textContent=x.title;a.append(img,h3);l.appendChild(a)})}
function renderPost(slug){const x=livePosts().find(y=>y.slug===slug);if(!x){location.hash='#blog';return}document.title=x.title+' | Chess AnyTime';$('#pt').textContent=x.title;$('#pd').textContent=fmt(x.date)+' \u00b7 By Coach Shubham';$('#pb').innerHTML=x.body;scrollTo(0,0)}
route();
