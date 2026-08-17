/* ===================== MODE SWITCHING ===================== */
function switchMode(mode){
  document.getElementById('viewSection').style.display=mode==='view'?'block':'none';
  document.getElementById('entrySection').style.display=mode==='entry'?'block':'none';
  document.getElementById('mydataSection').style.display=mode==='mydata'?'block':'none';
  document.getElementById('moreSection').style.display=mode==='more'?'block':'none';

  document.getElementById('viewBtn').classList.toggle('active',mode==='view');
  document.getElementById('entryBtn').classList.toggle('active',mode==='entry');
  document.getElementById('mydataBtn').classList.toggle('active',mode==='mydata');
  document.getElementById('moreBtn').classList.toggle('active',mode==='more');

  if(mode==='mydata') loadMyData();
  if(mode==='more') loadMoreApps();
}

function switchMyData(sub){
  document.getElementById('myEntriesSection').style.display=sub==='entries'?'block':'none';
  document.getElementById('myInboxSection').style.display=sub==='inbox'?'block':'none';
  document.getElementById('myEntriesBtn').classList.toggle('active',sub==='entries');
  document.getElementById('myInboxBtn').classList.toggle('active',sub==='inbox');
  if(sub==='inbox') loadInbox();
}

/* ===================== APP INITIALIZATION ===================== */
async function initApp(){
  if(appInitialized) return; appInitialized=true;
  try{
    const vcRange=`A${CONFIG.VIEW_CONFIG_START_ROW}:${CONFIG.CONFIG_END_COL}${CONFIG.VIEW_CONFIG_END_ROW}`;
    const ecRange=`A${CONFIG.ENTRY_CONFIG_START_ROW}:${CONFIG.CONFIG_END_COL}${CONFIG.ENTRY_CONFIG_END_ROW}`;
    const [vc,ec]=await Promise.all([fetchSheet(CONFIG.SHEET_NAME,vcRange),fetchSheet(CONFIG.SHEET_NAME,ecRange)]);
    viewConfig=vc||[]; entryConfig=ec||[];

    const lc=getLevelCols(currentLevel);
    const vSel=document.getElementById('viewSubject');
    vSel.innerHTML='<option value="">-- Select Subject --</option>';
    [...new Set(viewConfig.filter(r=>r&&r[0]&&String(r[lc.sheetCol]||'').trim()).map(r=>String(r[0]).trim()))]
      .forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=s; vSel.appendChild(o); });

    const eSel=document.getElementById('entrySubject');
    eSel.innerHTML='<option value="">-- Select Subject --</option>';
    [...new Set(entryConfig.filter(r=>r&&r[0]&&String(r[lc.sheetCol]||'').trim()).map(r=>String(r[0]).trim()))]
      .forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=s; eSel.appendChild(o); });

    if(currentUserPersonal.length===0 && currentUserRow>0){
      try{
        const pd=await fetchSheet(CONFIG.SHEET_NAME,`D${currentUserRow}:J${currentUserRow}`);
        currentUserPersonal=(pd[0]||[]);
      }catch(e){}
    }
  }catch(e){ console.error('Init error:',e); }
}
