// ===== TAMapping.js =====
// Keys use USER_NAME format (uppercase, spaces -> underscore)
const TAMapping = {
  "RAVI_KUMAR_MALHOTRA": {Designation: "TECH-I", PF_No: "52229800571",Mob_No: "9821567620", Bill_Unit: "2201-225", Basic_Pay: "₹29,200", Scale: "L-5", Date_Of_Appointment: "30-07-2020" ,Rates: "625"}
  // add more employees...
};

// "To" dropdown options
const TAStations = [
  "KBST (BARUN SENGUPTA)",
  "KBGA (BELEGHATA)",
  "KGKG (GAUR KISHOR GHOSH)",
  "KNLN (NALBAN)",
  "KITC (IT CENTRE)",
  "KNBG (NABADIGANTA)",
  "KNLT (NAZRUL TIRTHA)",
  "KSPB (SWAPANBHOR)",
  "KBCC (BISWA BANGLA C.C)",
  "KSST (SHIKSHA TIRTHA)",
  "KMWM (MOTHER'S WAX MUSEUM)",
  "KECP (ECO PARK)",
  "KMBP (MANGAL DEEP)",
  "KCCT (CITY CENTER 2)",
  "KCNP (CHINAR PARK)",
  "KVIR (VIP ROAD)",
  "KJHD (JAI HIND)",
  "KPSK (PARK STREET-METRO BHAWAN)",
  "KCWC (CHANDNI CHOWK)",
  "KNOA (NOAPARA)",
  "KMJH (MAJHERHAT)",
  "CPD (CENTRAL PARK DEPOT)",
  "KJPK (JATIN DAS PARK)",
  "KCEN (CENTRAL)",
  "SDHM (SEALDAH METRO)"
];


// Stations that always give 30% TA irrespective of hours
const TAExcStation = ["ITARSI", "BINA"];

// "Booked By" dropdown options
const BookSupervisor = [
"NARENDRA EKKA", 
"KISHOR KUMAR", 
"MD. AMIR ANSARI", 
"ARPAN MONDAL", 
"RAJA MANDAL"
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
