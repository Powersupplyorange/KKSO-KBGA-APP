let allMyEntries=[];

async function loadMyData(){
  const lc=getLevelCols(currentLevel);
  allMyEntries=[];
  const sheetNames=[...new Set(entryConfig.filter(r=>r && String(r[lc.sheetCol]||'').trim()).map(r=>String(r[lc.sheetCol]).trim()))];

  for(const sn of sheetNames){
    try{
      const data=await fetchSheet(sn,'K:'+CONFIG.DATA_FETCH_END_COL);
      for(let i=0;i<data.length;i++){
        const row=data[i]||[];
        const submitter=String(row[15]||'').trim();
        if(submitter===currentUser){
          allMyEntries.push({ sheet:sn, subject:String(row[0]||'').trim(), subSubject:String(row[1]||'').trim(), data:row, rowIdx:i+1 });
        }
      }
    }catch(e){}
  }

  allMyEntries.sort((a,b)=>{
    const da=String((a.data||[])[16]||''); const db=String((b.data||[])[16]||'');
    return db.localeCompare(da);
  });

  const now=new Date(); const todayStr=now.toLocaleDateString('en-GB');
  const weekAgo=new Date(now); weekAgo.setDate(weekAgo.getDate()-7);
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
  let today=0, week=0, month=0;
  allMyEntries.forEach(e=>{
    const ds=String((e.data||[])[16]||'');
    if(ds.startsWith(todayStr)) today++;
    const parts=ds.split(/[/,\s]+/);
    if(parts.length>=3){
      const d=new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
      if(!isNaN(d)){ if(d>=weekAgo) week++; if(d>=monthStart) month++; }
    }
  });

  document.getElementById('statTotal').textContent=allMyEntries.length;
  document.getElementById('statToday').textContent=today;
  document.getElementById('statWeek').textContent=week;
  document.getElementById('statMonth').textContent=month;

  const mySubjects=[...new Set(allMyEntries.map(e=>e.subject).filter(v=>v))];
  const filterSel=document.getElementById('mySubjectFilter');
  filterSel.innerHTML='<option value="">-- All Entries --</option>';
  mySubjects.forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=s; filterSel.appendChild(o); });
  filterSel.onchange=()=>renderMyEntries(filterSel.value);
  renderMyEntries('');
}

function renderMyEntries(filterSubject){
  const container=document.getElementById('myEntriesTable');
  let entries=allMyEntries;
  if(filterSubject) entries=entries.filter(e=>e.subject===filterSubject);
  if(!entries.length){ container.innerHTML='<div style="text-align:center;color:#64748b;padding:20px">No entries found</div>'; return; }

  const lc=getLevelCols(currentLevel);
  let headers=['SL','Subject'];
  let useDetailedHeaders=false, detailedConfig=null;

  if(filterSubject){
    const cfgRow=entryConfig.find(r=>r && String(r[0]||'').trim()===filterSubject && String(r[lc.sheetCol]||'').trim());
    if(cfgRow){
      detailedConfig=cfgRow; useDetailedHeaders=true;
      const hasSub=String(cfgRow[lc.subCol]||'').trim().toLowerCase()==='true';
      const baseCol=hasSub?2:1;
      const inputCount=Math.max(0,parseInt(cfgRow[25]||'0',10)||0);
      if(hasSub) headers.push('Sub-Subject');
      for(let i=0;i<inputCount;i++) headers.push(String(cfgRow[baseCol+i]||'Input '+(i+1)));
    }
  }
  if(!useDetailedHeaders) headers.push('Data');
  headers.push('Date/Time');

  let html='<div class="history-scroll"><table class="history-table"><thead><tr>';
  headers.forEach(h=>{ html+=`<th>${h}</th>`; });
  html+='</tr></thead><tbody>';

  entries.forEach((entry,idx)=>{
    html+='<tr>';
    html+=`<td>${idx+1}</td>`;
    html+=`<td>${entry.subject}</td>`;
    if(useDetailedHeaders && detailedConfig){
      const hasSub=String(detailedConfig[lc.subCol]||'').trim().toLowerCase()==='true';
      const inputCount=Math.max(0,parseInt(detailedConfig[25]||'0',10)||0);
      if(hasSub) html+=`<td>${entry.subSubject||''}</td>`;
      const dataStart=hasSub?2:1;
      for(let i=0;i<inputCount;i++) html+=`<td>${String((entry.data||[])[dataStart+i]||'')}</td>`;
    }else{
      const dataCols=[];
      for(let i=1;i<15;i++){ const v=(entry.data||[])[i]; if(v) dataCols.push(v); }
      html+=`<td>${dataCols.join(', ')}</td>`;
    }
    html+=`<td>${String((entry.data||[])[16]||'')}</td>`;
    html+='</tr>';
  });

  html+='</tbody></table></div>';
  container.innerHTML=html;
}

function exportPDF(){
  switchMode('mydata');
  switchMyData('entries');
  setTimeout(()=>{ window.print(); },300);
}
