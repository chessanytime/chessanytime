const $=s=>document.querySelector(s),G={w:'♚♛♜♝♞♟'};
const GL={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
let me=null,solved={};
const LICHESS_SESSION_KEY="caLichessSession",LICHESS_ACCOUNT_KEY="caLichessAccount";
function renderMe(){
 const header=document.getElementById('tl');if(!header)return;
 const link=document.createElement('a');link.href=me?'account.html':'login.html';
 link.textContent=me?'My games':'Log in';
 link.setAttribute('aria-label',me?me.username+': view your games':'Log in with Lichess');
 header.replaceChildren(link);
}
try{
 const session=JSON.parse(sessionStorage.getItem(LICHESS_SESSION_KEY)||'null');
 const account=JSON.parse(sessionStorage.getItem(LICHESS_ACCOUNT_KEY)||'null');
 if(session&&typeof session.token==='string'&&Number.isFinite(session.expiresAt)&&session.expiresAt>Date.now()&&
    account&&typeof account.id==='string'&&account.id&&typeof account.username==='string'&&account.username)me=account;
 else{sessionStorage.removeItem(LICHESS_SESSION_KEY);sessionStorage.removeItem(LICHESS_ACCOUNT_KEY)}
}catch(error){console.error('Could not restore the tab account:',error)}
renderMe();
const localDate=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const currentPage=document.body.dataset.page;
function updateNavigation(){
 document.querySelectorAll('header .resources-menu').forEach(menu=>menu.classList.remove('is-current'));
 document.querySelectorAll('header nav a[data-p]').forEach(a=>{
 const practice=new URLSearchParams(location.search).get('mode')==='practice';
 const active=a.dataset.p===(currentPage==='post'?'blog':currentPage)&&
   (currentPage!=='puzzles'||new URL(a.href).searchParams.has('mode')===practice);
 a.classList.toggle('on',active);
 a.removeAttribute('aria-current');
 if(active)a.setAttribute('aria-current','page');
 if(active)a.closest('details')?.classList.add('is-current');
});
}
updateNavigation();
if(currentPage==='home')document.querySelector('header .brand')?.setAttribute('aria-current','page');
