const test=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const code=fs.readFileSync(path.join(__dirname,"..","js","puzzle-library.js"),"utf8");
function library(rows){
  const file="1234567890abcdef/1500-0000.json",requests=[];
  const context=vm.createContext({AbortController,AbortSignal,Set,Map,Math,console,fetch:async(url)=>{
    requests.push(url);
    return {ok:true,json:async()=>url==="excel/manifest.json"?{version:1,total:rows.length,sources:[{name:"test.csv"}],chunks:[{file,count:rows.length,min:rows[0][3],max:rows.at(-1)[3]}]}:rows};
  }});
  vm.runInContext(code+";globalThis.Library=PuzzleLibrary",context);
  return {instance:new context.Library(),requests};
}
const fen="8/8/8/8/8/8/3K4/7k w - - 0 1";
test("wins select higher, losses select lower, exclusions prevent repeats",async()=>{
  const {instance}=library([["Low01",fen,"d2d3",1400,"endgame",0],["Mid01",fen,"d2d3",1500,"endgame",0],["High1",fen,"d2d3",1600,"endgame",0]]);
  await instance.open();
  assert.equal((await instance.next(1500,1,new Set())).id,"High1");
  assert.equal((await instance.next(1500,-1,new Set())).id,"Low01");
  assert.equal((await instance.next(1500,0,new Set(["Low01","Mid01"]))).id,"High1");
});
test("library boundaries are explicit and CSVs are never requested",async()=>{
  const {instance,requests}=library([["Only1",fen,"d2d3",1500,"endgame",0]]);
  await instance.open();
  assert.equal((await instance.next(1500,1,new Set())).boundary,true);
  await assert.rejects(instance.next(1500,0,new Set(["Only1"])),/every puzzle/);
  assert(requests.every(url=>!url.endsWith(".csv")));
  instance.close();assert.equal(instance.controller.signal.aborted,true);
});
