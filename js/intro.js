/* Short welcome animation: once per tab, with a skip control and reduced-motion support. */
(function(){
 const intro=document.getElementById('ca-intro');
 if(!intro)return;
 try{if(sessionStorage.getItem('ca-intro-seen')==='1'){intro.remove();return;}}catch(e){}
 const finish=()=>{intro.classList.add('ca-hide');try{sessionStorage.setItem('ca-intro-seen','1')}catch(e){};setTimeout(()=>intro.remove(),500)};
 const skip=document.getElementById('ca-intro-skip');
 if(skip)skip.addEventListener('click',finish);
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 setTimeout(finish,reduced?120:2400);
})();
