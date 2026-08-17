function openPasswordModal(){
  document.getElementById('pwdModal').style.display='flex';
  document.getElementById('pwdCurrent').value='';
  document.getElementById('pwdNew').value='';
  document.getElementById('pwdConfirm').value='';
  document.getElementById('pwdMessage').textContent='';
}
function closePasswordModal(){
  document.getElementById('pwdModal').style.display='none';
}

async function handlePasswordChange(){
  const cur=document.getElementById('pwdCurrent').value;
  const nw=document.getElementById('pwdNew').value;
  const cf=document.getElementById('pwdConfirm').value;
  const msg=document.getElementById('pwdMessage');

  if(!cur||!nw||!cf){ msg.textContent='❌ Fill all fields'; msg.style.color='#dc2626'; return; }
  if(cur!==currentPassword){ msg.textContent='❌ Current password wrong'; msg.style.color='#dc2626'; return; }
  if(nw!==cf){ msg.textContent='❌ Passwords do not match'; msg.style.color='#dc2626'; return; }
  if(nw.length<4){ msg.textContent='❌ Min 4 characters'; msg.style.color='#dc2626'; return; }
  if(nw===cur){ msg.textContent='❌ Same as current'; msg.style.color='#dc2626'; return; }

  try{
    msg.textContent='Changing...'; msg.style.color='#2563eb';
    await fetch(CONFIG.APPS_SCRIPT_URL,{
      method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ spreadsheetId:CONFIG.SHEET_ID, sheetName:CONFIG.SHEET_NAME, action:'changePassword', row:currentUserRow, newPassword:nw })
    });
    currentPassword=nw;
    localStorage.setItem('kkso_password',nw);
    msg.textContent='✅ Password changed! Logging out...'; msg.style.color='#16a34a';
    setTimeout(()=>{ closePasswordModal(); handleLogout(); },2000);
  }catch(e){
    msg.textContent='❌ Error: '+e.message; msg.style.color='#dc2626';
  }
}
