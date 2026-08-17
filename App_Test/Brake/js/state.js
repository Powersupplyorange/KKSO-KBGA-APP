/* ===================== GLOBAL STATE ===================== */
let currentUser="", currentPassword="", currentLevel="";
let currentUserRow=-1, currentUserPersonal=[];
let viewConfig=[], entryConfig=[];
let appInitialized=false;
let credentialCheckInterval=null, lastCredentialCheck=0;

/* More tab state */
let moreAppsLoaded=false;
let moreNavPath=[];
let moreClickActions=[];
let moreTree={};
