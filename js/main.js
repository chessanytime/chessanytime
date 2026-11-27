const $=s=>document.querySelector(s),G={w:'♚♛♜♝♞♟'};
const GL={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
let me=null,solved={};
const localDate=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const currentPage=document.body.dataset.page;
document.querySelectorAll('header nav a.l').forEach(a=>{
 const active=a.dataset.p===(currentPage==='post'?'blog':currentPage);
 a.classList.toggle('on',active);
 if(active)a.setAttribute('aria-current','page');
});
