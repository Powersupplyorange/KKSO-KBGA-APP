/* ===================== LOGIN ===================== */
async function handleLogin(){
  const uid=document.getElementById('loginUser').value.trim();
  const pwd=document.getElementById('loginPass').value.trim();
  const errEl=document.getElementById('loginError');
  errEl.style.display='none';
  if(!uid||!pwd){ errEl.textContent='Please enter User ID and Password'; errEl.style.display='block'; return; }
  try{
    const range=`A${CONFIG.USER_START_ROW}:J${CONFIG.USER_END_ROW}`;
    const users=await fetchSheet(CONFIG.SHEET_NAME,range);
    let found=false;
    for(let i=0;i<users.length;i++){
      const row=users[i]||[];
      if(String(row[0]||'').trim()===uid && String(row[1]||'').trim()===pwd){
        currentUser=uid; currentPassword=pwd;
        currentLevel=String(row[2]||'staff').trim().toLowerCase();
        currentUserRow=CONFIG.USER_START_ROW+i;
        currentUserPersonal=row.slice(3,10);
        found=true; break;
      }
    }
    if(!found){ errEl.textContent='You are not registered'; errEl.style.display='block'; return; }
    localStorage.setItem('kkso_user',currentUser);
    localStorage.setItem('kkso_password',currentPassword);
    localStorage.setItem('kkso_level',currentLevel);
    localStorage.setItem('kkso_row',String(currentUserRow));
    showApp();
  }catch(e){
    errEl.textContent='Connection error: '+e.message; errEl.style.display='block';
  }
}

/* ===================== SHOW APP (after login) ===================== */
function showApp(){
  document.getElementById('loginPage').style.display='none';
  document.getElementById('appPage').style.display='block';
  document.getElementById('userAvatar').textContent=currentUser.charAt(0).toUpperCase();
  document.getElementById('userName').textContent=currentUser;

  const info=getRoleInfo(currentLevel); // ⭐ from roles.js
  document.getElementById('userLevel').textContent=info.icon+' '+info.name;
  document.getElementById('titleLevel').textContent='A Cloud Based Data System For '+info.name+' Level';
  document.getElementById('versionText').textContent='© Created by SSE/M/KKSO | v'+APP_VERSION;
  document.body.className=info.theme;

  if(!appInitialized) initApp();
  startCredentialCheck();
}

/* ===================== LOGOUT ===================== */
function handleLogout(){
  if(credentialCheckInterval) clearInterval(credentialCheckInterval);
  document.removeEventListener('visibilitychange',onVisibilityCredCheck);
  lastCredentialCheck=0;

  localStorage.removeItem('kkso_user'); localStorage.removeItem('kkso_password');
  localStorage.removeItem('kkso_level'); localStorage.removeItem('kkso_row');

  currentUser=''; currentPassword=''; currentLevel=''; currentUserRow=-1; currentUserPersonal=[];
  appInitialized=false; moreAppsLoaded=false; moreNavPath=[]; moreClickActions=[]; moreTree={};

  document.getElementById('appPage').style.display='none';
  document.getElementById('loginPage').style.display='flex';
  document.getElementById('loginUser').value='';
  document.getElementById('loginPass').value='';
  document.getElementById('loginError').style.display='none';
  document.body.className='';

  document.getElementById('viewSubject').innerHTML='<option value="">-- Select Subject --</option>';
  document.getElementById('entrySubject').innerHTML='<option value="">-- Select Subject --</option>';
  document.getElementById('mySubjectFilter').innerHTML='<option value="">-- All Entries --</option>';
  document.getElementById('moreAppsContainer').innerHTML='<div class="more-loading">⏳ Loading apps...</div>';
  document.getElementById('moreBreadcrumb').innerHTML='';

  closeEmbeddedApp(); // from appEmbed.js
}

/* ===================== CREDENTIAL CHECK (security) ===================== */
/* Ravi: checks every hour AND when tab becomes visible again (phone wake) */
async function doCredentialCheck(){
  if(!currentUser||!currentPassword) return;
  const now=Date.now();
  if(now-lastCredentialCheck<300000) return; // max once per 5 min
  try{
    const range=`A${CONFIG.USER_START_ROW}:B${CONFIG.USER_END_ROW}`;
    const users=await fetchSheet(CONFIG.SHEET_NAME,range);
    let valid=false;
    for(const row of users){
      if(row && String(row[0]||'').trim()===currentUser && String(row[1]||'').trim()===currentPassword){ valid=true; break; }
    }
    lastCredentialCheck=Date.now();
    if(!valid){ alert('Your credentials have been changed or removed. You will be logged out.'); handleLogout(); }
  }catch(e){ /* network error — skip, retry later */ }
}

function startCredentialCheck(){
  if(credentialCheckInterval) clearInterval(credentialCheckInterval);
  lastCredentialCheck=Date.now();
  credentialCheckInterval=setInterval(()=>{ doCredentialCheck(); }, CONFIG.CREDENTIAL_CHECK_INTERVAL);
  document.removeEventListener('visibilitychange',onVisibilityCredCheck);
  document.addEventListener('visibilitychange',onVisibilityCredCheck);
}

function onVisibilityCredCheck(){
  if(document.visibilityState==='visible' && currentUser){
    if(Date.now()-lastCredentialCheck>=CONFIG.CREDENTIAL_CHECK_INTERVAL) doCredentialCheck();
  }
}
