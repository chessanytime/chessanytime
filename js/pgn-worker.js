importScripts("vendor/chess.min.js");
const games=new Map();
let serial=0,queue=[],running=false;

function parseGame(text,file,number){
  const chess=new Chess();
  if(!chess.load_pgn(text.replace(/\r\n?/g,"\n").trim(),{sloppy:true}))throw new Error("Invalid PGN or illegal main-line move.");
  const headers=chess.header(),history=chess.history({verbose:true});
  if(!history.length)throw new Error("This game has no main-line moves.");
  const start=headers.FEN||new Chess().fen(),walk=new Chess(start),checkpoints=[{ply:0,fen:start}];
  const moves=history.map((move,index)=>{
    if(!walk.move({from:move.from,to:move.to,promotion:move.promotion}))throw new Error("Could not reconstruct the main line.");
    if((index+1)%16===0)checkpoints.push({ply:index+1,fen:walk.fen()});
    return {uci:move.from+move.to+(move.promotion||""),san:move.san};
  });
  const id="game-"+(++serial);
  const meta={id,title:headers.White&&headers.Black?headers.White+" vs "+headers.Black:headers.Event||file+" · Game "+number,
    file,number,event:headers.Event||"",date:headers.Date||"",result:headers.Result||"*",plies:moves.length};
  games.set(id,{...meta,start,moves,checkpoints,headers});
  return meta;
}

// Results outside headers, comments and variations delimit even headerless, single-line games.
function resultEnd(text,checkOpen=false){
  let braces=0,variation=0,tag=false,quoted=false,semicolon=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(semicolon){if(c==="\n")semicolon=false;continue}
    if(braces){if(c==="{")braces++;else if(c==="}")braces--;continue}
    if(tag){
      if(c==='"'&&text[i-1]!=="\\")quoted=!quoted;
      if(c==="]"&&!quoted)tag=false;
      continue;
    }
    if(c==="{"){braces++;continue}
    if(c===";"){semicolon=true;continue}
    if(c==="["){tag=true;continue}
    if(c==="("){variation++;continue}
    if(c===")"){variation=Math.max(0,variation-1);continue}
    if(!variation&&(i===0||/\s/.test(text[i-1]))){
      const result=/^(?:1\/2-1\/2|1-0|0-1|\*)(?=\s|$)/.exec(text.slice(i));
      if(result)return checkOpen?false:i+result[0].length;
    }
  }
  return checkOpen?braces>0||variation>0||tag:-1;
}

async function importFile(file){
  const reader=file.stream().getReader(),decoder=new TextDecoder();
  let pending="",gameText="",number=0,batch=[],bytes=0,errors=0,hasMoves=false;
  const publish=()=>{
    if(batch.length){postMessage({type:"games",games:batch});batch=[]}
  };
  const emit=text=>{
    if(!text.trim())return;
    number++;
    try{batch.push(parseGame(text,file.name,number))}
    catch(error){errors++;postMessage({type:"parse-error",file:file.name,game:number,message:error.message})}
    if(number===1||batch.length>=25)publish();
  };
  const line=text=>{
    if(/^\s*\[[A-Za-z]+\s+"/.test(text)&&hasMoves&&!resultEnd(gameText,true)){
      // A following tag roster also separates games whose previous result marker is absent.
      emit(gameText);gameText="";hasMoves=false;
    }
    gameText+=text+"\n";
    if(text.trim()&&!/^\s*\[/.test(text)&&!text.trim().startsWith("{")&&!text.trim().startsWith(";"))hasMoves=true;
    let end;
    while((end=resultEnd(gameText))>=0){
      emit(gameText.slice(0,end));gameText=gameText.slice(end).trimStart();hasMoves=!!gameText.trim();
    }
  };
  try{
    while(true){
      const part=await reader.read();
      if(part.done)break;
      bytes+=part.value.byteLength;pending+=decoder.decode(part.value,{stream:true});
      let newline;
      while((newline=pending.indexOf("\n"))>=0){line(pending.slice(0,newline));pending=pending.slice(newline+1)}
      publish();
      postMessage({type:"progress",file:file.name,bytes,size:file.size,total:games.size});
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    pending+=decoder.decode();
    if(pending)line(pending);
    emit(gameText);publish();
    postMessage({type:"file-done",file:file.name,total:games.size,errors});
  }finally{reader.releaseLock()}
}

async function pump(){
  if(running)return;
  running=true;
  while(queue.length){
    const file=queue.shift();
    try{await importFile(file)}
    catch(error){postMessage({type:"parse-error",file:file.name,message:"Could not read file: "+error.message})}
  }
  running=false;postMessage({type:"complete",total:games.size});
}
onmessage=event=>{
  const message=event.data;
  if(message.type==="import"){queue.push(...message.files);void pump()}
  if(message.type==="select"){
    const game=games.get(message.id);
    postMessage(game?{type:"selected",game,request:message.request}:{type:"select-error",request:message.request,message:"This game is no longer available."});
  }
};
