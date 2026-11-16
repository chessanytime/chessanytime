(() => {
const home=document.querySelector("#home"),videoPage=document.querySelector("#videos");
const mindSkills={
focus:{step:"01 / 06",kicker:"SKILL 01 / FOCUS",title:"See the whole position.",copy:"A strong move starts with observation. Students learn to scan the board, notice threats and pay attention to what has changed before they act.",prompt:"LOOK BEFORE YOU MOVE",label:"FOCUS · SCAN THE WHOLE POSITION",alt:"A busy central chess position illustrating board awareness.",position:["r..qk..r","ppp..ppp","..n..n..","...pp...","...PP...","..N..N..","PPP..PPP","R..QK..R"],highlights:[19,20,27,28,35,36,43,44]},
problem:{step:"02 / 06",kicker:"SKILL 02 / PROBLEM-SOLVING",title:"Find the move that solves it.",copy:"A difficult position becomes manageable when students break it into questions, compare candidate moves and look for the most useful solution.",prompt:"LOOK FOR THE CLUE",label:"PROBLEM-SOLVING · SPOT THE TACTIC",alt:"A knight fork position illustrating tactical problem-solving.",position:["......r.",".......k",".....N..","........","........","........","........","....K..."],highlights:[6,15,21]},
ahead:{step:"03 / 06",kicker:"SKILL 03 / THINKING AHEAD",title:"Calculate before you commit.",copy:"Students practise asking, “What could my opponent play next?” They learn to consider replies, compare variations and look beyond the first attractive move.",prompt:"THINK ONE MOVE FURTHER",label:"THINK AHEAD · CONSIDER THE REPLY",alt:"A central pawn position illustrating planning and calculation.",position:["....k...","ppp..ppp","...p....","...Pp...","....P...","........","PPP..PPP","....K..."],highlights:[27,28,35,36]},
patience:{step:"04 / 06",kicker:"SKILL 04 / PATIENCE",title:"Improve before you rush.",copy:"Not every position needs an immediate attack. Chess teaches students to strengthen their pieces, protect weaknesses and wait for the right moment.",prompt:"FIND A USEFUL IMPROVEMENT",label:"PATIENCE · BUILD THE POSITION",alt:"A closed pawn structure illustrating patience and positional play.",position:["....k...","........","..pppp..","..PPPP..","........","........","........","....K..."],highlights:[18,19,20,21,26,27,28,29]},
resilience:{step:"05 / 06",kicker:"SKILL 05 / RESILIENCE",title:"Turn mistakes into lessons.",copy:"A difficult game is not the end of progress. Students review what happened, understand the mistake and return to the board with a clearer idea.",prompt:"REVIEW. RESET. TRY AGAIN.",label:"RESILIENCE · LEARN FROM THE GAME",alt:"A rook endgame illustrating learning through review and persistence.",position:["........","r...k...",".....p..","..P.....","........","........","....K...","...R...."],highlights:[9,13,26,60]},
confidence:{step:"06 / 06",kicker:"SKILL 06 / CONFIDENCE",title:"Make your own decision.",copy:"With practice, students become more comfortable choosing a plan, explaining their ideas and taking responsibility for a move at the board.",prompt:"CHOOSE WITH PURPOSE",label:"CONFIDENCE · MAKE YOUR MOVE",alt:"A developing middlegame illustrating independent decision-making.",position:["r...k..r","ppp..ppp","..nqbn..","...pp...","...PP...","..NBQ...","PPP..PPP","R...K..R"],highlights:[19,20,27,28,35,36]}
};
const glyphs={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
if(home){
const board=home.querySelector("#mind-board"),buttons=[...home.querySelectorAll("[data-mind-skill]")],step=home.querySelector("#mind-board-step"),boardLabel=home.querySelector("#mind-board-label"),kicker=home.querySelector("#mind-detail-kicker"),title=home.querySelector("#mind-detail-title"),copy=home.querySelector("#mind-detail-copy"),prompt=home.querySelector("#mind-detail-prompt");
function selectSkill(button){
const item=mindSkills[button.dataset.mindSkill];if(!item||!board)return;
buttons.forEach(candidate=>{const active=candidate===button;candidate.classList.toggle("is-active",active);candidate.setAttribute("aria-pressed",String(active));});
step.textContent=item.step;boardLabel.textContent=item.label;kicker.textContent=item.kicker;title.textContent=item.title;copy.textContent=item.copy;prompt.textContent=item.prompt;board.setAttribute("aria-label",item.alt);board.replaceChildren();
item.position.forEach((row,r)=>[...row].forEach((piece,c)=>{
const square=document.createElement("span");square.className="mind-square "+((r+c)%2===0?"is-light":"is-dark");
if(item.highlights.includes(r*8+c))square.classList.add("is-highlight");
if(c===0)square.dataset.rankLabel=String(8-r);if(r===7)square.dataset.fileLabel="abcdefgh"[c];
if(piece!=="."){const man=document.createElement("span");man.className="mind-piece "+(piece===piece.toUpperCase()?"white":"black");man.textContent=glyphs[piece];square.append(man);}
board.append(square);
}));
}
buttons.forEach(button=>button.addEventListener("click",()=>selectSkill(button)));
if(buttons[0])selectSkill(buttons[0]);
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