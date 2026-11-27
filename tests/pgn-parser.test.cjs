const test=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
async function parse(files){
  const messages=[];
  let complete;
  const done=new Promise(resolve=>complete=resolve);
  const context=vm.createContext({console,setTimeout,TextDecoder,Map,postMessage:message=>{
    messages.push(message);if(message.type==="complete")complete(message);
  }});
  context.importScripts=()=>vm.runInContext(fs.readFileSync(path.join(root,"js","vendor","chess.min.js"),"utf8"),context);
  vm.runInContext(fs.readFileSync(path.join(root,"js","pgn-worker.js"),"utf8"),context);
  context.onmessage({data:{type:"import",files:files.map(([name,text])=>new File([text],name))}});
  await done;
  return {messages,context};
}
test("multiple files and 1000 games parse incrementally",async()=>{
  const game='[Event "Practice"]\r\n[White "White"]\r\n[Black "Black"]\r\n\r\n1.e4 e5 2.Nf3 Nc6 1/2-1/2\r\n\r\n';
  const {messages,context}=await parse([["many.pgn",game.repeat(1000)],["one.pgn","1. d4 d5 *"]]);
  assert.equal(messages.at(-1).total,1001);
  assert.equal(messages.filter(message=>message.type==="parse-error").length,0);
  const batches=messages.filter(message=>message.type==="games");
  assert.equal(batches[0].games.length,1);
  context.onmessage({data:{type:"select",id:batches[0].games[0].id,request:4}});
  const selected=messages.at(-1);
  assert.equal(selected.game.moves[0].uci,"e2e4");
  assert.equal(selected.request,4);
});
test("comments, variations, invalid games and FEN promotion are handled",async()=>{
  const normal='[Event "Commented"]\n\n1. e4 {not a result: 1-0\n[Event "Not a new game"]\n} e5 (1... c5) 2. Nf3 Nc6 *\n';
  const promotion='[Event "Promotion"]\n[SetUp "1"]\n[FEN "7k/1P6/8/8/8/8/8/7K w - - 0 1"]\n\n1. b8=N *\n';
  const {messages}=await parse([["mix.pgn",normal+'[Event "Broken"]\n1. e9 *\n'+promotion]]);
  assert.equal(messages.at(-1).total,2);
  assert.equal(messages.filter(message=>message.type==="parse-error").length,1);
});
