/* ===================== FETCH HELPERS ===================== */
async function fetchSheet(sheetName, range){
  const url = `${CONFIG.WORKER_URL}?sheetId=${CONFIG.SHEET_ID}&range=${encodeURIComponent(sheetName+'!'+range)}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`API Error ${res.status}`);
  const data = await res.json();
  return data.values || [];
}

async function fetchSheetFormulas(sheetName, range){
  const url = `${CONFIG.WORKER_URL}?sheetId=${CONFIG.SHEET_ID}&range=${encodeURIComponent(sheetName+'!'+range)}&renderOption=FORMULA`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`API Error ${res.status}`);
  const data = await res.json();
  return data.values || [];
}

/* ===================== URL / IMAGE HELPERS ===================== */
function isUrl(s){ return typeof s==="string" && /^https?:\/\//i.test(s); }

function driveDirect(u){
  if(typeof u!=="string") return u;
  let m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if(m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  m = u.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if(m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return u;
}

function extractImage(v){
  if(typeof v!=="string") return null;
  const m = v.match(/=*\s*IMAGE\s*\(\s*"([^"]+)"/i);
  if(m) return driveDirect(m[1]);
  if(isUrl(v) && /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(v)) return driveDirect(v);
  return null;
}

function driveFileId(u){
  if(typeof u!=="string") return null;
  let m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if(m) return m[1];
  m = u.match(/[?&]id=([^&]+)/i);
  if(m) return m[1];
  return null;
}

/* ===================== PERSONAL INFO CARD ===================== */
function buildPersonalHTML(targetId){
  const div = document.getElementById(targetId);
  if(!div) return;
  if(currentUserPersonal.some(v=>v)){
    let html='<div class="personal-card"><h3>👤 Personal Information</h3><div class="personal-grid">';
    html+=`<div class="personal-item"><div class="p-label">User ID</div><div class="p-value">${currentUser}</div></div>`;
    html+=`<div class="personal-item"><div class="p-label">Level</div><div class="p-value">${currentLevel}</div></div>`;
    CONFIG.PERSONAL_DATA_LABELS.forEach((label,i)=>{
      const val=currentUserPersonal[i];
      if(val) html+=`<div class="personal-item"><div class="p-label">${label}</div><div class="p-value">${val}</div></div>`;
    });
    html+='</div></div>';
    div.innerHTML=html;
  } else {
    div.innerHTML='';
  }
}
