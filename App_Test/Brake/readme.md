KKSO-KBGA-APP/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   ├── base.css          → reset, fonts, body, page, animations
│   ├── login.css         → login page
│   ├── header.css        → header strip, user-bar, clock, title-card
│   ├── modeToggle.css    → the 4 tab buttons
│   ├── panel.css         → form-group, select, buttons, status-msg
│   ├── viewData.css      → output table/grid styles
│   ├── myData.css        → stats cards, personal card, history table
│   ├── inbox.css         → inbox cards, filters, badges
│   ├── more.css          → folder cards, breadcrumb, app-embed
│   ├── entryEmbed.css    → entry HTML-embed fullscreen
│   ├── modal.css         → password modal
│   ├── themes.css        → theme-admin / supervisor / staff
│   └── responsive.css    → print + mobile media queries
└── js/
    ├── config.js         → APP_VERSION + CONFIG (all editable settings)
    ├── roles.js          → ⭐ ROLE MODEL (easy to add new roles)
    ├── state.js          → shared app state variables
    ├── helpers.js        → fetch, url/image, formatting helpers
    ├── clock.js          → header clock widget
    ├── auth.js           → ⭐ LOGIN / LOGOUT / session / credential-check
    ├── password.js       → ⭐ CHANGE PASSWORD
    ├── appEmbed.js       → fullscreen iframe viewer (used by "More")
    ├── viewData.js       → ⭐ VIEW DATA tab
    ├── entryData.js      → ⭐ ENTRY DATA tab (+ HTML embed forms)
    ├── myData.js         → ⭐ MY DATA → My Entries
    ├── inbox.js          → ⭐ MY DATA → Inbox
    ├── more.js           → ⭐ MORE tab (folder hub)
    ├── modeSwitch.js     → tab switching + app init (glue code)
    └── main.js           → bootstrap: session restore, global listeners
