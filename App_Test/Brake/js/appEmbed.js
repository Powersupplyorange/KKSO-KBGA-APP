function openEmbeddedApp(appName,fileName){
  let url=fileName;
  if(!/^https?:\/\//i.test(fileName)) url=CONFIG.GITHUB_BASE_URL.replace(/\/$/,'')+'/'+fileName;

  const wrapper=document.getElementById('appEmbedWrapper');
  const iframe=document.getElementById('appEmbedIframe');
  const titleEl=document.getElementById('appEmbedTitle');
  const loadingEl=document.getElementById('appEmbedLoading');

  titleEl.textContent=appName;
  loadingEl.style.display='flex';
  iframe.src='';
  wrapper.classList.add('visible');
  document.body.style.overflow='hidden';
  setTimeout(()=>{ iframe.src=url; },80);
}

function onIframeLoad(){
  const loadingEl=document.getElementById('appEmbedLoading');
  if(loadingEl) loadingEl.style.display='none';
}

function closeEmbeddedApp(){
  const wrapper=document.getElementById('appEmbedWrapper');
  const iframe=document.getElementById('appEmbedIframe');
  wrapper.classList.remove('visible');
  document.body.style.overflow='';
  setTimeout(()=>{ iframe.src=''; },300);
}

document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeEmbeddedApp(); });
