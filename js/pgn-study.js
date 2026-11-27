(() => {
  const element=id=>document.getElementById(id);
  let worker=null,entries=[],filtered=[],active=null,request=0,mode="practice",player="w",branch=false;
  let importErrors=0,renderStart=-1;
  let pinPreference=true;
  let sizeGesture=null;
  function sizeBoard(){
    const root=element("pgn"),header=document.querySelector("header"),layout=document.querySelector(".pgn-layout");
    root.style.setProperty("--pgn-sticky-top",Math.ceil(header.getBoundingClientRect().height+4)+"px");
    const frame=document.querySelector(".board-frame"),tools=document.querySelector(".pgn-board-tools");
    const layoutTop=layout.getBoundingClientRect().top+scrollY,width=layout.clientWidth;
    const available=Math.max(64,Math.floor(innerHeight-layoutTop-frame.offsetTop-tools.getBoundingClientRect().height-document.querySelector(".pgn-footer").getBoundingClientRect().height-8));
    const focused=root.classList.contains("pgn-focused"),desktop=innerWidth>900&&!focused,tablet=innerWidth>700&&!desktop&&!focused;
    const limit=Math.max(64,width-(desktop?328:tablet?174:0)),fit=Math.min(limit,available);
    const percent=Number(element("pgn-size").value);
    const requested=Math.round(fit*percent/100),actual=Math.min(limit,requested),canPin=innerWidth>700&&actual<=available;
    const remaining=width-actual-(desktop?8:4);
    const left=desktop?Math.max(150,Math.floor(remaining*.46)):tablet?remaining:0;
    root.style.setProperty("--pgn-left-width",left+"px");
    root.style.setProperty("--pgn-right-width",(desktop?remaining-left:0)+"px");
    root.style.setProperty("--pgn-board-height",actual+"px");
    root.style.setProperty("--pgn-panel-height",Math.max(96,Math.min(frame.offsetTop+actual,innerHeight-layoutTop-4))+"px");
    element("pgn-size-value").textContent=percent+"%"+(requested>limit?" · max width":"");
    element("pgn-sticky").disabled=!canPin;
    element("pgn-sticky").checked=canPin&&pinPreference;
    element("pgn-sticky").title=canPin?"Keep the board visible while scrolling":"Use Fit screen to pin the full board.";
    root.classList.toggle("pgn-pinned",canPin&&pinPreference);
  }
  function placeSizeControl(focus){
    const control=element("pgn-size-control");
    if(focus)document.querySelector(".pgn-board-panel").insertBefore(control,document.querySelector(".board-frame"));
    else document.querySelector(".pgn-play-panel").insertBefore(control,element("pgn-play-settings"));
  }
  let sizeFrame=0;
  const layoutObserver=new ResizeObserver(()=>{
    if(sizeFrame)return;
    sizeFrame=requestAnimationFrame(()=>{sizeFrame=0;sizeBoard()});
  });
  ["header",".pgn-heading","#pgn-game-title","#pgn-game-detail",".pgn-board-tools"].forEach(selector=>{
    layoutObserver.observe(document.querySelector(selector));
  });
  addEventListener("resize",sizeBoard);
  layoutObserver.observe(document.querySelector(".pgn-layout"));
  const listObserver=new ResizeObserver(()=>renderList(true));
  listObserver.observe(element("pgn-game-list"));
  document.fonts.ready.then(sizeBoard);
  function status(text,error=false){
    element("pgn-status").textContent=text;element("pgn-status").classList.toggle("is-error",error);
  }
  function startWorker(){
    worker=new Worker("js/pgn-worker.js");
    worker.addEventListener("message",event=>{
      const message=event.data;
      if(message.type==="games"){
        entries.push(...message.games);filterGames();
        if(!active&&entries.length)select(entries[0].id);
      }else if(message.type==="progress"){
        status("Reading "+message.file+" · "+Math.round(message.bytes/message.size*100)+"% · "+message.total.toLocaleString()+" games ready");
      }else if(message.type==="parse-error"){
        importErrors++;
        const item=document.createElement("li");
        item.textContent=message.file+(message.game?" · Game "+message.game:"")+": "+message.message;
        element("pgn-errors").appendChild(item);
        element("pgn-import-errors").hidden=false;
      }else if(message.type==="complete"){
        status(message.total.toLocaleString()+" games loaded"+(importErrors?" · "+importErrors+" invalid games excluded (see import details)":"")+" · Files stay in your browser.",importErrors>0);
      }else if(message.type==="selected"&&message.request===request){
        const firstGame=!active;
        active=message.game;branch=false;player=element("pgn-side").value==="auto"?new Chess(active.start).turn():element("pgn-side").value;
        cur={fen:active.start,moves:active.moves.map(move=>move.uci),side0:player,pgn:true};
        element("pgn-game-title").textContent=active.title;
        element("pgn-game-detail").textContent=[active.event,active.date,active.result].filter(Boolean).join(" · ");
        element("pgn-placeholder").hidden=true;
        element("pgn").classList.add("pgn-has-game");
        if(firstGame)element("pgn-import-panel").open=false;
        element("bd").classList.remove("is-empty");
        startPuzzle();flip=player==="b";renderMoves();seek(0);renderList(true);
        element("bd").focus({preventScroll:true});
        if(innerWidth<=700)document.querySelector(".pgn-board-panel").scrollIntoView({block:"start"});
      }else if(message.type==="select-error"&&message.request===request)status(message.message,true);
    });
    worker.addEventListener("error",event=>{status("PGN importer failed: "+event.message,true)});
  }
  function filterGames(){
    const search=element("pgn-search").value.trim().toLowerCase();
    filtered=search?entries.filter(game=>(game.title+" "+game.file+" "+game.event).toLowerCase().includes(search)):entries;
    element("pgn-count").textContent=entries.length.toLocaleString()+" games";
    element("pgn-spacer").style.height=filtered.length*64+"px";
    renderStart=-1;renderList(true);
  }
  function renderList(force=false){
    const viewport=element("pgn-game-list"),start=Math.max(0,Math.floor(viewport.scrollTop/64)-2);
    if(!force&&start===renderStart)return;
    renderStart=start;
    const amount=Math.ceil(viewport.clientHeight/64)+5;
    const items=filtered.slice(start,start+amount).map(game=>{
      const button=document.createElement("button"),title=document.createElement("strong"),subtitle=document.createElement("span");
      button.type="button";button.className="pgn-game";button.dataset.game=game.id;
      button.setAttribute("aria-pressed",String(game.id===active?.id));
      title.textContent=game.title;subtitle.textContent=game.file+" · Game "+game.number+" · "+Math.ceil(game.plies/2)+" moves";
      button.title=game.title+"\n"+subtitle.textContent+"\n"+[game.event,game.date].filter(Boolean).join(" · ");
      button.append(title,subtitle);button.addEventListener("click",()=>select(game.id));return button;
    });
    const window=element("pgn-game-window");
    window.style.top=start*64+"px";window.replaceChildren(...items);
  }
  function select(id){
    clearTimeout(puzzleReplyTimer);puzzleWaiting=true;puzzleGeneration++;request++;
    worker.postMessage({type:"select",id,request});
  }
  function renderMoves(){
    const moves=active.moves.map((move,index)=>{
      const button=document.createElement("button");
      button.type="button";button.textContent=(index%2===0?Math.floor(index/2)+1+". ":"")+move.san;
      button.dataset.ply=index;button.addEventListener("click",()=>{
        mode="replay";element("pgn-mode").value=mode;seek(index+1);
      });
      return button;
    });
    element("pgn-moves").replaceChildren(...moves);
  }
  function update(){
    cur.side0=mode==="practice"?player:g.turn();
    done=mode!=="analysis"&&idx>=active.moves.length;
    const next=active.moves[idx];
    say(done?"Main line complete":(g.turn()==="w"?"White":"Black")+" to move",done?"ok":"",
      branch?"Analysis branch · Reset to return to the PGN.":mode==="practice"?"Play the next move. The opponent replies automatically.":mode==="replay"?"Step through the game or enter its next move.":"Explore any legal move. No engine evaluation is running.");
    element("pgn-next").disabled=puzzleWaiting||done||branch;
    element("pgn-prev").disabled=puzzleWaiting||idx===0;
    element("pgn-board-next").disabled=element("pgn-next").disabled;
    element("pgn-board-prev").disabled=element("pgn-prev").disabled;
    element("pgn-focus").disabled=false;
    element("pgn-board-status").textContent=element("st").textContent+" · "+idx+" / "+active.moves.length+" half-moves";
    element("pgn-hint").disabled=puzzleWaiting||done||branch||!next;
    element("pgn-progress").textContent=branch?"Analysis branch":idx+" / "+active.moves.length+" half-moves";
    element("pgn-side").hidden=mode!=="practice";
    element("pgn-side-field").hidden=mode!=="practice";
    document.querySelector(".pgn-side-label").hidden=mode!=="practice";
    element("pgn-moves").querySelectorAll("button").forEach(button=>{
      const ply=Number(button.dataset.ply);
      button.classList.toggle("is-played",ply<idx);button.classList.toggle("is-current",ply===idx-1);
      if(ply===idx-1)button.setAttribute("aria-current","step");else button.removeAttribute("aria-current");
    });
    draw();
  }
  function seek(ply,automaticReply=true){
    if(!active)return;
    clearTimeout(puzzleReplyTimer);puzzleReplyTimer=null;puzzleWaiting=false;puzzleGeneration++;branch=false;
    document.getElementById("promotion-dialog").close();
    const checkpoint=active.checkpoints[Math.floor(ply/16)]||active.checkpoints[0];
    g=new Chess(checkpoint.fen);
    for(let i=checkpoint.ply;i<ply;i++){
      const uci=active.moves[i].uci;
      if(!g.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})){status("Could not replay this position.",true);return}
    }
    idx=ply;sel=null;hintSq=null;boardMarks=[];last=null;done=false;
    if(ply){const uci=active.moves[ply-1].uci;last=[uci.slice(0,2),uci.slice(2,4)]}
    update();
    if(automaticReply&&mode==="practice"&&g.turn()!==player&&!done)reply();
  }
  function applyNext(){
    if(!active||puzzleWaiting||branch||idx>=active.moves.length)return;
    const uci=active.moves[idx].uci;
    if(!g.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})){status("The PGN contains an illegal move.",true);return}
    idx++;last=[uci.slice(0,2),uci.slice(2,4)];sel=null;
    boardMarks=[];update();
  }
  function reply(){
    if(!active||done||g.turn()===player)return;
    puzzleWaiting=true;update();
    const generation=puzzleGeneration;
    puzzleReplyTimer=setTimeout(()=>{
      if(generation!==puzzleGeneration)return;
      puzzleWaiting=false;applyNext();
    },450);
  }
  window.pgnStudy={
    play(from,to,promotion){
      if(!active||puzzleWaiting)return;
      const move=g.move({from,to,promotion});sel=null;
      if(!move)return;
      const uci=from+to+(move.promotion||""),expected=active.moves[idx]?.uci;
      if(mode!=="analysis"&&uci!==expected){
        g.undo();say("Try another move","no","Follow the PGN main line, or switch to Analysis to explore.");draw();return;
      }
      if(mode==="analysis"&&(branch||uci!==expected))branch=true;else idx++;
      last=[from,to];boardMarks=[];update();
      if(mode==="practice")reply();
    },
    hint(){
      const move=active?.moves[idx];if(!move||branch)return;
      boardMarks=[{from:move.uci.slice(0,2),to:move.uci.slice(2,4),col:"g"}];
      say("Next move: "+move.san,"","The arrow shows the move from this PGN.");draw();
    }
  };
  element("pgn-files").addEventListener("change",event=>{
    const files=[...event.target.files];
    if(!files.length)return;
    status("Importing "+files.length+" file(s) in the background…");
    worker.postMessage({type:"import",files});event.target.value="";
    event.target.blur();
    if(active)element("bd").focus({preventScroll:true});
  });
  element("pgn-search").addEventListener("input",()=>{element("pgn-game-list").scrollTop=0;filterGames()});
  element("pgn-game-list").addEventListener("scroll",()=>renderList());
  element("pgn-mode").addEventListener("change",()=>{
    mode=element("pgn-mode").value;if(active){seek(idx);element("bd").focus({preventScroll:true})}
  });
  element("pgn-side").addEventListener("change",()=>{
    if(!active)return;player=element("pgn-side").value==="auto"?new Chess(active.start).turn():element("pgn-side").value;
    flip=player==="b";
    seek(idx);
    element("bd").focus({preventScroll:true});
  });
  element("pgn-next").addEventListener("click",()=>{applyNext();if(mode==="practice")reply()});
  element("pgn-prev").addEventListener("click",()=>seek(Math.max(0,idx-1),false));
  element("pgn-reset").addEventListener("click",()=>seek(0));
  element("pgn-hint").addEventListener("click",()=>window.pgnStudy.hint());
  element("pgn-flip").addEventListener("click",()=>{if(g){flip=!flip;draw()}});
  element("pgn-board-next").addEventListener("click",()=>element("pgn-next").click());
  element("pgn-board-prev").addEventListener("click",()=>element("pgn-prev").click());
  element("pgn-sticky").addEventListener("change",()=>{
    pinPreference=element("pgn-sticky").checked;sizeBoard();
  });
  element("pgn-focus").addEventListener("click",()=>{
    const focus=element("pgn").classList.toggle("pgn-focused");
    element("pgn-focus").setAttribute("aria-pressed",String(focus));
    element("pgn-focus").textContent=focus?"Show panels":"Focus board";
    placeSizeControl(focus);
    sizeBoard();element("bd").focus({preventScroll:true});
  });
  element("pgn-size").addEventListener("input",sizeBoard);
  // Keep the native slider under the pointer while its side panel resizes.
  element("pgn-size").addEventListener("pointerdown",event=>{
    if(event.button!==0||sizeGesture)return;
    const input=event.currentTarget,rect=input.getBoundingClientRect(),placeholder=document.createElement("span");
    placeholder.style.cssText="flex:1;min-width:0;height:24px";placeholder.setAttribute("aria-hidden","true");
    input.before(placeholder);sizeGesture={input,placeholder,style:input.getAttribute("style"),pointerId:event.pointerId};
    input.style.cssText="position:fixed;left:"+rect.left+"px;top:"+rect.top+"px;width:"+rect.width+"px;height:"+rect.height+"px;z-index:20;flex:none";
  });
  function finishSizeGesture(immediate=false){
    const gesture=sizeGesture;if(!gesture)return;
    const restore=()=>{
      if(sizeGesture!==gesture)return;
      if(gesture.style===null)gesture.input.removeAttribute("style");else gesture.input.setAttribute("style",gesture.style);
      gesture.placeholder.remove();sizeGesture=null;
      if(!immediate)element("bd").focus({preventScroll:true});
    };
    if(immediate)restore();else requestAnimationFrame(restore);
  }
  ["pointerup","pointercancel"].forEach(type=>addEventListener(type,event=>{
    if(sizeGesture?.pointerId===event.pointerId)finishSizeGesture();
  }));
  addEventListener("blur",()=>finishSizeGesture(true));
  element("pgn-fit").addEventListener("click",()=>{element("pgn-size").value="100";sizeBoard();element("bd").focus({preventScroll:true})});
  window.addEventListener("keydown",event=>{
    if(!active||event.shiftKey||event.ctrlKey||event.altKey||event.metaKey||
       (event.target instanceof Element&&event.target.closest("input:not([type=file]):not([type=checkbox]),textarea,select,[contenteditable]"))||element("promotion-dialog").open)return;
    const keys=[event.key,event.code];
    const direction=keys.some(key=>key==="ArrowRight"||key==="Right")?1:keys.some(key=>key==="ArrowLeft"||key==="Left")?-1:0;
    if(!direction)return;
    event.preventDefault();event.stopPropagation();
    seek(Math.max(0,Math.min(active.moves.length,idx+direction)),false);
  },true);
  element("pgn-clear").addEventListener("click",()=>{
    worker.terminate();cancelPuzzle();entries=[];filtered=[];active=null;request++;importErrors=0;
    element("pgn-errors").replaceChildren();element("pgn-import-errors").hidden=true;
    element("pgn-placeholder").hidden=false;element("pgn-game-title").textContent="Your PGN workspace";
    element("pgn").classList.remove("pgn-has-game","pgn-focused");element("pgn-focus").setAttribute("aria-pressed","false");element("pgn-focus").textContent="Focus board";element("pgn-focus").disabled=true;
    element("pgn-import-panel").open=true;element("pgn-play-settings").open=true;
    placeSizeControl(false);sizeBoard();
    element("pgn-game-detail").textContent="Choose files, then select a game.";
    element("pgn-moves").replaceChildren();filterGames();startWorker();
    element("pgn-progress").textContent="No game selected";
    ["pgn-next","pgn-prev","pgn-hint","pgn-board-next","pgn-board-prev"].forEach(id=>element(id).disabled=true);
    say("Ready when you are","","Import your files and select any game from the left.");
    status("Library cleared. Original files are unchanged.");
  });
  addEventListener("pagehide",()=>{finishSizeGesture(true);cancelAnimationFrame(sizeFrame);sizeFrame=0;worker.terminate();layoutObserver.disconnect();listObserver.disconnect();cancelPuzzle()});
  addEventListener("pageshow",event=>{
    if(event.persisted){
      element("pgn-clear").click();
      ["header",".pgn-heading","#pgn-game-title","#pgn-game-detail",".pgn-board-tools"].forEach(selector=>layoutObserver.observe(document.querySelector(selector)));
      layoutObserver.observe(document.querySelector(".pgn-layout"));listObserver.observe(element("pgn-game-list"));
      sizeBoard();
      status("Choose your PGN files again to reopen the library.");
    }
  });
  startWorker();
  sizeBoard();
})();
