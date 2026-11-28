(() => {
  let mode="daily",library=null,queue=[],seen=new Set(),operation=0,nextTimer=null,active=null,loading=false;
  let wins=0,losses=0,accountId=null,pendingResult=null;
  const element=id=>document.getElementById(id);
  function message(text,error=false){
    element("library-status").textContent=text;
    element("library-status").classList.toggle("is-error",error);
  }
  function placeholder(text){
    const board=element("bd"),copy=document.createElement("p");
    copy.textContent=text;board.classList.add("is-empty");board.replaceChildren(copy);
  }
  function renderQueue(){ /* Prefetch is deliberately invisible. */ }
  function prepare(puzzle){
    const position=new Chess(puzzle.fen),moves=[...puzzle.moves];
    if(puzzle.setup){
      const first=moves.shift();
      if(!position.move({from:first.slice(0,2),to:first.slice(2,4),promotion:first[4]}))throw new Error("Puzzle "+puzzle.id+" has an illegal setup move.");
    }
    if(!moves.length||position.game_over())throw new Error("Puzzle "+puzzle.id+" has no playable position.");
    const fen=position.fen();
    for(const move of moves){
      if(!position.move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]}))throw new Error("Puzzle "+puzzle.id+" has an illegal solution move.");
    }
    return {...puzzle,fen,moves};
  }
  function activate(puzzle){
    const prepared=prepare(puzzle);
    seen.add(puzzle.id);active=prepared;cur=prepared;
    element("bd").classList.remove("is-empty");
    startPuzzle();
    element("practice-level").textContent=puzzle.rating;
    element("practice-giveup").disabled=false;
    element("practice-next").hidden=true;element("practice-next").disabled=false;
    message("");
  }
  async function prefetch(token){
    try{
      while(queue.length<5&&token===operation&&library&&!document.hidden){
        const excluded=new Set([...seen,...queue.map(puzzle=>puzzle.id)]);
        const puzzle=await library.next(active.rating,0,excluded);
        if(token!==operation)return;
        queue.push(puzzle);renderQueue();
      }
    }catch(error){
      if(token===operation&&error.name!=="AbortError")message("More puzzles could not be loaded: "+error.message,true);
    }
  }
  async function begin(){
    if(library||loading||mode!=="practice"||!me)return;
    loading=true;const token=++operation;
    if(accountId!==me.id){wins=0;losses=0;seen.clear();accountId=me.id}
    element("practice-score").textContent=wins+" solved · "+losses+" missed";
    element("practice-retry").hidden=true;
    placeholder("Loading your next challenge…");message("Loading a small batch at your level…");
    say("Loading your challenge…","","Fetching a small batch at your level.");
    const currentLibrary=new PuzzleLibrary();library=currentLibrary;
    try{
      await currentLibrary.open();
      const rating=Number.isFinite(me.perfs?.puzzle?.rating)?me.perfs.puzzle.rating:1500;
      const puzzle=await currentLibrary.next(rating,0,seen);
      if(token!==operation)return;
      activate(puzzle);
      void prefetch(token);
    }catch(error){
      if(token!==operation||error.name==="AbortError")return;
      currentLibrary.close();library=null;
      message(error.message,true);element("practice-retry").hidden=false;
      placeholder("Puzzle loading stopped. Try again below.");
    }finally{if(token===operation)loading=false}
  }
  function stop(){
    operation++;clearTimeout(nextTimer);nextTimer=null;pendingResult=null;
    library?.close();library=null;queue=[];active=null;loading=false;
    element("practice-giveup").disabled=true;
    element("practice-next").hidden=true;element("practice-next").disabled=false;
    renderQueue();cancelPuzzle();
  }
  function setMode(next){
    stop();mode=next;
    const practice=mode==="practice";
    element("puzzles").classList.toggle("is-practice",practice);
    element("mode-practice").setAttribute("aria-pressed",String(practice));
    element("mode-daily").setAttribute("aria-pressed",String(!practice));
    element("practice-signin").hidden=!practice||!!me;
    element("practice-panel").hidden=!practice||!me;
    document.querySelector(".daily-bar").hidden=practice;
    const status=document.querySelector(".puzzle-status"),side=document.querySelector(".side");
    side.insertBefore(status,practice?element("practice-panel"):document.querySelector(".daily-bar").nextSibling);
    status.hidden=practice&&!me;
    element("puzzle-intro").textContent=practice?"A fresh challenge, adapted to your level.":"Solve today’s Lichess puzzle.";
    const url=new URL(location.href);url.searchParams.set("mode",mode);history.replaceState(null,"",url);updateNavigation();
    if(!practice){element("bd").classList.remove("is-empty");loadDaily()}
    else if(me)void begin();
    else{placeholder("Log in with Lichess to practise.");say("Log in to practise","","The daily puzzle is available without logging in.")}
  }
  async function advance(token){
      if(token!==operation||!library||!pendingResult||document.hidden||loading)return;
      loading=true;element("practice-next").disabled=true;
      const {won,previous}=pendingResult;
      try{
        const eligible=queue.filter(puzzle=>won?puzzle.rating>=previous+25&&puzzle.rating<=previous+150:puzzle.rating>=previous-150&&puzzle.rating<=previous-25);
        const puzzle=eligible.length?eligible[Math.floor(Math.random()*eligible.length)]:await library.next(previous,won?1:-1,seen);
        if(token!==operation)return;
        queue=[];renderQueue();activate(puzzle);pendingResult=null;void prefetch(token);
      }catch(error){
        if(token===operation&&error.name!=="AbortError"){message(error.message,true);element("practice-next").disabled=false}
      }finally{if(token===operation)loading=false}
  }
  document.addEventListener("puzzle-result",event=>{
    if(mode!=="practice"||!library||event.detail.puzzle!==active||pendingResult)return;
    ++operation;const won=event.detail.won;
    pendingResult={won,previous:active.rating};
    if(won)wins++;else losses++;
    element("practice-score").textContent=wins+" solved · "+losses+" missed";
    element("practice-giveup").disabled=true;
    element("practice-next").hidden=false;element("practice-next").disabled=false;
  });
  element("practice-giveup").addEventListener("click",()=>{if(active&&!done)giveUpPuzzle()});
  element("practice-next").addEventListener("click",()=>void advance(operation));
  element("practice-retry").addEventListener("click",()=>{stop();void begin()});
  element("mode-practice").addEventListener("click",()=>setMode("practice"));
  element("mode-daily").addEventListener("click",()=>setMode("daily"));
  document.addEventListener("lichess-session-change",()=>{
    if(mode!=="practice")return;
    if(!me){stop();element("practice-panel").hidden=true;element("practice-signin").hidden=false;document.querySelector(".puzzle-status").hidden=true;placeholder("Log in with Lichess to practise.")}
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden&&mode==="practice"){
      operation++;clearTimeout(nextTimer);library?.close();loading=false;element("practice-next").disabled=false;
    }else if(mode==="practice"&&library){
      library.controller=new AbortController();
      if(active&&!done)void prefetch(operation);
      else if(pendingResult){element("practice-next").hidden=false;element("practice-next").disabled=false;}
      else{stop();void begin()}
    }
  });
  addEventListener("pagehide",stop);
  addEventListener("pageshow",event=>{if(event.persisted)setMode(mode)});
  lichessReady.then(()=>setMode(new URLSearchParams(location.search).get("mode")==="practice"?"practice":"daily"));
})();
