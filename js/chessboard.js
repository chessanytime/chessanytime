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
 const bd=$('#bd');bd.innerHTML='';if(!g)return;const bo=g.board(),targets={};
 if(sel)g.moves({square:sel,verbose:true}).forEach(m=>targets[m.to]=m.captured?'cap':'dot');
 for(let v=0;v<64;v++){
  let r=Math.floor(v/8),f=v%8;if(flip){r=7-r;f=7-f}
  const sq='abcdefgh'[f]+(8-r),pc=bo[r][f],d=document.createElement('div');
  d.className='sq '+((r+f)%2?'d':'l');d.dataset.s=sq;
  d.setAttribute('role','button');d.tabIndex=v===0?0:-1;
  d.setAttribute('aria-label',sq+(pc?' '+(pc.color==='w'?'white':'black')+' '+({p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'}[pc.type]):' empty'));
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
 if(done||puzzleWaiting)return;
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
 if(!g||done||puzzleWaiting)return;const p=g.get(sq);hintSq=null;
 if(sel&&sel!==sq&&g.moves({square:sel,verbose:true}).some(m=>m.to===sq)){boardMarks=[];play(sel,sq);return}
 if(p&&p.color===g.turn()&&p.color===cur.side0){sel=sq;draw();return}
 sel=null;draw();
}
puzzleBoard.addEventListener('keydown',event=>{
 const square=event.target.closest('.sq');if(!square||!g)return;
 const squares=[...puzzleBoard.querySelectorAll('.sq')],index=squares.indexOf(square);
 const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};
 if(Object.hasOwn(offsets,event.key)){
  event.preventDefault();const next=Math.max(0,Math.min(63,index+offsets[event.key]));
  squares.forEach(item=>item.tabIndex=-1);squares[next].tabIndex=0;squares[next].focus();
 }else if(event.key==='Enter'||event.key===' '){
  event.preventDefault();const coordinate=square.dataset.s;click(coordinate);
  const target=puzzleBoard.querySelector('[data-s="'+coordinate+'"]');if(target){target.tabIndex=0;target.focus()}
 }
});
