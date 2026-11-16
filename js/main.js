/* ---- ADD A NEW PUZZLE EACH DAY HERE ----
 date: YYYY-MM-DD · fen: starting position · moves: solution in order (your move, reply, your move...) */
const PUZZLES=[
{date:'2026-11-11',fen:'6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',moves:['a1a8'],rating:600,theme:'Back-rank mate'},
{date:'2026-11-12',fen:'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',moves:['h5f7'],rating:700,theme:'Mate in 1'},
{date:'2026-11-13',fen:'3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',moves:['d1d8'],rating:650,theme:'Back-rank mate'}];
const $=s=>document.querySelector(s),G={w:'♚♛♜♝♞♟'};
const GL={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const pages=['home','blog','post','about','programs','community','puzzles','demo','contact','login','portal'];let me=null,solved={};
function route(){let h=location.hash.slice(1);let slug=null;if(h.startsWith('blog-')){slug=h.slice(5);h='post'}if(!pages.includes(h))h='home';if(h==='login'&&me)h='portal';if(h==='portal'&&!me)h='login';renderMe();if(h==='blog')renderBlog();if(h==='post')renderPost(slug);pages.forEach(p=>$('#'+p).classList.toggle('on',p===h));document.querySelectorAll('nav a.l').forEach(a=>a.classList.toggle('on',a.dataset.p===(h==='post'?'blog':h)));if(h==='puzzles'&&!cur)loadDaily()}
addEventListener('hashchange',route);
