/* ===================== SESSION RESTORE ===================== */
/* runs after every module is loaded, so showApp()/initApp() are safe to call */
(function(){
  const u=localStorage.getItem('kkso_user'), p=localStorage.getItem('kkso_password');
  const l=localStorage.getItem('kkso_level'), r=localStorage.getItem('kkso_row');
  if(u && p){
    currentUser=u; currentPassword=p; currentLevel=l||'staff'; currentUserRow=parseInt(r)||-1;
    showApp();
  }
})();
