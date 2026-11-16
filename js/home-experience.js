(() => {
const home=document.querySelector("#home"),videoPage=document.querySelector("#videos");
const benefits={
focus:{symbol:"◎",kicker:"SKILL 01 · FOCUS",count:"01 / 06",title:"Focus & attention",description:"A chess position rewards careful observation. Look at the whole board, notice what has changed and give each decision your attention."},
problem:{symbol:"⌁",kicker:"SKILL 02 · PROBLEM-SOLVING",count:"02 / 06",title:"Problem-solving",description:"Every position presents a new challenge. Compare possible moves, calculate consequences and choose a practical solution."},
ahead:{symbol:"↗",kicker:"SKILL 03 · THINKING AHEAD",count:"03 / 06",title:"Thinking ahead",description:"Before making a move, consider how the opponent might respond. Chess gives students regular practice in looking beyond the first idea."},
patience:{symbol:"◷",kicker:"SKILL 04 · PATIENCE",count:"04 / 06",title:"Patience & planning",description:"Not every position calls for immediate action. Players learn to improve their position, wait for the right moment and follow a plan."},
resilience:{symbol:"↻",kicker:"SKILL 05 · RESILIENCE",count:"05 / 06",title:"Learning from mistakes",description:"A missed tactic or a difficult game can become a useful lesson. Review what happened, understand the position and try again."},
confidence:{symbol:"♙",kicker:"SKILL 06 · DECISION-MAKING",count:"06 / 06",title:"Confidence in decisions",description:"Chess asks players to make choices and take responsibility for them. Each game offers another opportunity to practise independent thinking."}};
if(home){
const symbol=home.querySelector("#benefit-active-symbol"),kicker=home.querySelector("#benefit-active-kicker"),title=home.querySelector("#benefit-active-title"),description=home.querySelector("#benefit-active-description"),count=home.querySelector("#tree-detail-count"),nodes=[...home.querySelectorAll("[data-benefit]")];
nodes.forEach(button=>button.addEventListener("click",()=>{const item=benefits[button.dataset.benefit];if(!item)return;nodes.forEach(node=>{const active=node===button;node.classList.toggle("is-active",active);node.setAttribute("aria-pressed",String(active));});symbol.textContent=item.symbol;kicker.textContent=item.kicker;title.textContent=item.title;description.textContent=item.description;if(count)count.textContent=item.count;}));
}
if(videoPage){
const videos={
basics:{id:"YdnvlntAQH8",title:"How to Play Chess: Chess Rules for Beginners",description:"Learn how the pieces move, how a game is won and the special rules every new player should know."},
tactics:{id:"10IC86NSQZ8",title:"The Basic Tactics of Chess for Kids",description:"Explore tactical ideas and learn to recognise the patterns that can change a game."},
checkmates:{id:"RZSRfvE0K_0",title:"Everything You Need to Know About Basic Checkmates",description:"Get familiar with essential mating patterns and the basic checkmates every player should practise."},
endgames:{id:"UL8Jo4lc1Ms",title:"What Is the Endgame in Chess?",description:"Understand the final phase of a chess game and why king and pawn activity becomes so important."}};
const tabs=[...videoPage.querySelectorAll("[data-video]")],player=videoPage.querySelector("#academy-video-player"),videoTitle=videoPage.querySelector("#academy-video-title"),videoDescription=videoPage.querySelector("#academy-video-description"),videoSource=videoPage.querySelector("#academy-video-source"),originalLink=videoPage.querySelector("#academy-video-original");
function selectVideo(button){const item=videos[button.dataset.video];if(!item||!player)return;tabs.forEach(tab=>{const active=tab===button;tab.classList.toggle("is-active",active);tab.setAttribute("aria-pressed",String(active));});const src="https://www.youtube-nocookie.com/embed/"+item.id+"?rel=0&modestbranding=1";if(player.getAttribute("src")!==src)player.setAttribute("src",src);player.setAttribute("title",item.title+" by ChessKid");videoTitle.textContent=item.title;videoDescription.textContent=item.description;videoSource.textContent="FREE LESSON · CHESSKID";originalLink.href="https://www.youtube.com/watch?v="+item.id;}
tabs.forEach((button,index)=>{button.addEventListener("click",()=>selectVideo(button));button.addEventListener("keydown",event=>{if(event.key!=="ArrowRight"&&event.key!=="ArrowLeft")return;event.preventDefault();const next=(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;tabs[next].focus();selectVideo(tabs[next]);});});
}
})();