let g,cur,idx=0,sel,last,flip=false,done=false,failed=false,hintSq,themeRevealed=false;
let boardMarks=[],userBoardMarks=[],activeGesture=null,puzzleWaiting=false,puzzleReplyTimer=null,puzzleGeneration=0,dailyRequest=null;
const today=()=>{const t=localDate();let l=0;PUZZLES.forEach((p,i)=>{if(p.date<=t)l=i});return l};
function load(i){if(!PUZZLES[i])return;cur=PUZZLES[i];startPuzzle()}
function cancelPuzzle(){
 clearTimeout(puzzleReplyTimer);puzzleReplyTimer=null;puzzleGeneration++;
 dailyRequest?.abort();dailyRequest=null;puzzleWaiting=false;done=false;
 document.getElementById('promotion-dialog')?.close();
 g=null;cur=null;sel=null;activeGesture=null;boardMarks=[];userBoardMarks=[];clearGhost();resetPuzzleFeedback();
 $('#bd').replaceChildren();
}
function startPuzzle(){
 clearTimeout(puzzleReplyTimer);puzzleReplyTimer=null;puzzleGeneration++;
 document.getElementById('promotion-dialog')?.close();
 g=new Chess(cur.fen);idx=0;sel=null;last=null;done=false;failed=false;hintSq=null;themeRevealed=false;
 resetPuzzleFeedback();
 const dailyGiveup=document.getElementById('daily-giveup');if(dailyGiveup)dailyGiveup.hidden=!cur.daily;
 boardMarks=[];userBoardMarks=[];activeGesture=null;puzzleWaiting=false;clearGhost();flip=g.turn()==='b';cur.side0=g.turn();
 say('Your turn','','Find the best move for '+(g.turn()==='w'?'white':'black')+(cur.practice?'':' · Rating '+cur.rating));
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
  cur={fen,moves:p.solution,rating:p.rating||'Daily',theme:(p.themes||[]).join(' ')||'Daily challenge',daily:true,id:p.id};
  startPuzzle();
  if(info)info.textContent='Today’s puzzle · Rating '+cur.rating;
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
function resetPuzzleFeedback(){
 const themes=document.getElementById('puzzle-themes'),source=document.getElementById('practice-source'),solution=document.getElementById('puzzle-solution'),hint=document.getElementById('bh');
 if(themes){themes.hidden=true;themes.textContent=''}if(source){source.hidden=true;source.removeAttribute('href')}if(solution){solution.hidden=true;solution.textContent=''}if(hint)hint.disabled=false;const dailyGiveup=document.getElementById('daily-giveup');if(dailyGiveup){dailyGiveup.hidden=true;dailyGiveup.disabled=false;}
}
function revealPuzzleThemes(){
 themeRevealed=true;const el=document.getElementById('puzzle-themes');if(!el||!cur)return;
 const themes=String(cur.theme||'').split(/[\s,]+/).filter(Boolean).map(x=>x.replace(/([a-z])([A-Z])/g,'$1 $2'));
 el.textContent=themes.length?'Themes: '+themes.join(' · '):'Themes unavailable';el.hidden=false;
}
function revealPuzzleAnalysis(){
 const a=document.getElementById('practice-source');if(!a||!cur||!g)return;
 a.href='https://lichess.org/analysis/standard/'+g.fen().replace(/ /g,'_')+'?color='+(cur.side0==='w'?'white':'black');a.hidden=false;
}
function finishPuzzle(won){
 if(done)return;
 done=true;puzzleWaiting=false;sel=null;hintSq=null;boardMarks=[];
 const hint=document.getElementById('bh');if(hint)hint.disabled=true;const dailyGiveup=document.getElementById('daily-giveup');if(dailyGiveup)dailyGiveup.disabled=true;
 say(won?'Puzzle complete!':'Solution revealed',won?'ok':'no',won?(failed?'Solved after a mistake. Review or continue when ready.':'Well played!'):'Review the solution before continuing.');
 draw();
 document.dispatchEvent(new CustomEvent('puzzle-result',{detail:{won:won&&!failed,solved:won,puzzle:cur}}));
}
function giveUpPuzzle(){
 if(!cur||!g||done)return;
 clearTimeout(puzzleReplyTimer);puzzleReplyTimer=null;puzzleGeneration++;puzzleWaiting=false;failed=true;
 revealPuzzleAnalysis();
 const san=[];while(idx<cur.moves.length){const u=cur.moves[idx],m=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]});if(!m)break;san.push(m.san);last=[m.from,m.to];idx++}
 const el=document.getElementById('puzzle-solution');if(el){el.textContent='Remaining solution: '+san.join(' ');el.hidden=false}
 finishPuzzle(false);
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
 const previousLast=last;
 const move=g.move({from,to,promotion});sel=null;hintSq=null;
 if(!move)return;
 last=[from,to];
 const uci=from+to+(move.promotion||''),expected=cur.moves[idx];
 if(uci!==expected&&!g.in_checkmate()){
  g.undo();failed=true;last=previousLast;revealPuzzleAnalysis();
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
 sel=null;hintSq=expected.slice(0,2);boardMarks=[];revealPuzzleThemes();
 say('Hint','','Find the best move with the highlighted piece.');draw();
}
function say(text,className,message){
 $('#st').textContent=text;$('#st').className=className;$('#mt').textContent=message;
}
document.getElementById('bh')?.addEventListener('click',showPuzzleHint);
document.getElementById('daily-giveup')?.addEventListener('click',giveUpPuzzle);
document.getElementById('daily-load')?.addEventListener('click',loadDaily);
document.getElementById('promotion-close')?.addEventListener('click',()=>document.getElementById('promotion-dialog').close());
