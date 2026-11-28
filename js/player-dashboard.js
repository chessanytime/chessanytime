// Player dashboard: public Lichess data plus clearly scoped sample statistics.
(()=>{
 const $=id=>document.getElementById(id),fmt=n=>Number.isFinite(n)?n.toLocaleString():'—',node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
 const labels={bullet:'Bullet',blitz:'Blitz',rapid:'Rapid',classical:'Classical',correspondence:'Correspondence',puzzle:'Puzzles',ultraBullet:'UltraBullet',chess960:'Chess960',crazyhouse:'Crazyhouse',atomic:'Atomic',antichess:'Antichess',horde:'Horde',kingOfTheHill:'King of the Hill',racingKings:'Racing Kings',threeCheck:'Three-check'};
 const icons={bullet:'◷',blitz:'ϟ',rapid:'◴',classical:'♜',correspondence:'✉',puzzle:'♞'};
 let records=[],series=[],limit=12,account=null,arenaController=null;
 const number=n=>Number.isFinite(n)?n:null,pct=(n,d)=>d?Math.round(n/d*100)+'%':'—',signed=n=>Number.isFinite(n)?(n>0?'+':'')+n:'—';
 function metric(label,value,detail){const e=node('article',undefined,'dash-metric');e.append(node('span',label),node('strong',value),node('small',detail));return e}
 function profile(user){
  account=user;$('pw').textContent=(user.title?user.title+' ':'')+user.username;$('lichess-avatar').textContent=user.username[0].toUpperCase();$('lichess-profile').href='https://lichess.org/@/'+encodeURIComponent(user.username);
  if($('dash-full-archive'))$('dash-full-archive').href='https://lichess.org/@/'+encodeURIComponent(user.username)+'/all';
  const since=Number.isFinite(user.createdAt)?'Member since '+new Date(user.createdAt).toLocaleDateString(undefined,{month:'long',year:'numeric'}):'Connected account';
  $('dash-profile-meta').textContent=[since,user.profile?.fideRating?'FIDE '+user.profile.fideRating:''].filter(Boolean).join(' · ');
  const c=user.count||{},all=number(c.all),win=number(c.win),loss=number(c.loss),draw=number(c.draw),decided=[win,loss,draw].every(x=>x!==null)?win+loss+draw:null;
  const hours=Number.isFinite(user.playTime?.total)?Math.round(user.playTime.total/3600):null;
  $('dash-lifetime').replaceChildren(metric('Total games',fmt(all),'All Lichess games'),metric('Wins',fmt(win),decided?pct(win,decided)+' of recorded results':'Lifetime wins'),metric('Losses',fmt(loss),'Lifetime losses'),metric('Draws',fmt(draw),'Lifetime draws'),metric('Time played',hours===null?'—':fmt(hours)+' h','Across all games'));
  const ratings=$('lichess-ratings');ratings.replaceChildren();
  for(const key of [...Object.keys(labels),...Object.keys(user.perfs||{}).filter(k=>!Object.hasOwn(labels,k)&&!['storm','racer','streak'].includes(k))]){
   const p=user.perfs?.[key];if(!Number.isFinite(p?.rating))continue;
   const card=node('article',undefined,'dash-rating');card.dataset.perf=key;
   const top=node('div',undefined,'dash-rating-top');top.append(node('span',icons[key]||'♟','dash-rating-icon'),node('span',labels[key]||key));
   const detail=node('div',undefined,'dash-rating-detail');detail.append(node('span',Number.isFinite(p.games)?fmt(p.games)+' '+(key==='puzzle'?'puzzles':'games'):'Activity unavailable'));
   if(Number.isFinite(p.prog))detail.append(node('b',signed(p.prog),p.prog>0?'dash-positive':p.prog<0?'dash-negative':''));
   card.append(top,node('strong',String(p.rating)+(p.prov?'?':'')),detail);ratings.append(card);
  }
  if(!ratings.children.length)ratings.append(node('p','No ratings available yet.','dash-note')); renderMilestones();
 }
 function normalized(g,user){
  if(!/^[A-Za-z0-9]{8}$/.test(g.id||'')||!g.players?.white||!g.players?.black)return null;
  const id=user.id.toLowerCase(),color=['white','black'].find(c=>g.players[c].user?.id?.toLowerCase()===id||g.players[c].user?.name?.toLowerCase()===id);
  if(!color)return null;const self=g.players[color],opp=g.players[color==='white'?'black':'white'];
  const result=g.winner?g.winner===color?'Win':'Loss':['draw','stalemate'].includes(g.status)?'Draw':'Other';
  return {g,color,result,self,opp,format:g.speed||g.perf||'unknown',opening:g.opening?.name||'Unclassified'};
 }
 function games(items,user){records=items.map(g=>normalized(g,user)).filter(Boolean);limit=12;render();}
 function current(){const f=$('dash-filter-format').value,c=$('dash-filter-color').value,r=$('dash-filter-result').value;return records.filter(x=>(f==='all'||x.format===f)&&(c==='all'||x.color===c)&&(r==='all'||x.result===r))}
 function totals(list){return {win:list.filter(x=>x.result==='Win').length,loss:list.filter(x=>x.result==='Loss').length,draw:list.filter(x=>x.result==='Draw').length}}
 function resultBlock(list){const t=totals(list),d=t.win+t.loss+t.draw;const root=node('div');const headline=node('strong',pct(t.win,d),'dash-big');root.append(headline,node('span',' win rate · '+d+' decided games','dash-note'));const bar=node('div',undefined,'dash-result-bar');for(const [key,n] of Object.entries(t)){const e=node('span');e.className='dash-'+key;e.style.flexGrow=String(n);e.title=key+' '+n;bar.append(e)}if(d)root.append(bar);const legend=node('div',undefined,'dash-legend');legend.append(node('span',t.win+' wins','dash-positive'),node('span',t.draw+' draws'),node('span',t.loss+' losses','dash-negative'));root.append(legend);return root}
 function render(){
  const list=current(),t=totals(list),d=t.win+t.loss+t.draw;
  $('dash-results').replaceChildren(resultBlock(list));
  const colors=$('dash-colors');colors.replaceChildren();for(const color of ['white','black']){const rows=list.filter(x=>x.color===color),line=node('div',undefined,'dash-color-row');line.append(node('h4',color==='white'?'♔ White':'♚ Black'),resultBlock(rows));colors.append(line)}
  const counts=new Map();for(const x of list){if(x.opening==='Unclassified')continue;const a=counts.get(x.opening)||[];a.push(x);counts.set(x.opening,a)}
  const openings=$('dash-openings');openings.replaceChildren();for(const [name,rows] of [...counts].sort((a,b)=>b[1].length-a[1].length).slice(0,5)){const row=node('div',undefined,'dash-opening-row'),tt=totals(rows);row.append(node('strong',name),node('small',rows.length+' games · '+pct(tt.win,tt.win+tt.loss+tt.draw)+' wins'));const bar=node('div',undefined,'dash-opening-track'),fill=node('span');fill.style.width=100*rows.length/Math.max(1,list.length)+'%';bar.append(fill);row.append(bar);openings.append(row)}
  if(!openings.children.length)openings.append(node('p','Opening data unavailable in this selection.','dash-note'));
  const insights=$('dash-insights');insights.replaceChildren();const formats=new Map();for(const x of list){if(!x.g.rated||!Number.isFinite(x.self.ratingDiff))continue;const a=formats.get(x.format)||{sum:0,n:0};a.sum+=x.self.ratingDiff;a.n++;formats.set(x.format,a)}
  for(const [name,v] of formats){const row=node('div',undefined,'dash-insight-row');row.append(node('span',(labels[name]||name)+' · '+v.n+' rated games'),node('strong',signed(v.sum),v.sum>0?'dash-positive':v.sum<0?'dash-negative':''));insights.append(row)}
  if(!formats.size)insights.append(node('p','No rated-game changes in this selection.','dash-note'));
  const w=list.filter(x=>x.color==='white'),b=list.filter(x=>x.color==='black'),wt=totals(w),bt=totals(b),wd=wt.win+wt.loss+wt.draw,bd=bt.win+bt.loss+bt.draw;
  if(wd>=5&&bd>=5){const diff=wt.win/wd-bt.win/bd;insights.append(node('p',Math.abs(diff)<.1?'Your recent win rates with White and Black are similar.':'Your recent win rate is higher with '+(diff>0?'White':'Black')+'. Review losses with '+(diff>0?'Black':'White')+' to look for patterns.','dash-insight-note'))}
  insights.append(node('p','Rating changes are grouped by format; ratings across formats are not combined. Small samples are not predictive.','dash-note'));
  $('lichess-recent-summary').textContent=list.length+' matching games · '+t.win+' wins · '+t.loss+' losses · '+t.draw+' draws';
  const archive=$('lichess-games');archive.replaceChildren();for(const x of list.slice(0,limit)){
   const card=node('article',undefined,'dash-game'),g=x.g,op=x.opp,opName=op.user?.name||op.user?.id||(op.aiLevel?'Stockfish '+op.aiLevel:'Anonymous');
   const result=node('span',x.result,'dash-game-result '+(x.result==='Win'?'dash-positive':x.result==='Loss'?'dash-negative':''));const identity=node('div',undefined,'dash-game-identity');identity.append(node('strong',(x.color==='white'?'♔ ':'♚ ')+opName+(Number.isFinite(op.rating)?' · '+op.rating:'')),node('small',(labels[x.format]||x.format)+(g.clock?' · '+g.clock.initial/60+'+'+g.clock.increment:'')+' · '+(g.rated?'Rated':'Casual')));
   const meta=node('div',undefined,'dash-game-opening');meta.append(node('span',x.opening),node('small',Number.isFinite(g.createdAt)?new Date(g.createdAt).toLocaleDateString():''));
   const delta=node('strong',signed(x.self.ratingDiff),x.self.ratingDiff>0?'dash-positive':x.self.ratingDiff<0?'dash-negative':'');
   const links=node('div',undefined,'dash-game-links');for(const [label,url] of [['Analyse ↗','https://lichess.org/'+g.id+'/'+x.color],['PGN ↓','https://lichess.org/game/export/'+g.id]]){const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a)}
   card.append(result,identity,meta,delta,links);archive.append(card);
  }
  if(!list.length)archive.append(node('p','No games match this selection.','dash-note'));
  $('dash-more').hidden=list.length<=limit; renderExtra(list);
 }
 async function history(user,signal){
  $('dash-history-message').textContent='Loading rating history…';
  try{const r=await lichessRequest('/api/user/'+encodeURIComponent(user.username)+'/rating-history',{headers:{Accept:'application/json'},signal:AbortSignal.any([signal,AbortSignal.timeout(30000)])});const data=await r.json();if(signal.aborted||account?.id!==user.id)return;
   series=Array.isArray(data)?data.filter(s=>typeof s.name==='string'&&Array.isArray(s.points)&&s.points.length):[];
   const sel=$('dash-history-format'),prior=sel.value;sel.replaceChildren(...series.map((s,i)=>{const e=node('option',s.name);e.value=String(i);return e}));
   const preferred=series.findIndex(s=>s.name.toLowerCase()==='blitz');sel.value=prior&&series[Number(prior)]?prior:String(preferred>=0?preferred:0);chart();renderMilestones();
  }catch(e){if(!signal.aborted&&account?.id===user.id){$('dash-history-message').textContent=e.message;}}
 }
 function chart(){
  const s=series[Number($('dash-history-format').value)],container=$('dash-chart'),stats=$('dash-history-stats');container.replaceChildren();stats.replaceChildren();
  const days=Number($('dash-history-period').value),cut=days?Date.now()-days*86400000:-Infinity;
  const points=(s?.points||[]).map(p=>[Date.UTC(p[0],p[1],p[2]),p[3]]).filter(p=>p[0]>=cut&&Number.isFinite(p[1])).sort((a,b)=>a[0]-b[0]);
  if(!points.length){$('dash-history-message').textContent='No rating history for this format and period.';return}
  const ratings=points.map(p=>p[1]),lo=Math.min(...ratings),hi=Math.max(...ratings),min=Math.floor((lo-10)/50)*50,max=Math.ceil((hi+10)/50)*50;
  stats.append(metric('Latest',fmt(ratings.at(-1)),s.name),metric('Period high',fmt(hi),'Recorded daily rating'),metric('Period change',signed(ratings.at(-1)-ratings[0]),'From first point'));
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 700 235');svg.setAttribute('role','img');svg.setAttribute('aria-label',s.name+' rating history from '+new Date(points[0][0]).toLocaleDateString()+' to '+new Date(points.at(-1)[0]).toLocaleDateString());
  function e(tag,attrs,text){const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;svg.append(el);return el}
  const x=t=>48+(t-points[0][0])/Math.max(86400000,points.at(-1)[0]-points[0][0])*635,y=r=>205-(r-min)/(max-min)*180;
  for(let i=0;i<=4;i++){const val=min+(max-min)*i/4,yy=y(val);e('line',{x1:48,x2:683,y1:yy,y2:yy,stroke:'#e1e7ed'});e('text',{x:38,y:yy+4,'text-anchor':'end',fill:'#66778a','font-size':11},String(Math.round(val)))}
  const d=points.map((p,i)=>(i?'L':'M')+x(p[0]).toFixed(2)+' '+y(p[1]).toFixed(2)).join(' ');
  if(points.length>1){e('path',{d:d+' L '+x(points.at(-1)[0])+' 205 L 48 205 Z',fill:'#c591571c'});e('path',{d,stroke:'#a77340','stroke-width':2.5,fill:'none','stroke-linejoin':'round','stroke-linecap':'round'})}
  const last=points.at(-1);e('circle',{cx:x(last[0]),cy:y(last[1]),r:4,fill:'#a77340'});
  e('text',{x:48,y:225,fill:'#66778a','font-size':11},new Date(points[0][0]).toLocaleDateString());e('text',{x:683,y:225,'text-anchor':'end',fill:'#66778a','font-size':11},new Date(last[0]).toLocaleDateString());
  const marker=e('circle',{r:4,fill:'#294d77',visibility:'hidden'});const guide=e('line',{y1:25,y2:205,stroke:'#294d77','stroke-dasharray':'3 4',visibility:'hidden'});
  const msg=$('dash-history-message');const reset=()=>{marker.setAttribute('visibility','hidden');guide.setAttribute('visibility','hidden');msg.textContent=points.length+' recorded rating points · hover or tap the chart to inspect.'};
  svg.addEventListener('pointermove',event=>{const r=svg.getBoundingClientRect(),px=(event.clientX-r.left)*700/r.width;const p=points.reduce((a,b)=>Math.abs(x(b[0])-px)<Math.abs(x(a[0])-px)?b:a);marker.setAttribute('cx',x(p[0]));marker.setAttribute('cy',y(p[1]));marker.setAttribute('visibility','visible');guide.setAttribute('x1',x(p[0]));guide.setAttribute('x2',x(p[0]));guide.setAttribute('visibility','visible');msg.textContent=new Date(p[0]).toLocaleDateString()+' · Rating '+p[1]});svg.addEventListener('pointerleave',reset);
  container.append(svg);reset();
 }
 function clear(){arenaController?.abort();arenaController=null;records=[];series=[];account=null;for(const id of ['dash-milestones','dash-strength','dash-repertoire','dash-best-wins','dash-tournament-games','dash-arenas'])$(id)?.replaceChildren();if($('dash-arena-message'))$('dash-arena-message').textContent='Load recent Arena results on demand.';if($('dash-arena-load'))$('dash-arena-load').disabled=false;for(const id of ['dash-lifetime','dash-chart','dash-history-stats','dash-history-format','dash-results','dash-colors','dash-openings','dash-insights'])$(id)?.replaceChildren();$('dash-history-message').textContent='Rating history loads after your recent games.'}
 for(const id of ['dash-filter-format','dash-filter-color','dash-filter-result'])$(id).addEventListener('change',()=>{limit=12;render()});
 for(const id of ['dash-history-format','dash-history-period'])$(id).addEventListener('change',chart);
 $('dash-more').addEventListener('click',()=>{limit+=12;render()});

 function message(id,txt){const el=$(id);if(el)el.replaceChildren(node('p',txt,'dash-note'))}
 function renderMilestones(){
  const el=$('dash-milestones');if(!el)return;el.replaceChildren();
  for(const s of series){const pts=s.points.filter(p=>Number.isFinite(p[3]));if(!pts.length)continue;const best=pts.reduce((a,b)=>b[3]>a[3]?b:a);el.append(metric(s.name,fmt(best[3]),'Recorded peak · '+new Date(Date.UTC(best[0],best[1],best[2])).toLocaleDateString()));}
  if(!el.children.length)message('dash-milestones','Rating milestones will appear when history loads.');
 }
 function makeTable(headers,rows){
  const wrap=node('div',undefined,'dash-table-wrap'),table=node('table',undefined,'dash-data-table'),head=node('thead'),tr=node('tr');
  for(const h of headers){const th=node('th',h);th.scope='col';tr.append(th)}head.append(tr);table.append(head);
  const body=node('tbody');for(const row of rows){const tr=node('tr');for(const cell of row){const td=node('td');if(typeof cell==='string'||typeof cell==='number')td.textContent=String(cell);else td.append(cell);tr.append(td)}body.append(tr)}table.append(body);wrap.append(table);return wrap;
 }
 function renderExtra(list){
  const strength=$('dash-strength'),rep=$('dash-repertoire'),best=$('dash-best-wins'),tourney=$('dash-tournament-games');if(!strength||!rep||!best||!tourney)return;
  const rated=list.filter(x=>x.g.rated&&Number.isFinite(x.self.rating)&&Number.isFinite(x.opp.rating));
  const bins=[['Stronger (+100 or more)',rated.filter(x=>x.opp.rating-x.self.rating>=100)],['Similar (within 99)',rated.filter(x=>Math.abs(x.opp.rating-x.self.rating)<100)],['Lower-rated (−100 or more)',rated.filter(x=>x.opp.rating-x.self.rating<=-100)]];
  strength.replaceChildren(...bins.map(([name,rows])=>{const div=node('div',undefined,'dash-color-row');div.append(node('h4',name),resultBlock(rows));return div}));
  rep.replaceChildren();
  for(const color of ['white','black']){
   const group=node('div',undefined,'dash-rep-group');group.append(node('h4',color==='white'?'♔ White':'♚ Black'));const map=new Map();
   for(const x of list.filter(x=>x.color===color&&x.opening!=='Unclassified')){const name=x.opening.split(':')[0],rows=map.get(name)||[];rows.push(x);map.set(name,rows)}
   const rows=[...map].sort((a,b)=>b[1].length-a[1].length).slice(0,8).map(([name,games])=>{const t=totals(games);return [name,games.length,t.win+' / '+t.draw+' / '+t.loss,pct(t.win,t.win+t.loss+t.draw)]});
   if(rows.length)group.append(makeTable(['Opening family','Games','W / D / L','Win %'],rows));else group.append(node('p','No classified openings in this selection.','dash-note'));rep.append(group);
  }
  const link=(label,url)=>{const a=node('a',label,'dash-game-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a};
  const wins=rated.filter(x=>x.result==='Win').sort((a,b)=>b.opp.rating-a.opp.rating).slice(0,5);
  best.replaceChildren();if(wins.length)best.append(makeTable(['Opponent','Rating','Difference','Format','Game'],wins.map(x=>[x.opp.user?.name||x.opp.user?.id||'Opponent',x.opp.rating,signed(x.opp.rating-x.self.rating),labels[x.format]||x.format,link('Review','https://lichess.org/'+x.g.id+'/'+x.color)])));else best.append(node('p','No rated wins with opponent ratings in this selection.','dash-note'));
  const events=new Map();for(const x of list){const type=x.g.swiss?'swiss':'tournament',id=x.g.swiss||x.g.tournament;if(typeof id!=='string'||!/^[A-Za-z0-9]{8}$/.test(id))continue;const key=type+'/'+id,rows=events.get(key)||[];rows.push(x);events.set(key,rows)}
  tourney.replaceChildren();if(events.size)tourney.append(makeTable(['Event','Games','W / D / L'],[...events].slice(0,20).map(([key,rows])=>{const t=totals(rows);return [link(key.startsWith('swiss')?'Swiss '+key.split('/')[1]:'Arena '+key.split('/')[1],'https://lichess.org/'+key),rows.length,t.win+' / '+t.draw+' / '+t.loss]})));else tourney.append(node('p','No identifiable tournament games in the selected sample.','dash-note'));
 }
 async function loadArenas(){
  if(!account||arenaController||lichessBusy)return;const user=account,controller=new AbortController();arenaController=controller;const btn=$('dash-arena-load');btn.disabled=true;$('dash-arena-message').textContent='Loading Arena results…';
  try{
   const res=await lichessRequest('/api/user/'+encodeURIComponent(user.username)+'/tournament/played?max=20',{headers:{Accept:'application/x-ndjson'},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])},null);
   const raw=await res.text();if(controller.signal.aborted||account!==user)return;const data=raw.split(/\r?\n/).filter(s=>s.trim()).map(s=>JSON.parse(s));const rows=[];
   for(const item of data){const t=item.tournament||item,player=item.player||item;const id=t.id||item.id;if(typeof id!=='string'||!/^[A-Za-z0-9]{8}$/.test(id))continue;const a=node('a',t.fullName||t.name||'Arena '+id,'dash-game-link');a.href='https://lichess.org/tournament/'+id;a.target='_blank';a.rel='noopener noreferrer';rows.push([a,fmt(player.rank),fmt(player.score),fmt(player.performance)]);}
   $('dash-arenas').replaceChildren();if(rows.length)$('dash-arenas').append(makeTable(['Arena','Rank','Score','Performance'],rows));$('dash-arena-message').textContent=rows.length?rows.length+' recent Arena entries returned by Lichess.':'No Arena results returned.';
  }catch(e){if(!controller.signal.aborted&&account===user)$('dash-arena-message').textContent=e.message;}
  finally{if(arenaController===controller){arenaController=null;btn.disabled=false}}
 }
 $('dash-arena-load')?.addEventListener('click',loadArenas);
 $('dash-sample')?.addEventListener('change',()=>{if(account&&!lichessBusy)loadLichessGames()});

 window.caPlayerDashboard={profile,games,history,clear};
})();
