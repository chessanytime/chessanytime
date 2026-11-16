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
document.querySelectorAll('.ph').forEach(e=>{e.textContent='';const i=document.createElement('img');i.src=document.querySelector('.brand img').src;i.alt='Chess AnyTime logo';e.appendChild(i)});

