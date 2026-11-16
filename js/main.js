const $=s=>document.querySelector(s),G={w:'♚♛♜♝♞♟'};
const GL={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const pages=['home','blog','post','about','programs','community','puzzles','demo','contact','login','portal'];let me=null,solved={};
function route(){let h=location.hash.slice(1);let slug=null;if(h.startsWith('blog-')){slug=h.slice(5);h='post'}if(!pages.includes(h))h='home';if(h==='login'&&me)h='portal';if(h==='portal'&&!me)h='login';renderMe();if(h==='blog')renderBlog();if(h==='post')renderPost(slug);pages.forEach(p=>$('#'+p).classList.toggle('on',p===h));document.querySelectorAll('nav a.l').forEach(a=>a.classList.toggle('on',a.dataset.p===(h==='post'?'blog':h)));if(h==='puzzles'&&!cur)loadDaily()}
addEventListener('hashchange',route);
