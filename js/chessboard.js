// Board interactions: click-to-move, drag-and-drop, coloured arrows and square marks.
const puzzleBoard=$('#bd');
let dragGhost=null;
let showLegalMoves=true;
try{
 const saved=localStorage.getItem('caShowLegalMoves');
 if(saved==='true'||saved==='false')showLegalMoves=saved==='true';
 else if(saved!==null)console.warn('Invalid saved legal-move display preference.');
}catch(error){console.warn('Could not restore the legal-move display preference:',error)}
const markColours={g:'#15781b',r:'#882020',b:'#003088',y:'#e68f00'};
let drawMode=false,selectedBrush='g';
function syncDrawingControls(){
 document.querySelectorAll('[data-board-draw-mode]').forEach(b=>{
  b.setAttribute('aria-pressed',String(drawMode));
  b.textContent=drawMode?'Draw: on':'Draw: off';
 });
 document.querySelectorAll('[data-board-brush]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.boardBrush===selectedBrush)));
 puzzleBoard.classList.toggle('drawing-mode',drawMode);
}
function setDrawMode(value){drawMode=value;syncDrawingControls();}

function squareAtPoint(e){
 const r=puzzleBoard.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 if(x<0||y<0||x>=r.width||y>=r.height)return null;
 let file=Math.min(7,Math.floor(x/r.width*8)),rank=Math.min(7,Math.floor(y/r.height*8));
 if(flip){file=7-file;rank=7-rank}
 return 'abcdefgh'[file]+(8-rank);
}
function gestureColour(e){
 const blue=e.altKey||e.metaKey,red=e.ctrlKey||(e.button===2&&e.shiftKey);
 return red&&blue?'y':red?'r':blue?'b':drawMode?selectedBrush:'g';
}
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
 puzzleBoard.querySelector('.marks')?.remove();
 const svgNS='http://www.w3.org/2000/svg',svg=document.createElementNS(svgNS,'svg');
 svg.setAttribute('class','marks');svg.setAttribute('viewBox','0 0 8 8');svg.setAttribute('aria-hidden','true');
 const defs=document.createElementNS(svgNS,'defs');
 Object.entries(markColours).forEach(([key,color])=>{
  const marker=document.createElementNS(svgNS,'marker');
  marker.setAttribute('id','puzzle-arrow-'+key);marker.setAttribute('markerWidth','.38');marker.setAttribute('markerHeight','.38');
  marker.setAttribute('refX','.36');marker.setAttribute('refY','.19');marker.setAttribute('orient','auto');marker.setAttribute('markerUnits','userSpaceOnUse');
  const path=document.createElementNS(svgNS,'path');path.setAttribute('d','M0 0 L.38 .19 L0 .38 Z');path.setAttribute('fill',color);marker.appendChild(path);defs.appendChild(marker);
 });
 svg.appendChild(defs);
 const xy=sq=>{let x='abcdefgh'.indexOf(sq[0]),y=8-Number(sq[1]);if(flip){x=7-x;y=7-y}return [x+.5,y+.5]};
 const preview=activeGesture?.mode==='mark'&&activeGesture.to?{from:activeGesture.from,to:activeGesture.to,col:activeGesture.col,preview:true}:null;
 const matches=(a,b)=>a.from===b.from&&a.to===b.to;
 const marks=[...boardMarks.filter(mark=>!userBoardMarks.some(user=>matches(user,mark))),...userBoardMarks].filter(m=>!preview||!matches(m,preview));
 if(preview)marks.push(preview);
 marks.forEach(m=>{
  if(!/^[a-h][1-8]$/.test(m.from)||!/^[a-h][1-8]$/.test(m.to))return;
  const group=document.createElementNS(svgNS,'g');
  group.setAttribute('opacity',m.preview?'.45':'.85');
  svg.appendChild(group);
  const [x1,y1]=xy(m.from),[x2,y2]=xy(m.to),color=markColours[m.col]||markColours.g;
  if(m.from===m.to){
   const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',x1);c.setAttribute('cy',y1);c.setAttribute('r','.43');
   c.setAttribute('fill','none');c.setAttribute('stroke',color);group.appendChild(c);
  }else{
   const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
   const l=document.createElementNS(svgNS,'line');
   l.setAttribute('x1',x1);l.setAttribute('y1',y1);
   l.setAttribute('x2',x2-ux*.22);l.setAttribute('y2',y2-uy*.22);
   l.setAttribute('stroke',color);l.setAttribute('marker-end','url(#puzzle-arrow-'+(markColours[m.col]?m.col:'g')+')');group.appendChild(l);
  }
 });
 puzzleBoard.appendChild(svg);
}
function draw(){
 const bd=$('#bd');bd.innerHTML='';if(!g)return;const bo=g.board(),targets={};
 if(sel&&showLegalMoves)g.moves({square:sel,verbose:true}).forEach(m=>targets[m.to]=m.captured?'cap':'dot');
 for(let v=0;v<64;v++){
  let r=Math.floor(v/8),f=v%8;if(flip){r=7-r;f=7-f}
  const sq='abcdefgh'[f]+(8-r),pc=bo[r][f],d=document.createElement('div');
  d.className='sq '+((r+f)%2?'d':'l');d.dataset.s=sq;
  d.setAttribute('role','button');d.tabIndex=v===0?0:-1;
  d.setAttribute('aria-label',sq+(pc?' '+(pc.color==='w'?'white':'black')+' '+({p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'}[pc.type]):' empty'));
  d.setAttribute('aria-pressed',String(sel===sq));
  if(targets[sq])d.setAttribute('aria-label',d.getAttribute('aria-label')+(targets[sq]==='cap'?', legal capture':', legal move'));
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
 const same=m=>m.from===from&&m.to===to;
 const existing=userBoardMarks.find(same);
 userBoardMarks=userBoardMarks.filter(m=>!same(m));
 if(!existing||existing.col!==col)userBoardMarks.push({from,to,col});
 boardMarks=boardMarks.filter(m=>!same(m));
}
function clearBoardMarks(){
 const hadMarks=boardMarks.length>0||userBoardMarks.length>0;
 boardMarks=[];userBoardMarks=[];hintSq=null;
 return hadMarks;
}
puzzleBoard.addEventListener('pointerdown',e=>{
 const sq=squareAtPoint(e);if(!sq||!g)return;
 if(activeGesture||(!e.isPrimary&&e.isPrimary!==undefined)||(e.button!==0&&e.button!==2))return;
 e.preventDefault();try{puzzleBoard.setPointerCapture(e.pointerId)}catch(_){}
 const colour=gestureColour(e);
 if(e.button===2||(e.button===0&&(drawMode||e.shiftKey))){
  sel=null;hintSq=null;boardMarks=[];
  activeGesture={mode:'mark',from:sq,to:sq,pointerId:e.pointerId,col:colour};
  draw();
  return;
 }
 const hadMarks=clearBoardMarks();
 if(hadMarks)sel=null;
 if(done||puzzleWaiting){if(hadMarks)draw();return}
 const p=g.get(sq);
 if(p&&p.color===g.turn()&&p.color===cur.side0){
  const wasSelected=sel===sq;
  sel=sq;hintSq=null;
  activeGesture={mode:'piece',from:sq,to:sq,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false,wasSelected};
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
 const to=squareAtPoint(e);
 if(activeGesture.mode==='mark'){
  if(activeGesture.to!==to){activeGesture.to=to;paintMarks();}
  return;
 }
 if(to)activeGesture.to=to;
 if(activeGesture.mode==='piece'){
  if(Math.hypot(e.clientX-activeGesture.startX,e.clientY-activeGesture.startY)>5)activeGesture.moved=true;
  if(activeGesture.moved)moveGhost(e);
 }
});
puzzleBoard.addEventListener('pointerup',e=>{
 if(!activeGesture||activeGesture.pointerId!==e.pointerId)return;
 e.preventDefault();const a=activeGesture;activeGesture=null;
 const end=squareAtPoint(e),to=end||a.to;clearGhost();
 if(a.mode==='mark'){
  if(end)toggleMark(a.from,end,a.col);
  paintMarks();return;
 }
 if(a.mode==='piece'){
  if(a.moved&&to&&to!==a.from&&g.moves({square:a.from,verbose:true}).some(m=>m.to===to)){
   boardMarks=[];play(a.from,to);return;
  }
  if(a.moved){sel=null;draw();return}
  if(to===a.from){if(a.wasSelected)sel=null;draw();return}
  if(to&&sel===a.from&&g.moves({square:a.from,verbose:true}).some(m=>m.to===to)){boardMarks=[];play(a.from,to);return}
 }
 if(a.mode==='click'&&to){click(to);if(!done&&!puzzleWaiting)draw();}
});
function cancelBoardGesture(e){
 if(!activeGesture||activeGesture.pointerId!==e.pointerId)return;
 activeGesture=null;clearGhost();draw();
}
puzzleBoard.addEventListener('pointercancel',cancelBoardGesture);
puzzleBoard.addEventListener('lostpointercapture',cancelBoardGesture);
puzzleBoard.addEventListener('contextmenu',e=>e.preventDefault());
function click(sq){
 if(!g)return;
 const hadMarks=clearBoardMarks();if(hadMarks)sel=null;
 if(done||puzzleWaiting){if(hadMarks)draw();return}
 const p=g.get(sq);
 if(sel&&sel!==sq&&g.moves({square:sel,verbose:true}).some(m=>m.to===sq)){boardMarks=[];play(sel,sq);return}
 if(p&&p.color===g.turn()&&p.color===cur.side0){sel=sel===sq?null:sq;draw();return}
 sel=null;draw();
}
puzzleBoard.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&g){event.preventDefault();activeGesture=null;clearGhost();clearBoardMarks();setDrawMode(false);draw();return;}
 const square=event.target.closest('.sq');if(!square||!g)return;
 const squares=[...puzzleBoard.querySelectorAll('.sq')],index=squares.indexOf(square);
 const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};
 if(Object.hasOwn(offsets,event.key)){
  event.preventDefault();const next=Math.max(0,Math.min(63,index+offsets[event.key]));
  squares.forEach(item=>item.tabIndex=-1);squares[next].tabIndex=0;squares[next].focus();
 }else if(event.key==='Enter'||event.key===' '){
  event.preventDefault();const coordinate=square.dataset.s;if(drawMode){toggleMark(coordinate,coordinate,selectedBrush);paintMarks();return;}click(coordinate);
  const target=puzzleBoard.querySelector('[data-s="'+coordinate+'"]');if(target){target.tabIndex=0;target.focus()}
 }
});
document.querySelectorAll('[data-board-legal-moves]').forEach(input=>{
 input.checked=showLegalMoves;
 input.addEventListener('change',()=>{
  showLegalMoves=input.checked;
  document.querySelectorAll('[data-board-legal-moves]').forEach(control=>control.checked=showLegalMoves);
  try{localStorage.setItem('caShowLegalMoves',String(showLegalMoves))}
  catch(error){console.warn('Could not save the legal-move display preference:',error)}
  draw();
 });
});
document.querySelectorAll('[data-board-clear-marks]').forEach(button=>{
 button.addEventListener('click',()=>{activeGesture=null;clearGhost();clearBoardMarks();draw()});
});

document.querySelectorAll('[data-board-draw-mode]').forEach(button=>button.addEventListener('click',()=>setDrawMode(!drawMode)));
document.querySelectorAll('[data-board-brush]').forEach(button=>button.addEventListener('click',()=>{
 selectedBrush=button.dataset.boardBrush;setDrawMode(true);
}));
syncDrawingControls();
