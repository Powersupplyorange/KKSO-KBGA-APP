// ===== app.js =====
document.addEventListener('DOMContentLoaded', () => {
  const btnEntry = document.getElementById('btnEntry');
  const btnView  = document.getElementById('btnView');
  const entryPage = document.getElementById('entryPage');
  const viewPage  = document.getElementById('viewPage');

  btnEntry.addEventListener('click', () => {
    btnEntry.classList.add('active');
    btnView.classList.remove('active');
    entryPage.classList.add('active');
    viewPage.classList.remove('active');
  });

  btnView.addEventListener('click', () => {
    btnView.classList.add('active');
    btnEntry.classList.remove('active');
    viewPage.classList.add('active');
    entryPage.classList.remove('active');
    if (typeof initView === 'function') initView();
  });
});