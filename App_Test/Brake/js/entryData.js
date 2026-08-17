let entryState={
  config:[], dataValues:[], filteredIdxs:[], inputTitles:[], dropdownCount:0,
  inputValues:{}, subject:'', subSubject:'', subEnabled:false, baseInputCol:2,
  targetSheet:'', htmlEmbedMode:false, htmlFile:''
};

document.getElementById('entrySubject').addEventListener('change', function(){
  const subject=this.value.trim();
  entryState.subject=subject; entryState.subSubject=''; entryState.inputValues={};
  closeEntryHtmlEmbed(true);
  document.getElementById('entryDropdowns').innerHTML='';
  document.getElementById('entryBtnGroup').style.display='none';
  document.getElementById('entryStatus').innerHTML='';
  const ssGroup=document.getElementById('entrySubSubjectGroup');
  const ssSel=document.getElementById('entrySubSubject');
  ssSel.innerHTML='<option value="">-- Select Sub-Subject --</option>'; ssGroup.style.display='none';
  if(!subject) return;

  const lc=getLevelCols(currentLevel);
  const rows=entryConfig.filter(r=>r && String(r[0]||'').trim()===subject && String(r[lc.sheetCol]||'').trim());
  if(!rows.length) return;
  const firstRow=rows[0];
  const hasSub=String(firstRow[lc.subCol]||'').trim().toLowerCase()==='true';
  entryState.subEnabled=hasSub;
  if(hasSub){
    ssGroup.style.display='block';
    const subs=[...new Set(rows.map(r=>String(r[1]||'').trim()).filter(v=>v))];
    subs.forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=s; ssSel.appendChild(o); });
  }else{
    applyEntryConfig(entryConfig.indexOf(firstRow));
  }
});

document.getElementById('entrySubSubject').addEventListener('change', function(){
  const ss=this.value.trim();
  entryState.subSubject=ss; entryState.inputValues={};
  closeEntryHtmlEmbed(true);
  document.getElementById('entryDropdowns').innerHTML='';
  document.getElementById('entryBtnGroup').style.display='none';
  if(!ss) return;
  const idx=entryConfig.findIndex(r=>r && String(r[0]||'').trim()===entryState.subject && String(r[1]||'').trim()===ss);
  if(idx>=0) applyEntryConfig(idx);
});

function isHtmlFileRef(v){
  if(v===null||v===undefined) return false;
  const s=String(v).trim();
  if(!s) return false;
  return /\.html?(\?.*)?(#.*)?$/i.test(s);
}

async function applyEntryConfig(idx){
  const row=entryConfig[idx]||[];
  const lc=getLevelCols(currentLevel);
  entryState.subEnabled=String(row[lc.subCol]||'').trim().toLowerCase()==='true';
  entryState.baseInputCol=entryState.subEnabled?2:1;
  entryState.targetSheet=String(row[lc.sheetCol]||'').trim();

  const zRaw=row[25];
  if(isHtmlFileRef(zRaw)){
    entryState.htmlEmbedMode=true;
    entryState.htmlFile=String(zRaw).trim();
    entryState.inputTitles=[]; entryState.dropdownCount=0;
    entryState.dataValues=[]; entryState.filteredIdxs=[];
    document.getElementById('entryDropdowns').innerHTML='';
    document.getElementById('entryBtnGroup').style.display='none';
    document.getElementById('entryStatus').innerHTML='';
    openEntryHtmlEmbed(entryState.subject, entryState.subSubject, entryState.htmlFile, entryState.targetSheet, entryState.subEnabled);
    return;
  }

  entryState.htmlEmbedMode=false;
  closeEntryHtmlEmbed(true);
  const totalInputs=Math.max(0,parseInt(row[25]||'0',10)||0);
  entryState.dropdownCount=Math.max(0,parseInt(row[26]||'0',10)||0);
  const titles=[]; for(let i=0;i<totalInputs;i++) titles.push(String(row[entryState.baseInputCol+i]||''));
  entryState.inputTitles=titles;
  if(!entryState.targetSheet) return;

  try{
    const vals=await fetchSheet(entryState.targetSheet,'A:'+CONFIG.DATA_FETCH_END_COL);
    entryState.dataValues=vals||[];
    entryState.filteredIdxs=[];
    for(let i=0;i<entryState.dataValues.length;i++){
      const r=entryState.dataValues[i]||[];
      if(String(r[0]||'').trim()!==entryState.subject) continue;
      if(entryState.subEnabled && String(r[1]||'').trim()!==entryState.subSubject) continue;
      entryState.filteredIdxs.push(i);
    }
    buildEntryFields();
  }catch(e){
    document.getElementById('entryStatus').innerHTML='<div class="status-msg" style="color:red">Error: '+e.message+'</div>';
  }
}

/* ---- Entry HTML Embed (custom form pages) ---- */
function openEntryHtmlEmbed(subject,subSubject,fileName,targetSheet,subEnabled){
  let url=fileName;
  if(!/^https?:\/\//i.test(fileName)) url=CONFIG.GITHUB_BASE_URL.replace(/\/$/,'')+'/'+fileName;

  const params=new URLSearchParams();
  params.set('subject',subject||'');
  if(subEnabled) params.set('subSubject',subSubject||'');
  params.set('sheet',targetSheet||'');
  params.set('user',currentUser||'');
  params.set('level',currentLevel||'');
  url+=(url.includes('?')?'&':'?')+params.toString();

  const wrap=document.getElementById('entryHtmlEmbedSection');
  const iframe=document.getElementById('entryHtmlIframe');
  const titleEl=document.getElementById('entryEmbedTitle');
  const loadingEl=document.getElementById('entryEmbedLoading');

  titleEl.textContent=subSubject?(subject+' / '+subSubject):subject;
  loadingEl.style.display='flex';
  wrap.classList.add('visible');
  document.body.style.overflow='hidden';
  iframe.src='';
  setTimeout(()=>{ iframe.src=url; },80);
}

function onEntryIframeLoad(){
  const loadingEl=document.getElementById('entryEmbedLoading');
  if(loadingEl) loadingEl.style.display='none';
}

function closeEntryHtmlEmbed(silent){
  const wrap=document.getElementById('entryHtmlEmbedSection');
  const iframe=document.getElementById('entryHtmlIframe');
  if(wrap) wrap.classList.remove('visible');
  if(iframe) iframe.src='';
  document.body.style.overflow='';
  entryState.htmlEmbedMode=false;
  if(!silent){
    document.getElementById('entrySubject').value='';
    document.getElementById('entrySubSubject').value='';
    document.getElementById('entrySubSubjectGroup').style.display='none';
    document.getElementById('entryDropdowns').innerHTML='';
    document.getElementById('entryBtnGroup').style.display='none';
    document.getElementById('entryStatus').innerHTML='';
    entryState.subject=''; entryState.subSubject=''; entryState.inputTitles=[];
  }
}

/* ---- Normal text/dropdown entry form ---- */
function buildEntryFields(){
  const container=document.getElementById('entryDropdowns'); container.innerHTML='';
  entryState.inputTitles.forEach((label,idx)=>{
    const div=document.createElement('div'); div.className='form-group';
    const lbl=document.createElement('label'); lbl.textContent=label; div.appendChild(lbl);
    if(idx<entryState.dropdownCount){
      const wrap=document.createElement('div'); wrap.className='select-wrapper';
      const sel=document.createElement('select'); sel.className='colorful-select g'+(idx%5+2); sel.dataset.label=label;
      sel.innerHTML=`<option value="">Select ${label}</option>`;
      getEntryOptions(idx).forEach(v=>{
        const o=document.createElement('option'); o.value=v; o.textContent=v;
        if(entryState.inputValues[label]===v) o.selected=true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', e=>{ entryState.inputValues[label]=e.target.value; buildEntryFields(); });
      wrap.appendChild(sel); div.appendChild(wrap);
    }else{
      const inp=document.createElement('input'); inp.type='text'; inp.placeholder='Enter '+label; inp.dataset.label=label;
      inp.value=entryState.inputValues[label]||'';
      inp.addEventListener('input', e=>{ entryState.inputValues[label]=e.target.value; });
      div.appendChild(inp);
    }
    container.appendChild(div);
  });
  document.getElementById('entryBtnGroup').style.display=entryState.inputTitles.length?'flex':'none';
}

function getEntryOptions(curIdx){
  const base=entryState.baseInputCol;
  let idxs=entryState.filteredIdxs.slice();
  for(let i=0;i<curIdx;i++){
    const k=entryState.inputTitles[i], v=entryState.inputValues[k];
    if(v) idxs=idxs.filter(ri=>String((entryState.dataValues[ri]||[])[base+i]||'')===v);
  }
  const set=new Set();
  idxs.forEach(ri=>{ const v=(entryState.dataValues[ri]||[])[base+curIdx]; if(v!=null && v!=='') set.add(String(v)); });
  return [...set];
}

async function handleEntrySubmit(){
  const statusEl=document.getElementById('entryStatus');
  if(!entryState.inputTitles.every(k=>entryState.inputValues[k])){
    statusEl.innerHTML='<div class="status-msg" style="background:#fef2f2;color:#dc2626">❌ Please fill all fields</div>'; return;
  }
  const dataArr=[entryState.subject];
  if(entryState.subEnabled) dataArr.push(entryState.subSubject);
  entryState.inputTitles.forEach(k=>dataArr.push(entryState.inputValues[k]||''));
  while(dataArr.length<15) dataArr.push('');

  const now=new Date();
  const dt=now.toLocaleDateString('en-GB')+', '+now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  dataArr.push(currentUser); dataArr.push(dt); dataArr.push(currentLevel);

  try{
    statusEl.innerHTML='<div class="status-msg" style="background:#eff6ff;color:#2563eb">Submitting...</div>';
    await fetch(CONFIG.APPS_SCRIPT_URL,{
      method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ spreadsheetId:CONFIG.SHEET_ID, sheetName:entryState.targetSheet, data:dataArr })
    });
    statusEl.innerHTML='<div class="status-msg" style="background:#f0fdf4;color:#16a34a">✅ Data submitted successfully</div>';
    entryState.inputTitles.forEach((k,i)=>{ if(i>=entryState.dropdownCount) entryState.inputValues[k]=''; });
    buildEntryFields();
  }catch(e){
    statusEl.innerHTML='<div class="status-msg" style="background:#fef2f2;color:#dc2626">❌ Error: '+e.message+'</div>';
  }
}

function handleEntryClear(){
  entryState.inputTitles.forEach((k,i)=>{ if(i>=entryState.dropdownCount) entryState.inputValues[k]=''; });
  document.getElementById('entryStatus').innerHTML='';
  buildEntryFields();
}
