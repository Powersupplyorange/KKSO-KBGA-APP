/* ===================== CLOCK ===================== */
/* Ravi you can change the clock format here */
function updateClock(){
  const el=document.querySelector('.clock-widget');
  if(!el) return;
  const now=new Date();
  el.querySelector('.day').textContent=now.toLocaleDateString(undefined,{weekday:'short'});
  el.querySelector('.date').textContent=now.toLocaleDateString(undefined,{year:'2-digit',month:'short',day:'numeric'});
  el.querySelector('.time').textContent=now.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
updateClock();
setInterval(updateClock,1000);
