// ===== view.js =====
const SHEET_ID = '1aa-N2lqaYFv9Al9r4zWeRIbeccCrTuQn-5fqYTysm94';
const API_KEY  = 'AIzaSyAjBceUqA-G1ueMCsqevOiPEhb2Nk-pOhI';

let viewInitialized = false;
let currentFilteredData = [];

const monthSelect  = document.getElementById('monthSelect');
const refreshBtn   = document.getElementById('refreshBtn');
const downloadBtn  = document.getElementById('downloadBtn');
const totalTAEl    = document.getElementById('totalTA');
const totalAmountEl= document.getElementById('totalAmount');
const viewStatus   = document.getElementById('viewStatus');
const viewTableBody= document.getElementById('viewTableBody');

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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch sheet data (' + res.status + ')');
  const json = await res.json();
  return json.values || [];
}

function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  });
}

async function loadViewData() {
  const sheetName = monthSelect.value;
  setStatus('Loading data...');
  viewTableBody.innerHTML = '';
  try {
    const rows = await fetchSheetData(sheetName);
    const objects = rowsToObjects(rows);

    const filtered = objects.filter(o =>
      (o.NameOfEmployee || '').toString().trim().toUpperCase() === displayName
    );

    currentFilteredData = filtered;
    renderTable(filtered);
    renderSummary(filtered);
    setStatus(filtered.length ? '' : 'No records found for this month.');
  } catch (err) {
    console.error(err);
    setStatus('Error loading data. Tap Refresh to try again.', true);
  }
}

function renderTable(data) {
  viewTableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.SerialNo || ''}</td>
      <td>${row.NameOfEmployee || ''}</td>
      <td>${row.Designation || ''}</td>
      <td>${row.Date || ''}</td>
      <td>${row.ObjectOfJourney || ''}</td>
      <td>${row.LeftTime || ''}</td>
      <td>${row.ArrivedTime || ''}</td>
      <td>${row.From || ''}</td>
      <td>${row.To || ''}</td>
      <td>${row['%TA'] || ''}</td>
      <td>${row.BookedBy || ''}</td>`;
    viewTableBody.appendChild(tr);
  });
}

// Total Amount = Σ (%TA(decimal) * Rate) for each row  -- see note below
function renderSummary(data) {
  const totalTA = data.length;
  const rate = (employeeData && employeeData.Rates) ? parseFloat(employeeData.Rates) : 0;

  let totalAmount = 0;
  data.forEach(row => {
    const pct = parseFloat((row['%TA'] || '0').toString().replace('%','')) || 0;
    totalAmount += (pct / 100) * rate;
  });

  totalTAEl.textContent = totalTA;
  totalAmountEl.textContent = totalAmount.toFixed(2);
}

function generatePDF() {
  // ================= FUTURE PDF INTEGRATION =================
  // 1. Add a PDF library, e.g.:
  //    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  // 2. Build the printable HTML inside the hidden #pdf-template div
  //    (in index.html), using 'currentFilteredData':
  //      const tmpl = document.getElementById('pdf-template');
  //      tmpl.innerHTML = buildPrescribedHtml(currentFilteredData);
  // 3. Generate & download:
  //      html2pdf().from(tmpl).set({ filename: 'TA_Report.pdf' }).save();
  // =============================================================
  alert('PDF download feature will be integrated soon.');
}

function initView() {
  if (!viewInitialized) {
    populateMonthSelect();
    monthSelect.addEventListener('change', loadViewData);
    refreshBtn.addEventListener('click', loadViewData);
    downloadBtn.addEventListener('click', generatePDF);
    viewInitialized = true;
  }
  loadViewData();
}