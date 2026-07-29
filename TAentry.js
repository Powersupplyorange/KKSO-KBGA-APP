// ===== entry.js =====
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

const loggedInUser  = getUrlParam('user');
const loggedInLevel = getUrlParam('level');

const displayName = loggedInUser.toUpperCase();          // "USER NAME" (spaces kept)
const lookupKey   = displayName.replace(/\s+/g, '_');     // "USER_NAME" (for TAMapping)
const employeeData = (typeof TAMapping !== 'undefined' && TAMapping[lookupKey]) || {};

const WORKER_URL = 'https://keyps.powersupplyorange.workers.dev';

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

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function formatDateDMY(d) { return pad(d.getDate())+'-'+pad(d.getMonth()+1)+'-'+String(d.getFullYear()).slice(-2); }
function formatDateYMD(d) { return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }

function initEntryForm() {
  fldName.value = displayName;
  fldDesignation.value = employeeData.Designation || '';

  const today = new Date();
  const minD = new Date(today); minD.setDate(today.getDate() - 2);
  const maxD = new Date(today); maxD.setDate(today.getDate() + 1);
  fldDate.min = formatDateYMD(minD);
  fldDate.max = formatDateYMD(maxD);
  fldDate.value = formatDateYMD(today);

  fldFrom.value = 'KKSO';

  fldTo.innerHTML = '<option value="">-- Select Station --</option>';
  (typeof TAStations !== 'undefined' ? TAStations : []).forEach(st => {
    if (st === 'KKSO') return;
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
  attachListeners();
}

function attachListeners() {
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

// %TA logic: diff = ArrivedTime - LeftTime (overnight handled)
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

async function handleSubmit(e) {
  e.preventDefault();
  refreshAllFieldStatus();
  if (!allFieldsFilled()) { alert('Please fill all fields.'); return; }

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
      "%TA": fldTA.value,
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
    if (!response.ok) throw new Error('Network error');
    alert('TA submitted successfully.');
    resetForm();
  } catch (err) {
    console.error(err);
    alert('Submission failed. Please try again.');
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = 'Submit';
  }
}

function resetForm() {
  fldObject.value = ''; fldLeft.value = ''; fldArrived.value = '';
  fldTo.value = ''; fldTA.value = ''; fldBookedBy.value = '';
  fldDate.value = formatDateYMD(new Date());
  refreshAllFieldStatus();
}

document.addEventListener('DOMContentLoaded', initEntryForm);