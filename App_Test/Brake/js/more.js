/*
 "apps" sheet structure (A:H):
 A = Subject (folder)      B = Sub-Subject (sub-folder)
 C = App display name      D = HTML file name
 E = Icon (emoji / IMAGE() / URL)
 F = Admin access   G = Supervisor access   H = Staff access
 Condition 1: A+B filled  → Subject > Sub-Subject > App
 Condition 2: A filled, B blank → Subject > App
 Condition 3: A blank → App shown at More root
*/

const APP_CARD_GRADIENTS=[
  'linear-gradient(135deg,#667eea,#764ba2)','linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)','linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)','linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)','linear-gradient(135deg,#a1c4fd,#c2e9fb)'
];
const FOLDER_STRIPE_COLORS=[
  'linear-gradient(135deg,#667eea,#764ba2)','linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)','linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)','linear-gradient(135deg,#f97316,#dc2626)',
  'linear-gradient(135deg,#14b8a6,#0ea5e9)','linear-gradient(135deg,#8b5cf6,#6366f1)'
];

function handleMoreClick(idx){ if(moreClickActions[idx]) moreClickActions[idx](); }

function renderMoreIcon(iconVal,iconFormula){
  if(iconFormula){
    const m=iconFormula.match(/=*\s*IMAGE\s*\(\s*"([^"]+)"/i);
    if(m){ const imgUrl=driveDirect(m[1]); return `<img src="${imgUrl}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='📦'">`; }
  }
  if(iconVal && isUrl(iconVal)){ const imgUrl2=driveDirect(iconVal); return `<img src="${imgUrl2}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='📦'">`; }
  if(iconVal && /^https?:\/\/lh[0-9]+\.googleusercontent\.com/i.test(iconVal)) return `<img src="${iconVal}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='📦'">`;
  return iconVal || '📦';
}

async function loadMoreApps(){
  if(moreAppsLoaded) return;
  const container=document.getElementById('moreAppsContainer');
  container.innerHTML='<div class="more-loading">⏳ Loading apps list…</div>';
  try{
    const [rows,formulaRows]=await Promise.all([
      fetchSheet(CONFIG.APPS_SHEET_NAME,'A:H'),
      fetchSheetFormulas(CONFIG.APPS_SHEET_NAME,'A:H')
    ]);
    moreTree={ subjectOrder:[], subjects:{}, rootApps:[] };
    for(let i=1;i<rows.length;i++){
      const row=rows[i]||[], fRow=formulaRows[i]||[];
      const subject=String(row[0]||'').trim(), subSubject=String(row[1]||'').trim();
      const appName=String(row[2]||'').trim(), fileName=String(row[3]||'').trim();
      const iconVal=String(row[4]||'').trim(), iconFormula=String(fRow[4]||'').trim();
      const adminAccess=String(row[5]||'false').trim().toLowerCase()==='true';
      const supervisorAccess=String(row[6]||'false').trim().toLowerCase()==='true';
      const staffAccess=String(row[7]||'false').trim().toLowerCase()==='true';
      if(!appName && !subject) continue;

      /* ⭐ role-based access check — extend this if you add a new role */
      const access=currentLevel==='admin'?adminAccess:currentLevel==='supervisor'?supervisorAccess:staffAccess;
      const app={ name:appName, file:fileName, iconVal, iconFormula, access };

      if(!subject){ if(appName) moreTree.rootApps.push(app); continue; }
      if(!moreTree.subjects[subject]){ moreTree.subjectOrder.push(subject); moreTree.subjects[subject]={ subSubjectOrder:[], subSubjects:{}, directApps:[] }; }
      const subj=moreTree.subjects[subject];
      if(!subSubject){ if(appName) subj.directApps.push(app); continue; }
      if(!subj.subSubjects[subSubject]){ subj.subSubjectOrder.push(subSubject); subj.subSubjects[subSubject]={ apps:[] }; }
      if(appName) subj.subSubjects[subSubject].apps.push(app);
    }
    moreNavPath=[]; renderMoreView(); moreAppsLoaded=true;
  }catch(e){
    container.innerHTML='<div class="more-empty"><p>⚠️ Error loading apps.<br>'+e.message+'</p></div>';
  }
}

function renderMoreView(){
  renderMoreBreadcrumb();
  const container=document.getElementById('moreAppsContainer');
  const desc=document.getElementById('moreHeaderDesc');
  if(moreNavPath.length===0){ desc.textContent='Select a category below to explore'; renderRootView(container); }
  else if(moreNavPath.length===1){ desc.textContent=moreNavPath[0]+' — Browse apps & sub-folders'; renderSubjectView(container,moreNavPath[0]); }
  else if(moreNavPath.length===2){ desc.textContent=moreNavPath[1]+' — Select an app to launch'; renderSubSubjectView(container,moreNavPath[0],moreNavPath[1]); }
}

function renderMoreBreadcrumb(){
  const bc=document.getElementById('moreBreadcrumb');
  if(!bc) return;
  if(moreNavPath.length===0){ bc.innerHTML=''; return; }
  moreClickActions=[];
  let html='<div class="more-breadcrumb">';
  const rootIdx=moreClickActions.length; moreClickActions.push(()=>navigateMoreTo([]));
  html+=`<span class="more-breadcrumb-item" onclick="handleMoreClick(${rootIdx})">📦 More</span>`;
  if(moreNavPath.length>=1){
    html+='<span class="more-breadcrumb-separator">›</span>';
    if(moreNavPath.length===1){ html+=`<span class="more-breadcrumb-current">📁 ${moreNavPath[0]}</span>`; }
    else{
      const sIdx=moreClickActions.length; moreClickActions.push(()=>navigateMoreTo([moreNavPath[0]]));
      html+=`<span class="more-breadcrumb-item" onclick="handleMoreClick(${sIdx})">📁 ${moreNavPath[0]}</span>`;
    }
  }
  if(moreNavPath.length>=2){
    html+='<span class="more-breadcrumb-separator">›</span>';
    html+=`<span class="more-breadcrumb-current">📂 ${moreNavPath[1]}</span>`;
  }
  html+='</div>';
  bc.innerHTML=html;
}

function navigateMoreTo(path){ moreNavPath=path; renderMoreView(); }

function renderRootView(container){
  const subjects=moreTree.subjectOrder, rootApps=moreTree.rootApps;
  if(subjects.length===0 && rootApps.length===0){
    container.innerHTML='<div class="more-empty"><p>⚠️ No apps configured yet.<br>Add apps to the "apps" sheet.</p></div>';
    return;
  }
  moreClickActions=[]; let html=''; let anyAccessible=false;

  if(subjects.length>0){
    if(rootApps.length>0) html+='<div class="more-section-divider">📁 Categories</div>';
    html+='<div class="more-apps-grid">';
    subjects.forEach((sName,idx)=>{
      const subj=moreTree.subjects[sName];
      const totalItems=subj.subSubjectOrder.length+subj.directApps.length;
      const stripe=FOLDER_STRIPE_COLORS[idx%FOLDER_STRIPE_COLORS.length];
      let folderAccess=subj.directApps.some(a=>a.access);
      if(!folderAccess){ for(const ssN of subj.subSubjectOrder){ if(subj.subSubjects[ssN].apps.some(a=>a.access)){ folderAccess=true; break; } } }
      if(folderAccess){
        anyAccessible=true;
        const ci=moreClickActions.length; moreClickActions.push(()=>navigateMoreTo([sName]));
        html+=`<div class="more-folder-card" onclick="handleMoreClick(${ci})">
          <div class="more-app-badge" style="background:${stripe}">OPEN</div>
          <span class="more-folder-icon">📁</span>
          <div class="more-folder-name">${sName}</div>
          <div class="more-folder-count">${totalItems} item${totalItems!==1?'s':''}</div></div>`;
      }else{
        html+=`<div class="more-folder-card locked">
          <div class="more-app-badge" style="background:#94a3b8">🔒 LOCKED</div>
          <span class="more-folder-icon" style="filter:grayscale(1)">📁</span>
          <div class="more-folder-name" style="color:#94a3b8">${sName}</div>
          <div class="more-folder-count" style="background:#f1f5f9;color:#94a3b8">No access</div></div>`;
      }
    });
    html+='</div>';
  }

  if(rootApps.length>0){
    if(subjects.length>0) html+='<div class="more-section-divider">📱 Apps</div>';
    html+='<div class="more-apps-grid">';
    rootApps.forEach((app,idx)=>{
      const gradBg=APP_CARD_GRADIENTS[idx%APP_CARD_GRADIENTS.length];
      const iconHtml=renderMoreIcon(app.iconVal,app.iconFormula);
      if(app.access && app.file){
        anyAccessible=true;
        const ci=moreClickActions.length; moreClickActions.push(()=>openEmbeddedApp(app.name,app.file));
        html+=`<div class="more-app-card" onclick="handleMoreClick(${ci})">
          <div class="more-app-badge" style="background:${gradBg}">LAUNCH</div>
          <span class="more-app-icon">${iconHtml}</span>
          <div class="more-app-name">${app.name}</div>
          <div class="more-app-desc">Tap to open</div></div>`;
      }else{
        html+=`<div class="more-app-card future">
          <div class="more-app-badge" style="background:#94a3b8">LOCKED</div>
          <span class="more-app-icon" style="filter:grayscale(1)">${iconHtml}</span>
          <div class="more-app-name" style="color:#94a3b8">${app.name}</div>
          <div class="more-app-desc" style="color:#cbd5e1">No access</div></div>`;
      }
    });
    html+='</div>';
  }
  if(!anyAccessible) html+=`<div class="more-access-denied">🔒 No apps are available for your access level (${currentLevel}). Please contact Admin.</div>`;
  container.innerHTML=html;
}

function renderSubjectView(container,subjectName){
  const subj=moreTree.subjects[subjectName];
  if(!subj){ container.innerHTML='<div class="more-empty"><p>❌ Subject not found</p></div>'; return; }
  moreClickActions=[]; let html='';
  const backIdx=moreClickActions.length; moreClickActions.push(()=>navigateMoreTo([]));
  html+=`<div class="more-back-row"><button class="more-back-btn" onclick="handleMoreClick(${backIdx})">← Back to All Categories</button></div>`;

  const hasSubSubs=subj.subSubjectOrder.length>0, hasDirectApps=subj.directApps.length>0;

  if(hasSubSubs){
    if(hasDirectApps) html+='<div class="more-section-divider">📂 Sub-Folders</div>';
    html+='<div class="more-apps-grid">';
    subj.subSubjectOrder.forEach((ssName,idx)=>{
      const ss=subj.subSubjects[ssName]; if(!ss) return;
      const appCount=ss.apps.length;
      const stripe=FOLDER_STRIPE_COLORS[(idx+2)%FOLDER_STRIPE_COLORS.length];
      const anyAccess=ss.apps.some(a=>a.access);
      if(anyAccess){
        const ci=moreClickActions.length; moreClickActions.push(()=>navigateMoreTo([subjectName,ssName]));
        html+=`<div class="more-folder-card" onclick="handleMoreClick(${ci})">
          <div class="more-app-badge" style="background:${stripe}">OPEN</div>
          <span class="more-folder-icon">📂</span>
          <div class="more-folder-name">${ssName}</div>
          <div class="more-folder-count">${appCount} app${appCount!==1?'s':''}</div></div>`;
      }else{
        html+=`<div class="more-folder-card locked">
          <div class="more-app-badge" style="background:#94a3b8">🔒 LOCKED</div>
          <span class="more-folder-icon" style="filter:grayscale(1)">📂</span>
          <div class="more-folder-name" style="color:#94a3b8">${ssName}</div>
          <div class="more-folder-count" style="background:#f1f5f9;color:#94a3b8">No access</div></div>`;
      }
    });
    html+='</div>';
  }

  if(hasDirectApps){
    if(hasSubSubs) html+='<div class="more-section-divider">📱 Apps</div>';
    html+='<div class="more-apps-grid">';
    subj.directApps.forEach((app,idx)=>{
      const gradBg=APP_CARD_GRADIENTS[(idx+4)%APP_CARD_GRADIENTS.length];
      const iconHtml=renderMoreIcon(app.iconVal,app.iconFormula);
      if(app.access && app.file){
        const ci=moreClickActions.length; moreClickActions.push(()=>openEmbeddedApp(app.name,app.file));
        html+=`<div class="more-app-card" onclick="handleMoreClick(${ci})">
          <div class="more-app-badge" style="background:${gradBg}">LAUNCH</div>
          <span class="more-app-icon">${iconHtml}</span>
          <div class="more-app-name">${app.name}</div>
          <div class="more-app-desc">Tap to open</div></div>`;
      }else{
        html+=`<div class="more-app-card future">
          <div class="more-app-badge" style="background:#94a3b8">LOCKED</div>
          <span class="more-app-icon" style="filter:grayscale(1)">${iconHtml}</span>
          <div class="more-app-name" style="color:#94a3b8">${app.name}</div>
          <div class="more-app-desc" style="color:#cbd5e1">No access</div></div>`;
      }
    });
    html+='</div>';
  }
  if(!hasSubSubs && !hasDirectApps) html+='<div class="more-empty"><p>📭 This folder is empty.<br>No sub-folders or apps found.</p></div>';
  container.innerHTML=html;
}

function renderSubSubjectView(container,subjectName,subSubjectName){
  const subj=moreTree.subjects[subjectName];
  const ss=subj?subj.subSubjects[subSubjectName]:null;
  if(!ss){ container.innerHTML='<div class="more-empty"><p>❌ Sub-folder not found</p></div>'; return; }
  moreClickActions=[]; let html='';
  const backIdx=moreClickActions.length; moreClickActions.push(()=>navigateMoreTo([subjectName]));
  html+=`<div class="more-back-row"><button class="more-back-btn" onclick="handleMoreClick(${backIdx})">← Back to ${subjectName}</button></div>`;

  if(ss.apps.length===0){ html+='<div class="more-empty"><p>📭 No apps in this folder yet.</p></div>'; container.innerHTML=html; return; }

  html+='<div class="more-section-divider">📱 Apps</div><div class="more-apps-grid">';
  ss.apps.forEach((app,idx)=>{
    const gradBg=APP_CARD_GRADIENTS[idx%APP_CARD_GRADIENTS.length];
    const iconHtml=renderMoreIcon(app.iconVal,app.iconFormula);
    if(app.access && app.file){
      const ci=moreClickActions.length; moreClickActions.push(()=>openEmbeddedApp(app.name,app.file));
      html+=`<div class="more-app-card" onclick="handleMoreClick(${ci})">
        <div class="more-app-badge" style="background:${gradBg}">LAUNCH</div>
        <span class="more-app-icon">${iconHtml}</span>
        <div class="more-app-name">${app.name}</div>
        <div class="more-app-desc">Tap to open</div></div>`;
    }else{
      html+=`<div class="more-app-card future">
        <div class="more-app-badge" style="background:#94a3b8">LOCKED</div>
        <span class="more-app-icon" style="filter:grayscale(1)">${iconHtml}</span>
        <div class="more-app-name" style="color:#94a3b8">${app.name}</div>
        <div class="more-app-desc" style="color:#cbd5e1">No access</div></div>`;
    }
  });
  html+='</div>';
  container.innerHTML=html;
}
