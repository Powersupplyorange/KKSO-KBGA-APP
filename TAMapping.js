// ===== TAMapping.js =====
// Keys use USER_NAME format (uppercase, spaces -> underscore)
const TAMapping = {
  "RAJESH_KUMAR": { Designation: "SSE",        Rates: 500 },
  "AMIT_SINGH":   { Designation: "JE",         Rates: 450 },
  "SUNIL_SHARMA": { Designation: "TECHNICIAN", Rates: 350 }
  // add more employees...
};

// "To" dropdown options
const TAStations = ["KKSO", "ITARSI", "BHOPAL", "NAGPUR", "JABALPUR", "BINA"];

// Stations that always give 30% TA irrespective of hours
const TAExcStation = ["ITARSI", "BINA"];

// "Booked By" dropdown options
const BookSupervisor = [
  "SHRI A.K. VERMA (SSE)",
  "SHRI R.P. GUPTA (SSE/PWI)",
  "SHRI M.K. JAIN (JE)"
];

// Current month sheet name e.g. "Jun-2026"
function getCurrentTAMonth() {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun",
                       "Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = new Date();
  return monthNames[d.getMonth()] + "-" + d.getFullYear();
}

// List of month-sheets for the "View" dropdown (6 back / 6 forward)
const TAMonths = (function () {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun",
                       "Jul","Aug","Sep","Oct","Nov","Dec"];
  const arr = [];
  const now = new Date();
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    arr.push(monthNames[d.getMonth()] + "-" + d.getFullYear());
  }
  return arr;
})();