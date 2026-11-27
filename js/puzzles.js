let g,cur,idx=0,sel,last,flip=false,done=false,failed=false,hintSq;
let boardMarks=[],userBoardMarks=[],activeGesture=null,puzzleWaiting=false,puzzleReplyTimer=null,puzzleGeneration=0,dailyRequest=null;
const today=()=>{const t=localDate();let l=0;PUZZLES.forEach((p,i)=>{if(p.date<=t)l=i});return l};
function load(i){if(!PUZZLES[i])return;cur=PUZZLES[i];startPuzzle()}
function cancelPuzzle(){
 clearTimeout(puzzleReplyTimer);puzzleReplyTimer=null;puzzleGeneration++;
 dailyRequest?.abort();dailyRequest=null;puzzleWaiting=false;done=false;
 document.getElementById('promotion-dialog')?.close();
 g=null;cur=null;sel=null;activeGesture=null;boardMarks=[];userBoardMarks=[];clearGhost();
 $('#bd').replaceChildren();
}
function startPuzzle(){
 clearTimeout(puzzleReplyTimer);puzzleReplyTimer=null;puzzleGeneration++;
 document.getElementById('promotion-dialog')?.close();
 g=new Chess(cur.fen);idx=0;sel=null;last=null;done=false;failed=false;hintSq=null;
 boardMarks=[];userBoardMarks=[];activeGesture=null;puzzleWaiting=false;clearGhost();flip=g.turn()==='b';cur.side0=g.turn();
 say('Your turn','','Find the best move for '+(g.turn()==='w'?'white':'black')+(cur.practice?'':' · Rating '+cur.rating+' · '+cur.theme));
 draw();
}
async function loadDaily(){
 cancelPuzzle();
 const info=$('#daily-info'),button=$('#daily-load'),request=new AbortController(),generation=puzzleGeneration;
 dailyRequest=request;
 if(info)info.textContent='Loading today’s Lichess puzzle…';
 if(button)button.disabled=true;
 say('Loading puzzle…','','Fetching the daily challenge from Lichess.');
 try{
  const res=await fetch('https://lichess.org/api/puzzle/daily',{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.any([request.signal,AbortSignal.timeout(30000)])});
  if(!res.ok)throw new Error('Lichess returned '+res.status);
  const data=await res.json(),p=data.puzzle;
  if(!p||!Array.isArray(p.solution)||!p.solution.length||!data.game?.pgn||!Number.isInteger(p.initialPly))throw new Error('Lichess returned incomplete puzzle data');
  const fullGame=new Chess();
  if(!fullGame.load_pgn(data.game.pgn))throw new Error('Could not read the puzzle game PGN');
  const history=fullGame.history({verbose:true});
  if(p.initialPly<0||p.initialPly>=history.length)throw new Error('Invalid puzzle starting ply');
  const position=new Chess();
  for(const move of history.slice(0,p.initialPly+1)){
   if(!position.move({from:move.from,to:move.to,promotion:move.promotion}))throw new Error('Could not reconstruct puzzle position');
  }
  const fen=position.fen();
  for(const uci of p.solution){
   if(typeof uci!=='string'||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)||!position.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]}))throw new Error('Puzzle solution contains an illegal move');
  }
  if(request.signal.aborted||generation!==puzzleGeneration)return;
  dailyRequest=null;
  cur={fen,moves:p.solution,rating:p.rating||'Daily',theme:(p.themes||[]).slice(0,3).join(', ')||'Daily challenge',daily:true,id:p.id};
  startPuzzle();
  if(info)info.textContent='Today’s puzzle · Rating '+cur.rating+' · '+cur.theme;
 }catch(error){
  if(request.signal.aborted||generation!==puzzleGeneration)return;
  console.error('Lichess daily puzzle error:',error);
  say('Daily puzzle unavailable','no','Try again, or open the daily puzzle on Lichess.');
  if(info)info.textContent='Could not load the daily puzzle: '+error.message;
 }finally{
  if(dailyRequest===request||dailyRequest===null){if(button)button.disabled=false}
  if(dailyRequest===request)dailyRequest=null;
 }
}
function finishPuzzle(won){
 done=true;puzzleWaiting=false;
 say(won?'Puzzle complete!':'Not quite this time',won?'ok':'no',cur.practice?
  (won?'Finding a slightly harder puzzle…':'Finding an easier puzzle…'):(failed?'Solved with help':'Well played!'));
 draw();
 document.dispatchEvent(new CustomEvent('puzzle-result',{detail:{won,puzzle:cur}}));
}
function requestPromotion(from,to,moves){
 const dialog=document.getElementById('promotion-dialog');
 if(!dialog){say('Promotion required','no','This board is missing its promotion control.');return}
 const generation=puzzleGeneration;
 dialog.querySelectorAll('[data-promotion]').forEach(button=>{
  button.disabled=!moves.some(move=>move.promotion===button.dataset.promotion);
  button.onclick=()=>{
   dialog.close();
   if(generation===puzzleGeneration)play(from,to,button.dataset.promotion);
  };
 });
 dialog.showModal();
}
function play(from,to,promotion){
 if(!g||done||puzzleWaiting||g.turn()!==cur.side0)return;
 const legal=g.moves({square:from,verbose:true}).filter(move=>move.to===to);
 if(!legal.length)return;
 if(!promotion&&legal.some(move=>move.promotion)){requestPromotion(from,to,legal);return}
 if(window.pgnStudy){window.pgnStudy.play(from,to,promotion);return}
 const move=g.move({from,to,promotion});sel=null;
 if(!move)return;
 last=[from,to];
 const uci=from+to+(move.promotion||''),expected=cur.moves[idx];
 if(uci!==expected&&!g.in_checkmate()){
  g.undo();failed=true;last=null;
  if(cur.practice){finishPuzzle(false);return}
  say('That’s not the move!','no','Try something else');
  $('#bd').classList.remove('shake');void $('#bd').offsetWidth;$('#bd').classList.add('shake');
  draw();return;
 }
 window.boardSound?.(move);
 idx++;
 if(idx>=cur.moves.length||g.in_checkmate()){finishPuzzle(true);return}
 puzzleWaiting=true;
 say('Best move!','ok','Your opponent is replying…');draw();
 const generation=puzzleGeneration;
 puzzleReplyTimer=setTimeout(()=>{
  if(generation!==puzzleGeneration||!cur)return;
  const reply=cur.moves[idx],result=g.move({from:reply.slice(0,2),to:reply.slice(2,4),promotion:reply[4]});
  if(!result){done=true;puzzleWaiting=false;say('Invalid puzzle','no','The stored reply is illegal. Please load another puzzle.');draw();return}
  window.boardSound?.(result);
  idx++;last=[result.from,result.to];puzzleWaiting=false;
  if(idx>=cur.moves.length){finishPuzzle(true);return}
  say('Your turn','','Find the next best move');draw();
 },450);
}
function showPuzzleHint(){
 if(!g||done||puzzleWaiting)return;
 if(window.pgnStudy){window.pgnStudy.hint();return}
 const expected=cur.moves[idx];
 if(!expected)return;
 hintSq=expected.slice(0,2);boardMarks=[{from:expected.slice(0,2),to:expected.slice(2,4),col:'b'}];
 say('Move hint','','The arrow shows the next move.');draw();
}
function say(text,className,message){
 $('#st').textContent=text;$('#st').className=className;$('#mt').textContent=message;
}
document.getElementById('bh')?.addEventListener('click',showPuzzleHint);
document.getElementById('daily-load')?.addEventListener('click',loadDaily);
document.getElementById('promotion-close')?.addEventListener('click',()=>document.getElementById('promotion-dialog').close());
