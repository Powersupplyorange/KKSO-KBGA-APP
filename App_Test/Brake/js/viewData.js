let viewState={
  config:[], dataValues:[], dataFormulas:[], filteredIdxs:[],
  inputTitles:[], outputTitles:[], inputValues:{},
  subject:'', subSubject:'', subEnabled:false, baseInputCol:2
};

document.getElementById('viewSubject').addEventListener('change', function(){
  const subject=this.value.trim();
  viewState.subject=subject; viewState.subSubject=''; viewState.inputValues={};
  document.getElementById('viewDropdowns').innerHTML='';
  document.getElementById('viewOutput').innerHTML='';
  const ssGroup=document.getElementById('viewSubSubjectGroup');
  const ssSel=document.getElementById('viewSubSubject');
  ssSel.innerHTML='<option value="">-- Select Sub-Subject --</option>';
  ssGroup.style.display='none';
  if(!subject) return;

  const lc=getLevelCols(currentLevel);
  const rows=viewConfig.filter(r=>r && String(r[0]||'').trim()===subject && String(r[lc.sheetCol]||'').trim());
  if(!rows.length) return;

  const firstRow=rows[0];
  const hasSub=String(firstRow[lc.subCol]||'').trim().toLowerCase()==='true';
  viewState.subEnabled=hasSub;
  if(hasSub){
    ssGroup.style.display='block';
    const subs=[...new Set(rows.map(r=>String(r[1]||'').trim()).filter(v=>v))];
    subs.forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=s; ssSel.appendChild(o); });
  }else{
    applyViewConfig(viewConfig.indexOf(firstRow));
  }
});

document.getElementById('viewSubSubject').addEventListener('change', function(){
  const ss=this.value.trim();
  viewState.subSubject=ss; viewState.inputValues={};
  document.getElementById('viewDropdowns').innerHTML='';
  document.getElementById('viewOutput').innerHTML='';
  if(!ss) return;
  const idx=viewConfig.findIndex(r=>r && String(r[0]||'').trim()===viewState.subject && String(r[1]||'').trim()===ss);
  if(idx>=0) applyViewConfig(idx);
});

async function applyViewConfig(idx){
  const row=viewConfig[idx]||[];
  const lc=getLevelCols(currentLevel);
  viewState.subEnabled=String(row[lc.subCol]||'').trim().toLowerCase()==='true';
  viewState.baseInputCol=viewState.subEnabled?2:1;

  const inputCount=Math.max(0,Math.min(parseInt(row[25]||'0',10)||0,8));
  const outputCount=Math.max(0,Math.min(parseInt(row[26]||'0',10)||0,15));

  const titles=[]; for(let i=0;i<inputCount;i++) titles.push(String(row[viewState.baseInputCol+i]||''));
  viewState.inputTitles=titles;

  viewState.outputTitles=[]; for(let i=0;i<outputCount;i++) viewState.outputTitles.push(String(row[10+i]||''));

  const sheetName=String(row[lc.sheetCol]||'').trim();
  if(!sheetName){ document.getElementById('viewOutput').innerHTML='<div class="panel" style="color:red">No data sheet configured</div>'; return; }

  try{
    document.getElementById('viewOutput').innerHTML='<div class="panel">Loading...</div>';
    const [vals,forms]=await Promise.all([
      fetchSheet(sheetName,'A:'+CONFIG.DATA_FETCH_END_COL),
      fetchSheetFormulas(sheetName,'A:'+CONFIG.DATA_FETCH_END_COL)
    ]);
    viewState.dataValues=vals||[]; viewState.dataFormulas=forms||[];
    viewState.filteredIdxs=[];
    for(let i=0;i<viewState.dataValues.length;i++){
      const r=viewState.dataValues[i]||[];
      if(String(r[0]||'').trim()!==viewState.subject) continue;
      if(viewState.subEnabled && String(r[1]||'').trim()!==viewState.subSubject) continue;
      viewState.filteredIdxs.push(i);
    }
    document.getElementById('viewOutput').innerHTML='';
    if(!viewState.filteredIdxs.length){
      document.getElementById('viewOutput').innerHTML='<div class="panel" style="color:#b00">No data found</div>';
      return;
    }
    buildViewDropdowns(); checkViewOutput();
  }catch(e){
    document.getElementById('viewOutput').innerHTML='<div class="panel" style="color:red">Error: '+e.message+'</div>';
  }
}

function buildViewDropdowns(){
  const container=document.getElementById('viewDropdowns'); container.innerHTML='';
  viewState.inputTitles.forEach((label,idx)=>{
    const div=document.createElement('div'); div.className='form-group';
    const lbl=document.createElement('label'); lbl.textContent=label;
    const wrap=document.createElement('div'); wrap.className='select-wrapper';
    const sel=document.createElement('select'); sel.className='colorful-select g'+(idx%5+2);
    sel.innerHTML=`<option value="">Select ${label}</option>`;
    getViewOptions(idx).forEach(v=>{
      const o=document.createElement('option'); o.value=v; o.textContent=v;
      if(viewState.inputValues[label]===v) o.selected=true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', e=>{ viewState.inputValues[label]=e.target.value; buildViewDropdowns(); checkViewOutput(); });
    wrap.appendChild(sel); div.appendChild(lbl); div.appendChild(wrap); container.appendChild(div);
  });
}

function getViewOptions(curIdx){
  const base=viewState.baseInputCol;
  let idxs=viewState.filteredIdxs.slice();
  for(let i=0;i<curIdx;i++){
    const k=viewState.inputTitles[i], v=viewState.inputValues[k];
    if(v) idxs=idxs.filter(ri=>String((viewState.dataValues[ri]||[])[base+i]||'')===v);
  }
  const set=new Set();
  idxs.forEach(ri=>{ const v=(viewState.dataValues[ri]||[])[base+curIdx]; if(v!=null && v!=='') set.add(String(v)); });
  return [...set];
}

function checkViewOutput(){
  if(viewState.inputTitles.length>0 && !viewState.inputTitles.every(k=>viewState.inputValues[k])){
    document.getElementById('viewOutput').innerHTML=''; return;
  }
  const base=viewState.baseInputCol;
  let idxs=viewState.filteredIdxs.slice();
  viewState.inputTitles.forEach((k,i)=>{
    const v=viewState.inputValues[k];
    if(v) idxs=idxs.filter(ri=>String((viewState.dataValues[ri]||[])[base+i]||'')===v);
  });
  const results=idxs.map(ri=>{
    const rv=viewState.dataValues[ri]||[], rf=viewState.dataFormulas[ri]||[];
    const cells=[]; for(let c=10;c<10+viewState.outputTitles.length;c++) cells.push({value:rv[c]||'',formula:rf[c]||''});
    return cells;
  });
  renderViewOutput(results);
}

function renderViewOutput(data){
  const container=document.getElementById('viewOutput'); container.innerHTML='';
  if(!data.length) return;
  const title=document.createElement('div'); title.className='output-title'; title.textContent='Your Result'; container.appendChild(title);
  const scroll=document.createElement('div'); scroll.className='output-scroll';
  const cols=viewState.outputTitles.length;
  const gridStyle=`grid-template-columns:repeat(${cols},minmax(150px,1fr))`;
  const hdr=document.createElement('div'); hdr.className='output-grid'; hdr.style.cssText=gridStyle;
  viewState.outputTitles.forEach(t=>{ const d=document.createElement('div'); d.textContent=t; d.classList.add('output-header'); hdr.appendChild(d); });
  scroll.appendChild(hdr);
  data.forEach(row=>{
    const r=document.createElement('div'); r.className='output-grid'; r.style.cssText=gridStyle;
    row.forEach(cell=>{
      const d=document.createElement('div');
      const img=extractImage(cell.formula)||extractImage(cell.value);
      if(img){ const el=document.createElement('img'); el.src=img; el.loading='lazy'; el.onclick=()=>window.open(img,'_blank'); d.appendChild(el); }
      else if(isUrl(cell.value)){ const a=document.createElement('a'); a.href=driveDirect(cell.value); a.target='_blank'; a.className='file-link'; a.textContent='image'; d.appendChild(a); }
      else{ d.textContent=cell.value||''; }
      r.appendChild(d);
    });
    scroll.appendChild(r);
  });
  container.appendChild(scroll);
}
