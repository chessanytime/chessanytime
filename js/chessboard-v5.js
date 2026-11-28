// Board interactions: click-to-move, drag-and-drop, coloured arrows and square marks.
const puzzleBoard=$('#bd');
let dragGhost=null, previousBoard=null, boardOrientation=null, skipMoveAnimation=false;
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
// Annotation revision 5: independent geometry and render validation.
function isArrowGeometry(from,to){
 if(!/^[a-h][1-8]$/.test(from)||!/^[a-h][1-8]$/.test(to))return false;
 const dx=Math.abs(from.charCodeAt(0)-to.charCodeAt(0)),dy=Math.abs(Number(from[1])-Number(to[1]));
 return dx===0||dy===0||dx===dy||(dx===1&&dy===2)||(dx===2&&dy===1);
}
// Snap drawings to the closest rank, file, diagonal or knight-jump square.
function snappedArrowSquare(from,e){
 const r=puzzleBoard.getBoundingClientRect();
 const x=(e.clientX-r.left)*8/r.width,y=(e.clientY-r.top)*8/r.height;
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=8||y>=8)return null;
 if(!/^[a-h][1-8]$/.test(from))return null;
 let best=from,dist=Infinity;
 for(let f=0;f<8;f++)for(let rank=0;rank<8;rank++){
  if(!isArrowGeometry(from,'abcdefgh'[f]+(rank+1)))continue;
  const cx=(flip?7-f:f)+.5,cy=(flip?rank:7-rank)+.5;
  const d=(cx-x)**2+(cy-y)**2;
  if(d<dist){dist=d;best='abcdefgh'[f]+(rank+1)}
 }
 return best;
}
function gestureColour(e){
 const blue=e.altKey||e.metaKey,red=e.ctrlKey||(e.button===2&&e.shiftKey);
 return red&&blue?'y':red?'r':blue?'b':drawMode?selectedBrush:'g';
}
function clearGhost(){
 if(dragGhost){dragGhost.remove();dragGhost=null}
 puzzleBoard.classList.remove('is-grabbing');document.body.classList.remove('ca-board-grabbing');
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
 const xy=sq=>{let x='abcdefgh'.indexOf(sq[0]),y=8-Number(sq[1]);if(flip){x=7-x;y=7-y}return [x+.5,y+.5]};
 const preview=activeGesture?.mode==='mark'&&activeGesture.to?{from:activeGesture.from,to:activeGesture.to,col:activeGesture.col,preview:true}:null;
 const matches=(a,b)=>a.from===b.from&&a.to===b.to;
 const marks=[...boardMarks.filter(mark=>!userBoardMarks.some(user=>matches(user,mark))),...userBoardMarks].filter(m=>!preview||!matches(m,preview));
 if(preview)marks.push(preview);
 marks.forEach(m=>{
  if(!isArrowGeometry(m.from,m.to))return;
  const group=document.createElementNS(svgNS,'g');
  group.setAttribute('opacity',m.preview?'.54':'.60');
  svg.appendChild(group);
  const [x1,y1]=xy(m.from),[x2,y2]=xy(m.to),color=markColours[m.col]||markColours.g;
  if(m.from===m.to){
   const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',x1);c.setAttribute('cy',y1);c.setAttribute('r','.43');
   c.setAttribute('fill','none');c.setAttribute('stroke',color);group.appendChild(c);
  }else{
   // One continuous silhouette avoids a visible seam or doubled opacity
   // between the shaft and the arrowhead. Dimensions are in square units.
   const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
   const width=m.preview?.1328:.15625,half=width/2;
   const headHalf=width*1.85,headLength=width*2.9;
   const crowded=marks.some(other=>{
    if(other===m||other.from===other.to||other.to!==m.to)return false;
    const [ox,oy]=xy(other.from),vx=x2-ox,vy=y2-oy;
    return (vx*ux+vy*uy)/Math.hypot(vx,vy)>.707;
   });
   const tipDistance=len-(crowded&&!m.preview?.15625:0);
   const neck=tipDistance-headLength;
   const point=(along,across)=>[x1+ux*along+nx*across,y1+uy*along+ny*across].map(v=>v.toFixed(5)).join(' ');
   const p=document.createElementNS(svgNS,'path');
   p.setAttribute('d','M '+point(0,-half)+' L '+point(neck,-half)+' L '+point(neck,-headHalf)+' L '+point(tipDistance,0)+' L '+point(neck,headHalf)+' L '+point(neck,half)+' L '+point(0,half)+' A '+half+' '+half+' 0 0 1 '+point(0,-half)+' Z');
   p.setAttribute('fill',color);group.appendChild(p);
  }
 });
 puzzleBoard.appendChild(svg);
}
function createDragGhost(sq,e){
 const im=puzzleBoard.querySelector('.sq[data-s="'+sq+'"] .pc');
 if(!im||dragGhost)return;
 dragGhost=document.createElement('div');dragGhost.className='drag-ghost';
 const clone=document.createElement('img');clone.src=im.src;clone.alt='';dragGhost.appendChild(clone);puzzleBoard.appendChild(dragGhost);
 im.parentElement.classList.add('drag-source');puzzleBoard.classList.add('is-grabbing');document.body.classList.add('ca-board-grabbing');moveGhost(e);
}
function draw(){
 const bd=puzzleBoard;
 if(!g){bd.replaceChildren();previousBoard=null;boardOrientation=null;return}
 const bo=g.board(),targets={},position={};
 if(sel&&showLegalMoves)g.moves({square:sel,verbose:true}).forEach(m=>targets[m.to]=m.captured?'cap':'dot');
 for(let r=0;r<8;r++)for(let f=0;f<8;f++){const p=bo[r][f];if(p)position['abcdefgh'[f]+(8-r)]=p.color+p.type;}
 const sameOrientation=boardOrientation===flip,existing=[...bd.querySelectorAll(':scope > .sq')],old=sameOrientation&&existing.length===64?previousBoard:null;
 if(!sameOrientation||existing.length!==64){
  bd.replaceChildren();for(let i=0;i<64;i++){const d=document.createElement('div');d.setAttribute('role','button');d.tabIndex=i===0?0:-1;bd.append(d);}
 }
 const squares=[...bd.children].slice(0,64);
 const coords=sq=>{let f='abcdefgh'.indexOf(sq[0]),r=8-Number(sq[1]);return flip?[7-f,7-r]:[f,r]};
 const changed=old?Array.from(new Set([...Object.keys(old),...Object.keys(position)])).filter(s=>old[s]!==position[s]):[];
 const departures=changed.filter(s=>old[s]),used=new Set(),animate=!!old&&changed.length<=6&&!skipMoveAnimation&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 skipMoveAnimation=false;
 let checkSquare=null;if(g.in_check())checkSquare=Object.keys(position).find(s=>position[s]===g.turn()+'k');
 for(let v=0;v<64;v++){
  let r=Math.floor(v/8),f=v%8;if(flip){r=7-r;f=7-f}
  const sq='abcdefgh'[f]+(8-r),pc=bo[r][f],d=squares[v],sameSquare=d.dataset.s===sq;
  d.className='sq '+((r+f)%2?'d':'l');d.dataset.s=sq;
  if(!sameSquare){d.replaceChildren();d.tabIndex=v===0?0:-1;}
  d.setAttribute('aria-label',sq+(pc?' '+(pc.color==='w'?'white':'black')+' '+({p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'}[pc.type]):' empty')+(targets[sq]?(targets[sq]==='cap'?', legal capture':', legal move'):''));
  d.setAttribute('aria-pressed',String(sel===sq));
  if(last?.includes(sq))d.classList.add('last');
  if(sel===sq)d.classList.add('sel');if(hintSq===sq)d.classList.add('hint');if(targets[sq])d.classList.add(targets[sq]);
  if(checkSquare===sq)d.classList.add('in-check');
  if(pc&&!done&&!puzzleWaiting&&pc.color===g.turn()&&pc.color===cur?.side0)d.classList.add('can-grab');
  if(activeGesture?.mode==='piece'&&activeGesture.moved&&activeGesture.from===sq)d.classList.add('drag-source');
  let im=d.querySelector('.pc');
  if(im&&(!pc||im.dataset.piece!==position[sq])){im.remove();im=null}
  if(pc&&!im){
   im=document.createElement('img');im.className='pc';im.alt='';im.draggable=false;im.dataset.piece=position[sq];
   im.src='https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/'+pc.color+pc.type.toUpperCase()+'.svg';d.prepend(im);
   if(animate&&old[sq]!==position[sq]){
    const [x,y]=coords(sq);const candidates=departures.filter(s=>!used.has(s)&&old[s]===position[sq]&&s!==sq);
    candidates.sort((a,b)=>{const [ax,ay]=coords(a),[bx,by]=coords(b);return Math.hypot(ax-x,ay-y)-Math.hypot(bx-x,by-y)});
    if(candidates.length){const from=candidates[0];used.add(from);const [fx,fy]=coords(from);im.animate?.([{transform:'translate('+((fx-x)*100)+'%,'+((fy-y)*100)+'%)',zIndex:6},{transform:'translate(0,0)',zIndex:6}],{duration:200,easing:'cubic-bezier(.2,.7,.25,1)'});}
   }
  }
  if(!sameSquare){
   if(v%8===0){const c=document.createElement('i');c.className='co r';c.textContent=8-r;d.appendChild(c)}
   if(v>55){const c=document.createElement('i');c.className='co f';c.textContent='abcdefgh'[f];d.appendChild(c)}
  }
 }
 previousBoard=position;boardOrientation=flip;paintMarks();
}
function toggleMark(from,to,col){
 if(!isArrowGeometry(from,to))return;
 const same=m=>m.from===from&&m.to===to;
 const existing=userBoardMarks.find(same);
 userBoardMarks=userBoardMarks.filter(m=>!same(m));
 if(!existing||existing.col!==col)userBoardMarks.push({from,to,col});
 boardMarks=boardMarks.filter(m=>!same(m));
}
function clearBoardMarks(){
 const hadMarks=boardMarks.length>0||userBoardMarks.length>0||!!hintSq;
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
 if(hadMarks)paintMarks();
 if(done||puzzleWaiting){if(hadMarks)draw();return}
 const p=g.get(sq);
 if(p&&p.color===g.turn()&&p.color===cur.side0){
  const wasSelected=sel===sq;
  sel=sq;hintSq=null;
  activeGesture={mode:'piece',from:sq,to:sq,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false,wasSelected};
  draw();
  // Show the held piece immediately; retain the movement threshold for click vs drag.
  createDragGhost(sq,e);
 }else{
  activeGesture={mode:'click',from:sq,to:sq,pointerId:e.pointerId};
 }
});
puzzleBoard.addEventListener('pointermove',e=>{
 if(!activeGesture||activeGesture.pointerId!==e.pointerId)return;
 const to=squareAtPoint(e);
 if(activeGesture.mode==='mark'){
  const snapped=snappedArrowSquare(activeGesture.from,e);
  if(activeGesture.to!==snapped){activeGesture.to=snapped;paintMarks();}
  return;
 }
 if(to)activeGesture.to=to;
 if(activeGesture.mode==='piece'){
  if(Math.hypot(e.clientX-activeGesture.startX,e.clientY-activeGesture.startY)>5)activeGesture.moved=true;
  if(activeGesture.moved){createDragGhost(activeGesture.from,e);moveGhost(e);}
 }
});
puzzleBoard.addEventListener('pointerup',e=>{
 if(!activeGesture||activeGesture.pointerId!==e.pointerId)return;
 e.preventDefault();const a=activeGesture;activeGesture=null;
 const end=squareAtPoint(e),to=end||a.to;clearGhost();
 if(a.mode==='mark'){
  const snapped=snappedArrowSquare(a.from,e);
  if(snapped)toggleMark(a.from,snapped,a.col);
  paintMarks();return;
 }
 if(a.mode==='piece'){
  if(!g||done||puzzleWaiting){draw();return}
  if(a.moved&&end&&end!==a.from&&g.moves({square:a.from,verbose:true}).some(m=>m.to===end)){
   boardMarks=[];skipMoveAnimation=true;play(a.from,end);skipMoveAnimation=false;return;
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


// Square board resize handle: independent of move/draw gestures.
(()=>{
 const frame=puzzleBoard.closest('.board-frame'),main=puzzleBoard.closest('main');if(!frame||!main)return;
 frame.classList.add('ca-resizable-board');
 const handle=frame.querySelector('.ca-board-resize')||document.createElement('button');handle.type='button';handle.className='ca-board-resize';handle.setAttribute('aria-label','Resize chessboard with arrow keys or drag');handle.title='Resize board';if(!handle.parentElement)frame.append(handle);handle.dataset.ready='true';
 const root=main.querySelector('.pz')||frame.parentElement;
 const clamp=n=>Math.max(Math.min(240,max()),Math.min(max(),n));
 function max(){if(main.id==='puzzles'&&innerWidth>900)return Math.max(1,root.clientWidth-300-34);if(main.id==='pgn'){const layout=main.querySelector('.pgn-layout'),focused=main.classList.contains('pgn-focused');return Math.max(1,layout.clientWidth-(focused?0:innerWidth>900?328:innerWidth>700?174:0))}return Math.max(1,root.clientWidth)}
 function setWidth(n){const width=Math.round(clamp(n));if(main.id==='pgn'){main.dispatchEvent(new CustomEvent('ca-board-resize',{detail:{width}}));}else main.style.setProperty('--ca-user-board-width',width+'px');return width}
 let resize=null;
 handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();resize={x:e.clientX,y:e.clientY,size:puzzleBoard.getBoundingClientRect().width,id:e.pointerId};handle.setPointerCapture(e.pointerId);document.body.classList.add('ca-board-resizing')});
 handle.addEventListener('pointermove',e=>{if(!resize||resize.id!==e.pointerId)return;setWidth(resize.size+((e.clientX-resize.x)+(e.clientY-resize.y))/2)});
 function stop(e){if(resize&&resize.id===e.pointerId){resize=null;document.body.classList.remove('ca-board-resizing')}}
 handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);handle.addEventListener('lostpointercapture',stop);
 handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();else setWidth(puzzleBoard.getBoundingClientRect().width+(['ArrowRight','ArrowDown'].includes(e.key)?24:-24))});
 function reset(){main.style.removeProperty('--ca-user-board-width');if(main.id==='pgn')main.dispatchEvent(new CustomEvent('ca-board-resize',{detail:{reset:true}}))}
 handle.addEventListener('dblclick',reset);
 addEventListener('resize',()=>{const n=parseFloat(main.style.getPropertyValue('--ca-user-board-width'));if(Number.isFinite(n))setWidth(n)});
})();
