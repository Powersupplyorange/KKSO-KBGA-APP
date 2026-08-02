// ===================== taPdf.js (VECTOR PDF — no html2canvas, no hanging) =====================

// ---------- date/time helpers ----------
function taParseDMY(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  let y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (y < 100) y = 2000 + y;
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function taFormatDMY(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const p = n => (n < 10 ? '0' + n : '' + n);
  return p(dateObj.getDate()) + '-' + p(dateObj.getMonth() + 1) + '-' + String(dateObj.getFullYear()).slice(-2);
}

function taTimeToMinutes(t) {
  if (!t || typeof t !== 'string' || !t.includes(':')) return 0;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

function taMinutesToHHMM(mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  const p = n => (n < 10 ? '0' + n : '' + n);
  return p(h) + ':' + p(mm);
}

function taExtractCode(fullText) {
  if (!fullText || typeof fullText !== 'string') return '';
  return fullText.split('(')[0].trim();
}

function taComputeNoOfTrain(toFullText, dateObj, leftMin, finalArrivedMin) {
  const code = taExtractCode(toFullText);
  if (!code) return '';
  const unrestricted = (typeof TAUnrestrictedMetroStations !== 'undefined') ? TAUnrestrictedMetroStations : [];
  const restricted   = (typeof TATimeRestrictedStations !== 'undefined') ? TATimeRestrictedStations : [];

  if (unrestricted.includes(code)) return '-By Metro-';

  if (restricted.includes(code)) {
    if (!dateObj) return '-By Car-';
    const dow = dateObj.getDay();
    const isWeekday = dow >= 1 && dow <= 5;
    const inWindow = (mins) => mins >= 480 && mins <= 1200;
    const eitherInWindow = inWindow(leftMin) || inWindow(finalArrivedMin);
    return (isWeekday && eitherInWindow) ? '-By Metro-' : '-By Car-';
  }
  return '-By Car-';
}

function taFormatObjectText(objectText) {
  const excluded = (typeof TAObjectSuffixExcludedUsers !== 'undefined') ? TAObjectSuffixExcludedUsers : [];
  let text = (objectText || '').toString().trim().toUpperCase();
  const suffix = 'BOOKED BY SSE/M/KKSO';
  const alreadyHasSuffix = text.endsWith(suffix);
  if (!excluded.includes(lookupKey) && !alreadyHasSuffix) {
    text = text + ' ' + suffix;
  }
  return text;
}

function taBuildTrip(row, rowIndex) {
  try {
    const dateObj = taParseDMY(row.Date);
    const leftMin = taTimeToMinutes(row.LeftTime);
    const finalArrivedMin = taTimeToMinutes(row.ArrivedTime);

    const travelMinutes = (typeof stationTime !== 'undefined' && stationTime[row.To] !== undefined)
      ? stationTime[row.To] : 0;

    const outArrivedMin = leftMin + travelMinutes;
    const outArrivedStr = taMinutesToHHMM(outArrivedMin);
    const fromCode = taExtractCode(row.From);
    const toCode   = taExtractCode(row.To);
    const noOfTrain = taComputeNoOfTrain(row.To, dateObj, leftMin, finalArrivedMin);

    const retLeftMin = finalArrivedMin - travelMinutes;
    const retLeftStr = taMinutesToHHMM(retLeftMin);
    const retArrivedStr = row.ArrivedTime || '';
    const nextDay = finalArrivedMin < leftMin;

    const rate = (typeof employeeData !== 'undefined' && employeeData.Rates) ? parseFloat(employeeData.Rates) : 0;
    const pct = parseFloat((row.TA || '0').toString().replace('%', '')) || 0;
    const amount = rate * pct / 100;
    const rs = Math.floor(amount + 1e-6);
    const p  = Math.round((amount - rs) * 100);

    const safeDateObj = dateObj || new Date();

    return {
      dateObj: safeDateObj, dateStr: row.Date || '', train: noOfTrain,
      out: { left: row.LeftTime || '', arrived: outArrivedStr, from: fromCode, to: toCode },
      ret: { left: retLeftStr, arrived: retArrivedStr, from: toCode, to: fromCode },
      nextDay, days: row.TA || '',
      object: taFormatObjectText(row.ObjectOfJourney),
      rate, rs, p
    };
  } catch (err) {
    console.error('Failed to build trip for row', rowIndex, row, err);
    return null;
  }
}

function taPaginateTrips(trips) {
  const pages = [];
  const page1 = trips.slice(0, 7);
  pages.push({ type: 'first', trips: page1 });
  let idx = page1.length, remaining = trips.length - idx;
  if (remaining <= 0) {
    pages.push({ type: 'final', trips: [] });
  } else {
    while (remaining > 0) {
      const chunk = trips.slice(idx, idx + 6);
      idx += chunk.length; remaining -= chunk.length;
      pages.push({ type: remaining <= 0 ? 'final' : 'middle', trips: chunk });
    }
  }
  return pages;
}

function taSumAmounts(trips) {
  let rs = 0, p = 0;
  trips.forEach(t => { rs += t.rs; p += t.p; });
  rs += Math.floor(p / 100); p %= 100;
  return { rs, p };
}

function taNumberToWords(num) {
  if (num === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const two = n => n < 20 ? a[n] : b[Math.floor(n/10)] + (n%10 ? ' ' + a[n%10] : '');
  const three = n => { let s=''; if(n>=100){s+=a[Math.floor(n/100)]+' Hundred'; n%=100; if(n) s+=' ';} if(n>0) s+=two(n); return s; };
  let result = '';
  const crore = Math.floor(num/10000000); num %= 10000000;
  const lakh  = Math.floor(num/100000);   num %= 100000;
  const thousand = Math.floor(num/1000);  num %= 1000;
  if (crore) result += three(crore) + ' Crore ';
  if (lakh)  result += three(lakh) + ' Lakh ';
  if (thousand) result += three(thousand) + ' Thousand ';
  if (num) result += three(num);
  return result.trim();
}

function taAmountToWords(rs, p) {
  let words = taNumberToWords(rs) + ' Rupees';
  if (p > 0) words += ' and ' + taNumberToWords(p) + ' Paisa';
  return words + ' Only';
}

// ===================== VECTOR PDF DRAWING (jsPDF only — no html2canvas) =====================

const PDF_MARGIN = 8;
const PDF_PAGE_W = 297, PDF_PAGE_H = 210;
const PDF_TABLE_W = 281;
const PDF_COL_WIDTHS = [24, 20, 16, 16, 20, 20, 12, 16, 97, 14, 14, 12]; // sum = 281
const ROW_H = 8;
const MERGED_H = ROW_H * 2;

const KM_PATTERN_PAGE1 = ['A','B','O','V','E','','08','','K','M','','','',''];
const KM_PATTERN_OTHER = ['','','A','B','O','V','E','','08','','K','M','',''];

function pdfColX(index) {
  let x = PDF_MARGIN;
  for (let i = 0; i < index; i++) x += PDF_COL_WIDTHS[i];
  return x;
}

function pdfCenterCell(pdf, text, x, y, w, h, fontSize, bold) {
  pdf.setFontSize(fontSize);
  pdf.setFont(undefined, bold ? 'bold' : 'normal');
  const lines = String(text || '').split('\n');
  const lineHeight = fontSize * 0.3528 * 1.15;
  const totalH = lines.length * lineHeight;
  let startY = y + h / 2 - totalH / 2 + lineHeight / 2;
  lines.forEach((ln, i) => {
    pdf.text(ln, x + w / 2, startY + i * lineHeight, { align: 'center', baseline: 'middle' });
  });
}

function pdfLeftCell(pdf, lines, x, y, w, h, fontSize) {
  pdf.setFontSize(fontSize);
  pdf.setFont(undefined, 'normal');
  const lineHeight = fontSize * 0.3528 * 1.15;
  const totalH = lines.length * lineHeight;
  let startY = y + h / 2 - totalH / 2 + lineHeight / 2;
  lines.forEach((ln, i) => {
    pdf.text(ln, x, startY + i * lineHeight, { align: 'left', baseline: 'middle' });
  });
}

function fitObjectText(pdf, text, colWidthMM, mergedHeightMM) {
  let fontSize = 7.5;
  const maxWidth = colWidthMM - 2;
  const maxHeight = mergedHeightMM - 2;
  let lines;
  while (fontSize >= 6) {
    pdf.setFontSize(fontSize);
    lines = pdf.splitTextToSize(text || '', maxWidth);
    const lineHeight = fontSize * 0.3528 * 1.15;
    if (lines.length * lineHeight <= maxHeight) break;
    fontSize -= 0.25;
  }
  pdf.setFontSize(fontSize);
  const lineHeight = fontSize * 0.3528 * 1.15;
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (pdf.getTextWidth(last + '...') > maxWidth && last.length > 0) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + '...';
  }
  return { lines, fontSize };
}

function pdfDrawInfoHeader(pdf, header) {
  let y = PDF_MARGIN;
  pdf.setFont(undefined, 'bold'); pdf.setFontSize(10);
  pdf.text('P.F No  ' + header.pfNo, PDF_PAGE_W - PDF_MARGIN, y + 3, { align: 'right' });
  pdf.text('Bill Unit  ' + header.billUnit, PDF_PAGE_W - PDF_MARGIN, y + 7, { align: 'right' });
  pdf.text('Mob:-  ' + header.mob, PDF_PAGE_W - PDF_MARGIN, y + 11, { align: 'right' });
  y += 14;

  pdf.setFontSize(15);
  pdf.text('METRO RAILWAY/KOLKATA', PDF_PAGE_W / 2, y, { align: 'center' });
  y += 6;
  pdf.setFontSize(11.5);
  pdf.text('TRAVELLING ALLOWANCE JOURNAL', PDF_PAGE_W / 2, y, { align: 'center' });
  y += 7;

  pdf.setFontSize(9.5); pdf.setFont(undefined, 'normal');
  const cx = PDF_PAGE_W / 2;
  pdf.text('ELECTRICAL Branch  METRO RAILWAY  Division Headquarters at  SSE/M/KKSO  journal of duty performed by Sri  ' + header.sri, cx, y, { align: 'center' });
  y += 5;
  pdf.text('which allowance for  ' + header.allowanceMonth + '   Designation  ' + header.designation + '   Pay  ' + header.pay, cx, y, { align: 'center' });
  y += 5;
  pdf.text('Scale of Pay  ' + header.scaleOfPay + '   Date of appointment  ' + header.appointmentDate + '   Rule by which governed  SR.T.A.', cx, y, { align: 'center' });
  y += 5;

  return y;
}

function pdfDrawTableHeaderAt(pdf, startY) {
  const row1H = 6, row2H = 5;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.2);
  pdf.setFillColor(242, 242, 242);

  const labelMap = { 0: 'Month &\nDate', 1: 'No. of\nTrain', 2: 'Time left', 3: 'Time\narrived', 6: 'KMs', 7: 'Days/\nNight', 8: 'Object of Journey', 9: 'Rate', 10: 'Rs.', 11: 'P.' };

  [0, 1, 2, 3, 6, 7, 8, 9, 10, 11].forEach(ci => {
    const x = pdfColX(ci), w = PDF_COL_WIDTHS[ci];
    pdf.rect(x, startY, w, row1H + row2H, 'FD');
    pdfCenterCell(pdf, labelMap[ci], x, startY, w, row1H + row2H, 8, true);
  });

  const xFrom = pdfColX(4), stationW = PDF_COL_WIDTHS[4] + PDF_COL_WIDTHS[5];
  pdf.rect(xFrom, startY, stationW, row1H, 'FD');
  pdfCenterCell(pdf, 'Station', xFrom, startY, stationW, row1H, 8, true);

  pdf.rect(xFrom, startY + row1H, PDF_COL_WIDTHS[4], row2H, 'FD');
  pdfCenterCell(pdf, 'From', xFrom, startY + row1H, PDF_COL_WIDTHS[4], row2H, 8, true);
  const xTo = pdfColX(5);
  pdf.rect(xTo, startY + row1H, PDF_COL_WIDTHS[5], row2H, 'FD');
  pdfCenterCell(pdf, 'To', xTo, startY + row1H, PDF_COL_WIDTHS[5], row2H, 8, true);

  return startY + row1H + row2H;
}

function pdfDrawTripRow(pdf, y, trip, kmA, kmB) {
  const y2 = y + ROW_H;
  [0, 1, 2, 3, 4, 5, 6].forEach(ci => {
    pdf.rect(pdfColX(ci), y, PDF_COL_WIDTHS[ci], ROW_H);
    pdf.rect(pdfColX(ci), y2, PDF_COL_WIDTHS[ci], ROW_H);
  });
  [7, 8, 9, 10, 11].forEach(ci => pdf.rect(pdfColX(ci), y, PDF_COL_WIDTHS[ci], MERGED_H));

  pdfCenterCell(pdf, kmA || '', pdfColX(6), y, PDF_COL_WIDTHS[6], ROW_H, 8, true);
  pdfCenterCell(pdf, kmB || '', pdfColX(6), y2, PDF_COL_WIDTHS[6], ROW_H, 8, true);

  if (!trip) return;

  pdfCenterCell(pdf, trip.dateStr, pdfColX(0), y, PDF_COL_WIDTHS[0], ROW_H, 8);
  pdfCenterCell(pdf, trip.train, pdfColX(1), y, PDF_COL_WIDTHS[1], ROW_H, 7.5);
  pdfCenterCell(pdf, trip.out.left, pdfColX(2), y, PDF_COL_WIDTHS[2], ROW_H, 8);
  pdfCenterCell(pdf, trip.out.arrived, pdfColX(3), y, PDF_COL_WIDTHS[3], ROW_H, 8);
  pdfCenterCell(pdf, trip.out.from, pdfColX(4), y, PDF_COL_WIDTHS[4], ROW_H, 8);
  pdfCenterCell(pdf, trip.out.to, pdfColX(5), y, PDF_COL_WIDTHS[5], ROW_H, 8);

  const row2DateLabel = trip.nextDay
    ? taFormatDMY(new Date(trip.dateObj.getFullYear(), trip.dateObj.getMonth(), trip.dateObj.getDate() + 1))
    : '-Do-';
  pdfCenterCell(pdf, row2DateLabel, pdfColX(0), y2, PDF_COL_WIDTHS[0], ROW_H, 8);
  pdfCenterCell(pdf, '-Do-', pdfColX(1), y2, PDF_COL_WIDTHS[1], ROW_H, 8);
  pdfCenterCell(pdf, trip.ret.left, pdfColX(2), y2, PDF_COL_WIDTHS[2], ROW_H, 8);
  pdfCenterCell(pdf, trip.ret.arrived, pdfColX(3), y2, PDF_COL_WIDTHS[3], ROW_H, 8);
  pdfCenterCell(pdf, trip.ret.from, pdfColX(4), y2, PDF_COL_WIDTHS[4], ROW_H, 8);
  pdfCenterCell(pdf, trip.ret.to, pdfColX(5), y2, PDF_COL_WIDTHS[5], ROW_H, 8);

  pdfCenterCell(pdf, trip.days, pdfColX(7), y, PDF_COL_WIDTHS[7], MERGED_H, 8);

  const { lines, fontSize } = fitObjectText(pdf, trip.object, PDF_COL_WIDTHS[8], MERGED_H);
  pdfLeftCell(pdf, lines, pdfColX(8) + 1, y, PDF_COL_WIDTHS[8] - 2, MERGED_H, fontSize);

  pdfCenterCell(pdf, String(trip.rate), pdfColX(9), y, PDF_COL_WIDTHS[9], MERGED_H, 8);
  pdfCenterCell(pdf, String(trip.rs), pdfColX(10), y, PDF_COL_WIDTHS[10], MERGED_H, 8);
  pdfCenterCell(pdf, String(trip.p).padStart(2, '0'), pdfColX(11), y, PDF_COL_WIDTHS[11], MERGED_H, 8);
}

function pdfDrawBfRow(pdf, y, bf, kmA, kmB) {
  const y2 = y + ROW_H;
  [0, 1, 2, 3, 4, 5, 6].forEach(ci => {
    pdf.rect(pdfColX(ci), y, PDF_COL_WIDTHS[ci], ROW_H);
    pdf.rect(pdfColX(ci), y2, PDF_COL_WIDTHS[ci], ROW_H);
  });
  [7, 8, 9, 10, 11].forEach(ci => pdf.rect(pdfColX(ci), y, PDF_COL_WIDTHS[ci], MERGED_H));
  pdfCenterCell(pdf, kmA || '', pdfColX(6), y, PDF_COL_WIDTHS[6], ROW_H, 8, true);
  pdfCenterCell(pdf, kmB || '', pdfColX(6), y2, PDF_COL_WIDTHS[6], ROW_H, 8, true);
  pdfCenterCell(pdf, 'B/F', pdfColX(9), y, PDF_COL_WIDTHS[9], MERGED_H, 8, true);
  pdfCenterCell(pdf, String(bf.rs), pdfColX(10), y, PDF_COL_WIDTHS[10], MERGED_H, 8, true);
  pdfCenterCell(pdf, String(bf.p).padStart(2, '0'), pdfColX(11), y, PDF_COL_WIDTHS[11], MERGED_H, 8, true);
}

function pdfDrawCfRow(pdf, y, cf) {
  const h = 6;
  const xStart = pdfColX(0);
  const widthSpan = PDF_COL_WIDTHS.slice(0, 9).reduce((a, b) => a + b, 0);
  pdf.rect(xStart, y, widthSpan, h);
  pdf.rect(pdfColX(9), y, PDF_COL_WIDTHS[9], h);
  pdf.rect(pdfColX(10), y, PDF_COL_WIDTHS[10], h);
  pdf.rect(pdfColX(11), y, PDF_COL_WIDTHS[11], h);
  pdfCenterCell(pdf, 'C/F', pdfColX(9), y, PDF_COL_WIDTHS[9], h, 8, true);
  pdfCenterCell(pdf, String(cf.rs), pdfColX(10), y, PDF_COL_WIDTHS[10], h, 8, true);
  pdfCenterCell(pdf, String(cf.p).padStart(2, '0'), pdfColX(11), y, PDF_COL_WIDTHS[11], h, 8, true);
  return y + h;
}

function pdfDrawTotalRow(pdf, y, total, wordsText) {
  const h = 8;
  const xStart = pdfColX(0);
  const widthSpan = PDF_COL_WIDTHS.slice(0, 9).reduce((a, b) => a + b, 0);
  pdf.rect(xStart, y, widthSpan, h);
  pdf.rect(pdfColX(9), y, PDF_COL_WIDTHS[9], h);
  pdf.rect(pdfColX(10), y, PDF_COL_WIDTHS[10], h);
  pdf.rect(pdfColX(11), y, PDF_COL_WIDTHS[11], h);
  pdf.setFont(undefined, 'bold'); pdf.setFontSize(9);
  pdf.text('Total Rupees: ' + wordsText, xStart + 2, y + h / 2, { baseline: 'middle' });
  pdfCenterCell(pdf, 'Total=', pdfColX(9), y, PDF_COL_WIDTHS[9], h, 8, true);
  pdfCenterCell(pdf, String(total.rs), pdfColX(10), y, PDF_COL_WIDTHS[10], h, 8, true);
  pdfCenterCell(pdf, String(total.p).padStart(2, '0'), pdfColX(11), y, PDF_COL_WIDTHS[11], h, 8, true);
  return y + h;
}

function pdfDrawCertBlock(pdf, y, header) {
  pdf.setFont(undefined, 'normal'); pdf.setFontSize(8.5);
  const certText = `I hereby certify that. the above mentioned ${header.sri} was absent on duty from his Headquarters station during the period charged for in the bill on Railway business and that the officer performed the journey by Rail/Air/sea/Road and was allowed free pass or locomotion at the expenses of Government Local Fund or Indian State. No T.A /D.A or any other remuneration has been drawn from any other source in respect of the journeys performed on duty Pass and also for the halts for which T.A/D.A has been claimed in this bill.`;
  const lines = pdf.splitTextToSize(certText, PDF_TABLE_W);
  let cy = y + 5;
  lines.forEach(ln => { pdf.text(ln, PDF_MARGIN, cy); cy += 3.6; });

  cy += 8;
  const colW = PDF_TABLE_W / 4;
  const labels = ['Countersigned', 'Controlling Officer', 'Head of Office', 'Signature of staff claiming T.A.'];
  labels.forEach((lab, i) => {
    const lx = PDF_MARGIN + i * colW;
    pdf.line(lx + 5, cy, lx + colW - 5, cy);
    pdf.setFont(undefined, 'bold'); pdf.setFontSize(8);
    pdf.text(lab, lx + colW / 2, cy + 4, { align: 'center' });
  });

  cy += 12;
  pdf.setFont(undefined, 'bold'); pdf.setFontSize(8);
  pdf.text('Note: -', PDF_MARGIN, cy);
  pdf.setFont(undefined, 'normal');
  const note1 = pdf.splitTextToSize('1. On T.A. bills of transfer from one railway to another a certificate whether or not a free pass or Locomotion at Government expense was allowed should be recorded.', PDF_TABLE_W - 10);
  const note2 = pdf.splitTextToSize('2. Entries made by the claimant in Hindi/Regional Language should be transliterated in English.', PDF_TABLE_W - 10);
  cy += 4;
  note1.forEach(ln => { pdf.text(ln, PDF_MARGIN + 5, cy); cy += 3.4; });
  cy += 1;
  note2.forEach(ln => { pdf.text(ln, PDF_MARGIN + 5, cy); cy += 3.4; });

  return cy;
}

function taRenderPageVector(pdf, pageObj, header, isFirstPage) {
  let y = PDF_MARGIN;
  if (isFirstPage) y = pdfDrawInfoHeader(pdf, header);
  y = pdfDrawTableHeaderAt(pdf, y);

  let idx = 0;
  if (!isFirstPage) {
    pdfDrawBfRow(pdf, y, pageObj.bf, KM_PATTERN_OTHER[idx], KM_PATTERN_OTHER[idx + 1]);
    idx += 2;
    y += MERGED_H;
  }

  const maxSets = isFirstPage ? 7 : 6;
  const pattern = isFirstPage ? KM_PATTERN_PAGE1 : KM_PATTERN_OTHER;
  for (let i = 0; i < maxSets; i++) {
    const trip = pageObj.trips[i] || null;
    const kmA = pattern[idx++], kmB = pattern[idx++];
    pdfDrawTripRow(pdf, y, trip, kmA, kmB);
    y += MERGED_H;
  }

  if (pageObj.type === 'final') {
    const words = taAmountToWords(pageObj.runningTotal.rs, pageObj.runningTotal.p);
    y = pdfDrawTotalRow(pdf, y, pageObj.runningTotal, words);
    pdfDrawCertBlock(pdf, y, header);
  } else {
    pdfDrawCfRow(pdf, y, pageObj.runningTotal);
  }
}

// ===================== MAIN DOWNLOAD FUNCTION (synchronous — no hang, no html2canvas) =====================

function isJsPdfReady() {
  return !!(window.jspdf && typeof window.jspdf.jsPDF !== 'undefined');
}

function downloadTAPdfDirect() {
  const downloadBtnEl = document.getElementById('downloadBtn');

  if (!currentFilteredData || currentFilteredData.length === 0) {
    showAppAlert('No data available. Please load data on the View page first.', 'error');
    return;
  }

  if (!isJsPdfReady()) {
    showAppAlert('PDF engine is still loading. Please wait a moment and tap Download again.', 'error');
    return;
  }

  downloadBtnEl.disabled = true;
  downloadBtnEl.textContent = '⏳ Generating...';

  try {
    const sorted = [...currentFilteredData].sort((a, b) => {
      const da = taParseDMY(a.Date), db = taParseDMY(b.Date);
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });

    const trips = sorted.map((row, i) => taBuildTrip(row, i)).filter(t => t !== null);

    if (trips.length === 0) {
      showAppAlert('Could not process any rows. Check Date/Time formats in your sheet.', 'error');
      return;
    }

    const header = {
      pfNo: employeeData.PF_No || '', billUnit: employeeData.Bill_Unit || '',
      mob: employeeData.Mob_No || '', sri: displayName,
      allowanceMonth: monthSelect.value, designation: employeeData.Designation || '',
      pay: employeeData.Basic_Pay || '', scaleOfPay: employeeData.Scale || '',
      appointmentDate: employeeData.Date_Of_Appointment || ''
    };

    const pages = taPaginateTrips(trips);
    let cumulative = { rs: 0, p: 0 };
    pages.forEach(pageObj => {
      if (pageObj.type === 'first') {
        cumulative = taSumAmounts(pageObj.trips);
        pageObj.runningTotal = cumulative;
      } else {
        pageObj.bf = { ...cumulative };
        const newSum = taSumAmounts(pageObj.trips);
        let rs = cumulative.rs + newSum.rs, p = cumulative.p + newSum.p;
        rs += Math.floor(p / 100); p %= 100;
        cumulative = { rs, p };
        pageObj.runningTotal = cumulative;
      }
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

    pages.forEach((pageObj, i) => {
      if (i > 0) pdf.addPage('a4', 'landscape');
      taRenderPageVector(pdf, pageObj, header, pageObj.type === 'first');
    });

    const safeMonth = (monthSelect.value || 'TA').replace(/\s+/g, '_');
    const safeName = displayName.replace(/\s+/g, '_');
    pdf.save(`TA_${safeName}_${safeMonth}.pdf`);

  } catch (err) {
    console.error('PDF generation failed:', err);
    showAppAlert('PDF generation failed: ' + (err.message || err), 'error');
  } finally {
    downloadBtnEl.disabled = false;
    downloadBtnEl.textContent = '⬇️ Download';
  }
}
