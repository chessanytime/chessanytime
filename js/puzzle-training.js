(() => {
  let mode="daily",library=null,queue=[],seen=new Set(),operation=0,nextTimer=null,active=null,loading=false;
  let wins=0,losses=0,accountId=null,pendingResult=null,practiceRating=null;
  const guestId="__guest__",guestMin=1000,guestMax=1300;
  const identity=()=>me?.id||guestId;
  const signedIn=()=>identity()!==guestId;
  const targetRating=()=>Math.max(100,Math.min(3500,Math.round((practiceRating??1500)+Number(element("practice-difficulty").value||0))));
  function selectionRange(){const target=targetRating();return signedIn()?[Math.max(0,target-125),Math.min(4000,target+125)]:[guestMin,guestMax]}
  function updateLevel(){element("practice-level").textContent=signedIn()?String(Math.round(practiceRating??1500)):"Easy · guest";}
  function updateScore(){element("practice-score").textContent=wins+" solved · "+losses+" missed";}
  async function choosePuzzle(excluded){if(!signedIn())return library.guest(guestMin,guestMax,excluded);return library.near(targetRating(),excluded);}
  function recordRating(won,rating){if(!signedIn()||!Number.isFinite(practiceRating))return;const expected=1/(1+10**((rating-practiceRating)/400));practiceRating=Math.max(100,Math.min(3500,practiceRating+32*((won?1:0)-expected)));}
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
    updateLevel();
    element("practice-giveup").disabled=false;
    element("practice-next").hidden=true;element("practice-next").disabled=false;
    message("");
  }
  async function prefetch(token){
    try{
      while(queue.length<5&&token===operation&&library&&!document.hidden){
        const excluded=new Set([...seen,...queue.map(puzzle=>puzzle.id)]);
        const puzzle=await choosePuzzle(excluded);
        if(token!==operation)return;
        queue.push(puzzle);renderQueue();
      }
    }catch(error){
      if(token===operation&&error.name!=="AbortError")console.warn("Puzzle prefetch:",error.message);
    }
  }
  async function begin(){
    if(library||loading||mode!=="practice")return;
    loading=true;element("practice-difficulty").disabled=true;const token=++operation;
    if(accountId!==identity()){wins=0;losses=0;seen.clear();accountId=identity();practiceRating=Number.isFinite(me?.perfs?.puzzle?.rating)?me.perfs.puzzle.rating:1500;element("practice-difficulty").value="0";}
    updateScore();updateLevel();
    element("practice-retry").hidden=true;
    placeholder("Loading puzzle…");message("");
    say("Loading your challenge…","","");
    const currentLibrary=new PuzzleLibrary();library=currentLibrary;
    try{
      await currentLibrary.open();
      const puzzle=await choosePuzzle(seen);
      if(token!==operation)return;
      activate(puzzle);
      void prefetch(token);
    }catch(error){
      if(token!==operation||error.name==="AbortError")return;
      currentLibrary.close();library=null;
      message(error.message,true);element("practice-retry").hidden=false;
      placeholder("Puzzle loading stopped. Try again below.");
    }finally{if(token===operation){loading=false;element("practice-difficulty").disabled=false;}}
  }
  function stop(){
    operation++;clearTimeout(nextTimer);nextTimer=null;pendingResult=null;
    library?.close();library=null;queue=[];active=null;loading=false;
    element("practice-giveup").disabled=true;element("practice-difficulty").disabled=false;
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
    element("practice-panel").hidden=!practice;
    element("practice-difficulty-wrap").hidden=!practice||!me;
    document.querySelector(".daily-bar").hidden=practice;
    const status=document.querySelector(".puzzle-status"),side=document.querySelector(".side");
    side.insertBefore(status,practice?element("practice-panel"):document.querySelector(".daily-bar").nextSibling);
    status.hidden=false;
    element("puzzle-intro").textContent=practice?(me?"A fresh challenge, adapted to your level.":"Enjoy easy puzzles without an account."):"Solve today’s Lichess puzzle.";
    if(practice)side.append(element("practice-signin"));
    const url=new URL(location.href);url.searchParams.set("mode",mode);history.replaceState(null,"",url);updateNavigation();
    if(!practice){element("bd").classList.remove("is-empty");loadDaily()}
    else void begin();
  }
  async function advance(token){
      if(token!==operation||!library||!pendingResult||document.hidden||loading)return;
      loading=true;element("practice-next").disabled=true;element("practice-difficulty").disabled=true;
      try{
        const [min,max]=selectionRange();
        const eligible=queue.filter(puzzle=>puzzle.rating>=min&&puzzle.rating<=max&&!seen.has(puzzle.id));
        const puzzle=eligible.length?eligible[Math.floor(Math.random()*eligible.length)]:await choosePuzzle(seen);
        if(token!==operation)return;
        queue=[];renderQueue();activate(puzzle);pendingResult=null;void prefetch(token);
      }catch(error){
        if(token===operation&&error.name!=="AbortError"){message(error.message,true);element("practice-next").disabled=false}
      }finally{if(token===operation){loading=false;element("practice-difficulty").disabled=false;}}
  }
  document.addEventListener("puzzle-result",event=>{
    if(mode!=="practice"||!library||event.detail.puzzle!==active||pendingResult)return;
    ++operation;const won=event.detail.won;
    pendingResult={won};
    if(won)wins++;else losses++;
    recordRating(won,active.rating);updateLevel();updateScore();
    element("practice-giveup").disabled=true;
    element("practice-next").hidden=false;element("practice-next").disabled=false;
  });
  element("practice-giveup").addEventListener("click",()=>{if(active&&!done)giveUpPuzzle()});
  element("practice-next").addEventListener("click",()=>void advance(operation));
  element("practice-difficulty").addEventListener("change",()=>{queue=[];++operation;loading=false;element("practice-next").disabled=false;if(library&&active&&!done&&!document.hidden)void prefetch(operation);});
  element("practice-retry").addEventListener("click",()=>{stop();void begin()});
  element("mode-practice").addEventListener("click",()=>setMode("practice"));
  element("mode-daily").addEventListener("click",()=>setMode("daily"));
  document.addEventListener("lichess-session-change",()=>{
    if(mode!=="practice")return;
    if(accountId!==identity())setMode("practice");
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden&&mode==="practice"){
      operation++;clearTimeout(nextTimer);library?.close();loading=false;element("practice-next").disabled=false;element("practice-difficulty").disabled=false;
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
