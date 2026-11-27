(()=>{
 const $=id=>document.getElementById(id),dialog=$('pgn-editor-dialog'),board=$('pgn-editor-board'),palette=$('pgn-editor-palette'),fenBox=$('pgn-editor-fen'),error=$('pgn-editor-error'),castles=[...dialog.querySelectorAll('[data-editor-castle]')];
 const start=new Chess().fen(),empty='8/8/8/8/8/8/8/8 w - - 0 1',symbols='KQRBNPkqrbnp';
 let cells={},brush='move',selected=null,flipped=false,dirty=false;
 const name=p=>({k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'})[p.toLowerCase()];
 const image=p=>{const im=document.createElement('img');im.src='https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/'+(p===p.toUpperCase()?'w':'b')+p.toUpperCase()+'.svg';im.alt='';im.draggable=false;return im};
 function inform(msg=''){error.textContent=msg}
 function buildFen(){
  const rows=[];for(let rank=8;rank>=1;rank--){let row='',n=0;for(const file of 'abcdefgh'){const p=cells[file+rank];if(!p)n++;else{if(n)row+=n;n=0;row+=p}}if(n)row+=n;rows.push(row)}
  return [rows.join('/'),$('pgn-editor-turn').value,castles.filter(c=>c.checked).map(c=>c.value).join('')||'-',$('pgn-editor-ep').value.trim()||'-',$('pgn-editor-half').value,$('pgn-editor-full').value].join(' ');
 }
 function sync(){fenBox.value=buildFen();dirty=false;inform()}
 function loadFen(input){
  const parts=input.trim().split(/\s+/);
  if(parts.length===1)parts.push('w','-','-','0','1');
  if(parts.length!==6)throw Error('FEN needs a board plus five position fields.');
  const ranks=parts[0].split('/'),next={};if(ranks.length!==8)throw Error('FEN must have eight ranks.');
  ranks.forEach((row,r)=>{let f=0;for(const p of row){if(/^[1-8]$/.test(p))f+=Number(p);else if(symbols.includes(p)&&f<8){next['abcdefgh'[f]+(8-r)]=p;f++}else throw Error('Invalid piece placement.')}if(f!==8)throw Error('Each rank must contain eight squares.')});
  if(!/^[wb]$/.test(parts[1])||!(/^(?:K?Q?k?q?|-)$/.test(parts[2])&&parts[2])||!/^(?:-|[a-h][36])$/.test(parts[3])||!/^\d+$/.test(parts[4])||!(/^[1-9]\d*$/.test(parts[5])))throw Error('Invalid FEN position fields.');
  cells=next;$('pgn-editor-turn').value=parts[1];castles.forEach(c=>c.checked=parts[2].includes(c.value));$('pgn-editor-ep').value=parts[3];$('pgn-editor-half').value=parts[4];$('pgn-editor-full').value=parts[5];selected=null;render();sync();
 }
 function selectBrush(value){brush=value;selected=null;palette.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.brush===brush)));render()}
 function edit(sq){if(brush==='erase'){delete cells[sq]}else if(brush==='move'){if(selected){if(selected!==sq){cells[sq]=cells[selected];delete cells[selected]}selected=null;}else if(cells[sq]){selected=sq;render();return}}else cells[sq]=brush;render();sync()}
 function render(){const nodes=[];for(let i=0;i<64;i++){const file=flipped?7-i%8:i%8,rank=flipped?1+Math.floor(i/8):8-Math.floor(i/8),sq='abcdefgh'[file]+rank,p=cells[sq];const b=document.createElement('button');b.type='button';b.className='editor-square '+((file+rank)%2?'dark':'light')+(sq===selected?' selected':'');b.dataset.square=sq;b.setAttribute('aria-label',sq+(p?' '+(p===p.toUpperCase()?'white ':'black ')+name(p):' empty'));if(p)b.append(image(p));b.addEventListener('click',()=>edit(sq));b.addEventListener('contextmenu',e=>{e.preventDefault();delete cells[sq];selected=null;render();sync()});if(p){b.draggable=true;b.addEventListener('dragstart',e=>{e.dataTransfer.setData('application/x-ca-square',sq);e.dataTransfer.effectAllowed='move'})}b.addEventListener('dragover',e=>e.preventDefault());b.addEventListener('drop',e=>{e.preventDefault();const from=e.dataTransfer.getData('application/x-ca-square'),piece=e.dataTransfer.getData('application/x-ca-piece');if(from&&cells[from]&&from!==sq){cells[sq]=cells[from];delete cells[from]}else if(piece&&symbols.includes(piece))cells[sq]=piece;else return;selected=null;render();sync()});nodes.push(b)}board.replaceChildren(...nodes)}
 for(const p of ['move','erase',...symbols]){const b=document.createElement('button');b.type='button';b.dataset.brush=p;b.setAttribute('aria-pressed',String(p===brush));if(p.length===1){b.append(image(p));b.setAttribute('aria-label',(p===p.toUpperCase()?'White ':'Black ')+name(p));b.draggable=true;b.addEventListener('dragstart',e=>{e.dataTransfer.setData('application/x-ca-piece',p);e.dataTransfer.effectAllowed='copy'})}else b.textContent=p==='move'?'Move':'Eraser';b.addEventListener('click',()=>selectBrush(p));palette.append(b)}
 function readText(){if(dirty)loadFen(fenBox.value)}
 function valid(){readText();const f=buildFen(),test=new Chess(),result=test.validate_fen(f);if(!result.valid)throw Error(result.error||'Invalid FEN.');const pieces=Object.values(cells);if(pieces.filter(p=>p==='K').length!==1||pieces.filter(p=>p==='k').length!==1)throw Error('Place exactly one king for each side.');if(Object.entries(cells).some(([s,p])=>/[18]$/.test(s)&&/[pP]/.test(p)))throw Error('Pawns cannot be on the first or eighth rank.');const required={K:['e1','K','h1','R'],Q:['e1','K','a1','R'],k:['e8','k','h8','r'],q:['e8','k','a8','r']};for(const c of castles.filter(c=>c.checked)){const [a,k,b,r]=required[c.value];if(cells[a]!==k||cells[b]!==r)throw Error('Castling rights require the corresponding king and rook.')}if(!test.load(f))throw Error('Invalid FEN.');return f}
 function safe(fn){try{fn()}catch(e){inform(e.message)}}
 async function copy(text){try{await navigator.clipboard.writeText(text);inform('FEN copied.')}catch(_){inform('Clipboard unavailable. Select the FEN and copy it manually.');fenBox.select()}}
 $('pgn-open-editor').addEventListener('click',()=>safe(()=>{flipped=false;selectBrush('move');loadFen(window.pgnStudy.getFen());dialog.showModal()}));
 $('pgn-editor-close').addEventListener('click',()=>dialog.close());
 $('pgn-editor-start').addEventListener('click',()=>loadFen(start));
 $('pgn-editor-empty').addEventListener('click',()=>loadFen(empty));
 $('pgn-editor-flip').addEventListener('click',()=>{flipped=!flipped;render()});
 $('pgn-editor-paste').addEventListener('click',()=>safe(()=>loadFen(fenBox.value)));
 fenBox.addEventListener('input',()=>{dirty=true;inform('Load this FEN or open it directly in analysis.')});
 [$('pgn-editor-turn'),$('pgn-editor-ep'),$('pgn-editor-half'),$('pgn-editor-full'),...castles].forEach(c=>c.addEventListener('change',sync));
 $('pgn-editor-copy').addEventListener('click',()=>safe(()=>{readText();copy(buildFen())}));
 $('pgn-copy-fen').addEventListener('click',async()=>{const input=$('pgn-current-fen');if(!input.value)input.value=window.pgnStudy.getFen();try{await navigator.clipboard.writeText(input.value);$('pgn-copy-fen').textContent='Copied';setTimeout(()=>$('pgn-copy-fen').textContent='Copy FEN',1300)}catch(_){input.focus();input.select()}});
 $('pgn-editor-use').addEventListener('click',()=>safe(()=>{const fen=valid();window.pgnStudy.openPosition(fen);dialog.close();document.getElementById('bd').focus({preventScroll:true})}));
})();
