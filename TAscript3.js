// ===================== script.js (combined) =====================

// ---------- Shared / URL params ----------
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

const loggedInUser  = getUrlParam('user');
const loggedInLevel = getUrlParam('level');

const displayName = loggedInUser.toUpperCase();           // "USER NAME"
const lookupKey   = displayName.replace(/\s+/g, '_');      // "USER_NAME"
const employeeData = (typeof TAMapping !== 'undefined' && TAMapping[lookupKey]) || {};

const WORKER_URL = 'https://keyps.powersupplyorange.workers.dev';
const SHEET_ID   = '1aa-N2lqaYFv9Al9r4zWeRIbeccCrTuQn-5fqYTysm94';
const API_KEY    = 'AIzaSyAjBceUqA-G1ueMCsqevOiPEhb2Nk-pOhI';

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function formatDateDMY(d) { return pad(d.getDate())+'-'+pad(d.getMonth()+1)+'-'+String(d.getFullYear()).slice(-2); }
function formatDateYMD(d) { return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }

// ===================================================================
// TAB SWITCHING
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  const btnEntry  = document.getElementById('btnEntry');
  const btnView   = document.getElementById('btnView');
  const entryPage = document.getElementById('entryPage');
  const viewPage  = document.getElementById('viewPage');

  btnEntry.addEventListener('click', () => {
    btnEntry.classList.add('active');
    btnView.classList.remove('active');
    entryPage.classList.add('active');
    viewPage.classList.remove('active');
  });

  btnView.addEventListener('click', () => {
    btnView.classList.add('active');
    btnEntry.classList.remove('active');
    viewPage.classList.add('active');
    entryPage.classList.remove('active');
    initView();          // fetch data every time View tab opened
  });

  initEntryForm();       // prepare entry form on load
  populateMonthSelect(); // pre-fill month dropdown so it's ready
});

// ===================================================================
// ENTRY FORM LOGIC
// ===================================================================
const fldName        = document.getElementById('fldName');
const fldDesignation = document.getElementById('fldDesignation');
const fldDate        = document.getElementById('fldDate');
const fldObject      = document.getElementById('fldObject');
const fldLeft        = document.getElementById('fldLeft');
const fldArrived     = document.getElementById('fldArrived');
const fldFrom        = document.getElementById('fldFrom');
const fldTo          = document.getElementById('fldTo');
const fldTA          = document.getElementById('fldTA');
const fldBookedBy    = document.getElementById('fldBookedBy');
const taForm         = document.getElementById('taForm');

function initEntryForm() {
  fldName.value = displayName;
  fldDesignation.value = employeeData.Designation || '';

  const today = new Date();
  const minD = new Date(today); minD.setDate(today.getDate() - 1);
  const maxD = new Date(today); maxD.setDate(today.getDate() + 0);
  fldDate.min = formatDateYMD(minD);
  fldDate.max = formatDateYMD(maxD);
  fldDate.value = formatDateYMD(today);

  fldFrom.value = 'KKSO (KAVI SUBHAS)';

  fldTo.innerHTML = '<option value="">-- Select Station --</option>';
  (typeof TAStations !== 'undefined' ? TAStations : []).forEach(st => {
    if (st === 'KKSO (KAVI SUBHASH)') return;
    const opt = document.createElement('option');
    opt.value = st; opt.textContent = st;
    fldTo.appendChild(opt);
  });

  fldBookedBy.innerHTML = '<option value="">-- Select Supervisor --</option>';
  (typeof BookSupervisor !== 'undefined' ? BookSupervisor : []).forEach(sup => {
    const opt = document.createElement('option');
    opt.value = sup; opt.textContent = sup;
    fldBookedBy.appendChild(opt);
  });

  refreshAllFieldStatus();
  attachEntryListeners();
}

function attachEntryListeners() {
  [fldDate, fldObject, fldLeft, fldArrived, fldTo, fldBookedBy].forEach(el => {
    el.addEventListener('input', () => { computeTA(); refreshAllFieldStatus(); });
    el.addEventListener('change', () => { computeTA(); refreshAllFieldStatus(); });
  });
  fldDate.addEventListener('change', validateDate);
  taForm.addEventListener('submit', handleSubmit);
}

function validateDate() {
  const val = fldDate.value;
  if (val < fldDate.min || val > fldDate.max) {
    alert('Date must be between ' + fldDate.min + ' and ' + fldDate.max);
    fldDate.value = '';
  }
}

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function computeTA() {
  const left = timeToMinutes(fldLeft.value);
  const arrived = timeToMinutes(fldArrived.value);
  const toStation = fldTo.value;

  if (left === null || arrived === null || !toStation) { fldTA.value = ''; return; }

  const excStations = (typeof TAExcStation !== 'undefined') ? TAExcStation : [];
  if (excStations.includes(toStation)) { fldTA.value = '30%'; return; }

  let diff = arrived - left;
  if (diff < 0) diff += 24 * 60;
  const diffHours = diff / 60;

  let percent;
  if (diffHours < 6) percent = 30;
  else if (diffHours < 12) percent = 70;
  else percent = 100;

  fldTA.value = percent + '%';
}

function isFilled(el) { return el.value !== null && el.value.toString().trim() !== ''; }

function refreshAllFieldStatus() {
  const map = [
    ['grp-name', fldName], ['grp-designation', fldDesignation], ['grp-date', fldDate],
    ['grp-object', fldObject], ['grp-left', fldLeft], ['grp-arrived', fldArrived],
    ['grp-from', fldFrom], ['grp-to', fldTo], ['grp-ta', fldTA], ['grp-bookedby', fldBookedBy]
  ];
  map.forEach(([id, el]) => {
    const group = document.getElementById(id);
    isFilled(el) ? group.classList.add('filled') : group.classList.remove('filled');
  });
}

function allFieldsFilled() {
  return [fldName, fldDesignation, fldDate, fldObject, fldLeft, fldArrived,
          fldFrom, fldTo, fldTA, fldBookedBy].every(isFilled);
}

// ---------- Submit message helper (replaces alert) ----------
const submitMessageEl = document.getElementById('submitMessage');
let submitMessageTimer = null;

function showSubmitMessage(text, type) {
  clearTimeout(submitMessageTimer);
  submitMessageEl.textContent = text;
  submitMessageEl.className = 'submit-message full-width show ' + type; // type: 'success' | 'error'

  submitMessageTimer = setTimeout(() => {
    submitMessageEl.className = 'submit-message full-width';
    submitMessageEl.textContent = '';
  }, 5000);
}

async function handleSubmit(e) {
  e.preventDefault();
  refreshAllFieldStatus();

  if (!allFieldsFilled()) {
    showSubmitMessage('⚠️ Please fill all fields before submitting.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true; submitBtn.textContent = 'Submitting...';

  const now = new Date();
  const timeStamp = formatDateDMY(now) + ', ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  const dateFormatted = formatDateDMY(new Date(fldDate.value));
  const targetMonth = (typeof getCurrentTAMonth === 'function') ? getCurrentTAMonth() : '';

  const payload = {
    target: targetMonth,
    data: {
      SerialNo: '',
      NameOfEmployee: fldName.value,
      Designation: fldDesignation.value,
      Date: dateFormatted,
      ObjectOfJourney: fldObject.value,
      LeftTime: fldLeft.value,
      ArrivedTime: fldArrived.value,
      From: fldFrom.value,
      To: fldTo.value,
      TA: fldTA.value,
      BookedBy: fldBookedBy.value,
      SubmitBy: loggedInUser + ', ' + loggedInLevel + ', ' + timeStamp
    }
  };

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Network error: ' + response.status);

    showSubmitMessage('✅ TA submitted successfully!', 'success');
    resetEntryForm();
  } catch (err) {
    console.error('Submit failed:', err);
    showSubmitMessage('❌ Submission failed. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = '🚀 Submit';
  }
}

    
function resetEntryForm() {
  fldObject.value = ''; fldLeft.value = ''; fldArrived.value = '';
  fldTo.value = ''; fldTA.value = ''; fldBookedBy.value = '';
  fldDate.value = formatDateYMD(new Date());
  refreshAllFieldStatus();
}

// ===================================================================
// VIEW PAGE LOGIC  (FIXED: reads columns by fixed position, not header text)
// ===================================================================
let currentFilteredData = [];

const monthSelect   = document.getElementById('monthSelect');
const refreshBtn    = document.getElementById('refreshBtn');
const downloadBtn   = document.getElementById('downloadBtn');
const totalTAEl     = document.getElementById('totalTA');
const totalAmountEl = document.getElementById('totalAmount');
const viewStatus    = document.getElementById('viewStatus');
const viewTableBody = document.getElementById('viewTableBody');
let viewListenersAttached = false;

// ---- Fixed column order (matches the Entry-page POST payload) ----
// A            B                C             D      E                F         G            H     I    J     K
// SerialNo  NameOfEmployee   Designation   Date   ObjectOfJourney  LeftTime  ArrivedTime  From   To  %TA  BookedBy
const COL = {
  SerialNo: 0,
  NameOfEmployee: 1,
  Designation: 2,
  Date: 3,
  ObjectOfJourney: 4,
  LeftTime: 5,
  ArrivedTime: 6,
  From: 7,
  To: 8,
  TA: 9,
  BookedBy: 10
};
const TOTAL_COLS = 11; // A..K

function populateMonthSelect() {
  const months = (typeof TAMonths !== 'undefined') ? TAMonths : [];
  const current = (typeof getCurrentTAMonth === 'function') ? getCurrentTAMonth() : '';
  monthSelect.innerHTML = '';
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    if (m === current) opt.selected = true;
    monthSelect.appendChild(opt);
  });
}

function setStatus(msg, isError) {
  viewStatus.textContent = msg;
  viewStatus.style.color = isError ? 'red' : '#333';
}

async function fetchSheetData(sheetName) {
  const range = `${sheetName}!A:K`; // explicit A to K
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;

  console.log('Fetching URL:', url);

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('Sheets API error:', res.status, errText);
    throw new Error(`Failed to fetch sheet data (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.values || [];
}

// Pad every row to TOTAL_COLS length so trailing-empty-cell truncation
// (Google Sheets API drops empty cells at end of row) never shifts data.
function padRow(row) {
  const padded = row.slice(0, TOTAL_COLS);
  while (padded.length < TOTAL_COLS) padded.push('');
  return padded;
}

// Convert raw rows into objects using FIXED POSITIONS (ignores header text completely)
function rowsToObjects(rows) {
  if (!rows || rows.length <= 1) return []; // need header + at least 1 data row
  const dataRows = rows.slice(1); // skip header row (row 0)

  return dataRows
    .map(padRow)
    .filter(r => r[COL.SerialNo] !== '' || r[COL.NameOfEmployee] !== '') // skip fully blank rows
    .map(r => ({
      SerialNo: r[COL.SerialNo],
      NameOfEmployee: r[COL.NameOfEmployee],
      Designation: r[COL.Designation],
      Date: r[COL.Date],
      ObjectOfJourney: r[COL.ObjectOfJourney],
      LeftTime: r[COL.LeftTime],
      ArrivedTime: r[COL.ArrivedTime],
      From: r[COL.From],
      To: r[COL.To],
      TA: r[COL.TA],
      BookedBy: r[COL.BookedBy]
    }));
}

async function loadViewData() {
  const sheetName = monthSelect.value;
  if (!sheetName) { setStatus('Please select a month.', true); return; }

  setStatus('Loading data...');
  viewTableBody.innerHTML = '';
  totalTAEl.textContent = '0';
  totalAmountEl.textContent = '0.00';

  try {
    const rows = await fetchSheetData(sheetName);

    if (!rows || rows.length === 0) {
      setStatus('No data found in sheet "' + sheetName + '".', true);
      return;
    }

    const objects = rowsToObjects(rows);

    // ---- Filter strictly by logged-in USER NAME ----
    const targetName = displayName.trim().toUpperCase();
    const filtered = objects.filter(o =>
      (o.NameOfEmployee || '').toString().trim().toUpperCase() === targetName
    );

    currentFilteredData = filtered;
    renderTable(filtered);
    renderSummary(filtered);

    setStatus(filtered.length ? '' : 'No records found for ' + displayName + ' in ' + sheetName + '.');
  } catch (err) {
    console.error('loadViewData error:', err);
    setStatus('Error loading data: ' + err.message + ' — Tap Refresh to try again.', true);
  }
}

function renderTable(data) {
  viewTableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.SerialNo}</td>
      <td>${row.NameOfEmployee}</td>
      <td>${row.Designation}</td>
      <td>${row.Date}</td>
      <td>${row.ObjectOfJourney}</td>
      <td>${row.LeftTime}</td>
      <td>${row.ArrivedTime}</td>
      <td>${row.From}</td>
      <td>${row.To}</td>
      <td>${row.TA}</td>
      <td>${row.BookedBy}</td>`;
    viewTableBody.appendChild(tr);
  });
}

function renderSummary(data) {
  const totalTA = data.length;
  const rate = (employeeData && employeeData.Rates) ? parseFloat(employeeData.Rates) : 0;

  let totalAmount = 0;
  data.forEach(row => {
    const pct = parseFloat((row.TA || '0').toString().replace('%', '')) || 0;
    totalAmount += (pct / 100) * rate;
  });

  totalTAEl.textContent = totalTA;
  totalAmountEl.textContent = totalAmount.toFixed(2);
}

function generatePDF() {
  // ================= FUTURE PDF INTEGRATION =================
  // 1. Add: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  // 2. Build printable HTML into #pdf-template using currentFilteredData
  // 3. html2pdf().from(document.getElementById('pdf-template')).set({filename:'TA_Report.pdf'}).save();
  // =============================================================
  alert('PDF download feature will be integrated soon.');
}

function initView() {
  if (!viewListenersAttached) {
    monthSelect.addEventListener('change', loadViewData);
    refreshBtn.addEventListener('click', loadViewData);
    downloadBtn.addEventListener('click', generatePDF);
    viewListenersAttached = true;
  }
  loadViewData();
}
