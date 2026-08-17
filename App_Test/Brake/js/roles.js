/* =====================================================
   ROLE MODEL
   To add a NEW ROLE (e.g. "manager"):
   1. Add it to ROLE_MAP below (icon, name, theme class)
   2. Add its sheet-column mapping in getLevelCols()
   3. Add a matching .theme-manager block in css/themes.css
   4. Add a Manager column (I/J/K...) in the "apps" sheet
      and update the access check in more.js
   That's it — nothing else needs to change.
===================================================== */

const ROLE_MAP = {
  admin:      { icon:'👑', name:'Admin',      theme:'theme-admin' },
  supervisor: { icon:'🛡', name:'Supervisor', theme:'theme-supervisor' },
  staff:      { icon:'👤', name:'Staff',      theme:'theme-staff' }
};

function getRoleInfo(level){
  return ROLE_MAP[level] || ROLE_MAP.staff;
}

/* Maps a role to which columns in "master" sheet hold its
   View/Entry sheet-name (sheetCol) and Sub-Subject flag (subCol) */
function getLevelCols(level){
  if(level==="admin")      return { sheetCol:27, subCol:28 };
  if(level==="supervisor") return { sheetCol:29, subCol:30 };
  return { sheetCol:31, subCol:32 }; // staff (default)
}
