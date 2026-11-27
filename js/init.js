if(currentPage==='blog')renderBlog();
if(currentPage==='post')renderPost(new URLSearchParams(location.search).get('slug'));
