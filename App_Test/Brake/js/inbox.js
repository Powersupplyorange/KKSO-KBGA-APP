let inboxData=[];

async function loadInbox(){
  buildPersonalHTML('inboxPersonalInfo');
  try{
    const data=await fetchSheet(CONFIG.INBOX_SHEET_NAME,'A:J');
    inboxData=[];
    let userEmail='';
    if(currentUserRow>0){
      try{
        const pe=await fetchSheet(CONFIG.SHEET_NAME,`J${currentUserRow}:J${currentUserRow}`);
        userEmail=String((pe[0]||[])[0]||'').trim();
      }catch(e){}
    }
    for(let i=0;i<data.length;i++){
      const row=data[i]||[];
      if(String(row[0]||'').trim()===currentUser){
        inboxData.push({
          row:i+1, to:row[0]||'', from:row[1]||'', date:row[2]||'',
          type:String(row[3]||'message').toLowerCase(), subject:row[4]||'', message:row[5]||'',
          link:row[6]||'', status:String(row[7]||'unread').toLowerCase(),
          priority:String(row[8]||'medium').toLowerCase(), email:String(row[9]||'').trim()||userEmail
        });
      }
    }
    inboxData.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    renderInboxStats(); renderInboxCards('all');
    const unread=inboxData.filter(m=>m.status==='unread').length;
    const badge=document.getElementById('unreadBadge');
    if(unread>0){ badge.textContent=unread; badge.style.display='inline-flex'; } else { badge.style.display='none'; }
  }catch(e){
    document.getElementById('inboxCards').innerHTML='<div style="text-align:center;color:#64748b;padding:20px">No inbox data or error loading</div>';
  }
}

function renderInboxStats(){
  const total=inboxData.length, unread=inboxData.filter(m=>m.status==='unread').length;
  const tasks=inboxData.filter(m=>m.type==='task' && m.status!=='done').length;
  const high=inboxData.filter(m=>m.priority==='high' && m.status!=='done').length;
  document.getElementById('inboxStats').innerHTML=`
    <div class="inbox-stat"><div class="is-num">${total}</div><div class="is-label">Total</div></div>
    <div class="inbox-stat"><div class="is-num" style="color:#ef4444">${unread}</div><div class="is-label">Unread</div></div>
    <div class="inbox-stat"><div class="is-num" style="color:#2563eb">${tasks}</div><div class="is-label">Tasks</div></div>
    <div class="inbox-stat"><div class="is-num" style="color:#dc2626">${high}</div><div class="is-label">High Priority</div></div>`;

  const types=['all','task','pdf','message','notice'];
  const typeIcons={all:'📬',task:'📋',pdf:'📄',message:'💬',notice:'📢'};
  let fhtml='';
  types.forEach(t=>{ fhtml+=`<button class="inbox-filter-btn ${t==='all'?'active':''}" onclick="filterInbox('${t}')">${typeIcons[t]} ${t.charAt(0).toUpperCase()+t.slice(1)}</button>`; });
  document.getElementById('inboxFilters').innerHTML=fhtml;
}

function filterInbox(type){
  document.querySelectorAll('.inbox-filter-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  renderInboxCards(type);
}

function renderInboxCards(type){
  let items=type==='all'?inboxData:inboxData.filter(m=>m.type===type);
  const container=document.getElementById('inboxCards');
  if(!items.length){ container.innerHTML='<div style="text-align:center;color:#64748b;padding:20px">No messages</div>'; return; }

  let html='';
  items.forEach(m=>{
    const priBadge=m.priority==='high'?'badge-high':m.priority==='low'?'badge-low':'badge-medium';
    const priText=m.priority==='high'?'🔴 High':m.priority==='low'?'🟢 Low':'🟡 Medium';
    const typeBadge='badge-'+m.type; const typeText=m.type.charAt(0).toUpperCase()+m.type.slice(1);
    const statusBadge=m.status==='unread'?'badge-unread':m.status==='done'?'badge-done':'badge-read';
    const statusText=m.status.charAt(0).toUpperCase()+m.status.slice(1);

    html+=`<div class="inbox-card" style="${m.status==='unread'?'border-left:4px solid #ef4444':''}">
      <div class="inbox-card-header">
        <span class="inbox-badge ${priBadge}">${priText}</span>
        <span class="inbox-badge ${typeBadge}">${typeText}</span>
        <span class="inbox-badge ${statusBadge}">${statusText}</span>
      </div>
      <div class="inbox-card-title">${m.subject}</div>
      <div class="inbox-card-msg">${m.message}</div>
      <div class="inbox-card-footer">
        <div class="inbox-card-meta">From: ${m.from} | ${m.date}</div>
        <div class="inbox-card-actions">`;

    if(m.link){
      if(m.email){
        const fid=driveFileId(m.link);
        const openUrl=fid?`https://drive.google.com/file/d/${fid}/view?authuser=${encodeURIComponent(m.email)}`:m.link;
        html+=`<a href="${openUrl}" target="_blank" class="inbox-file-btn">📂 Open</a>`;
      }else{
        html+=`<button class="inbox-file-btn no-access" onclick="alert('Email not provided. Cannot open file.')">🔒 No Access</button>`;
      }
    }
    if(m.status==='unread') html+=`<button class="inbox-action-btn mark-read" onclick="updateInboxStatus(${m.row},'read',this)">✓ Read</button>`;
    if(m.type==='task' && m.status!=='done') html+=`<button class="inbox-action-btn mark-done" onclick="updateInboxStatus(${m.row},'done',this)">✓ Done</button>`;
    html+=`</div></div></div>`;
  });
  container.innerHTML=html;
}

async function updateInboxStatus(row,status,btnEl){
  if(btnEl){ btnEl.textContent='...'; btnEl.disabled=true; }
  try{
    await fetch(CONFIG.APPS_SCRIPT_URL,{
      method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ spreadsheetId:CONFIG.SHEET_ID, sheetName:CONFIG.INBOX_SHEET_NAME, action:'updateInboxStatus', row:row, status:status })
    });
    setTimeout(async()=>{ await loadInbox(); },2000);
  }catch(e){
    if(btnEl){ btnEl.textContent='Error'; btnEl.disabled=false; }
  }
}
