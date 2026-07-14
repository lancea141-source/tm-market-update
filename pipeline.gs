/**
 * MARKET UPDATE PIPELINE — Lance the Realtor (multi-location)
 * VERSION 23
 * ------------------------------------------------
 * CHANGELOG
 *  v27 VERSION VISIBLE IN THE SHEET. ▶ Run tab title shows the running
 *      version and refreshes on every sheet open (so it always matches
 *      the pasted code). Dashboard subtitle and ✅ Check Setup show it too.
 *  v26 TOWNHOME MODEL. Second hedonic fit on resale town/condo sales
 *      (above-grade sqft, basement, garage, age, baths, beds — no acres/
 *      walkout). Appears as its own section on the 📐 CMA Adjustments tab
 *      and the cma-rates/ page ONLY when that market has 60+ TH sales —
 *      TM stays SFH-only automatically, Lehi shows both. Scope warning
 *      adapts. Shared regress_() solver added.
 *  v25 CMA ADJUSTMENT ENGINE — the TM-CMA-Adjustment-Rates sheet, alive.
 *      · Full 12-predictor hedonic model (main vs upper $/sqft, basement
 *        fin/unf, walkout, garage bays, acres, age, baths, bedrooms) refits
 *        on every ▶ Build Stats from that location's own sales.
 *      · 📐 CMA Adjustments tab: field-by-field rates with confidence
 *        flags, anchor formula, model quality, scope limits.
 *      · Public page published alongside the report at cma-rates/
 *        (e.g. …github.io/<repo>/lehi/cma-rates/) — branded agent-facing
 *        adjustment table, linked from the report's pricing card.
 *  v24 DATA MANAGEMENT + ONE-TAP SETUP.
 *      · 📥 Paste tab (inbox): paste each month's export there, headers
 *        included. ▶ Build Stats absorbs it into Data automatically —
 *        every row stamped with import date, then Data is compacted:
 *        duplicate MLS# resolved (newest import wins, SOLD beats ACTIVE),
 *        actives treated as a snapshot (only the latest import counts),
 *        solds older than 25 months dropped. Import Log tab records history.
 *      · 🔑 Set GitHub Token menu item — prompt box saves GITHUB_TOKEN,
 *        no more Project Settings digging on new location copies.
 *      · ✅ Check Setup (menu + Run tab) — verifies token, lead form,
 *        triggers, data freshness, and where this copy publishes.
 *  v23 MULTI-LOCATION. All location-specific text derives from the
 *      LOCATION SETTINGS block at the top of CONFIG (farmName, farmShort,
 *      areaLine, numbersLine, agentTagline) + CONFIG.github.path.
 *      New area = copy the Sheet, edit those lines, add GITHUB_TOKEN
 *      script property, Setup Workbook, paste that area's export,
 *      Build Stats, Publish. One repo, subfolder per location
 *      ('lehi/index.html' publishes to ...github.io/<repo>/lehi/).
 *  v22 Index component key on web page ("each signal 0–100 · 50 neutral ·
 *      higher favors sellers") + each component's how-it-works line shown
 *      under its bar. Price momentum now computed on RESALE-ONLY medians so
 *      new-construction mix shift stops whipsawing the score (falls back to
 *      blended when resale sample is thin).
 *  v21 READABILITY PASS (no paragraphs) + PUBLISHED PRICING MODEL.
 *      · MoS card: "THE MATH" one-liner + 3-row meaning key; scale REVERSED so
 *        both scales read buyer's-left → seller's-right; axis caption added
 *      · Reconciliation: two-row verdict table + one bold bottom line
 *      · $/sqft card: delta column removed; blend now in a 🚫 "NUMBER TO
 *        IGNORE" box with strikethrough; one-line closing guidance
 *      · New public card: "What a square foot is actually worth in TM" —
 *        model rates + grade rows, auto-updated, auto-hides if grade is red
 *  v20 ONE-TAB WORKFLOW + PRICING MODEL.
 *      · Single "Data" tab takes the combined actives+solds export (new format
 *        with per-floor sqft, basement sqft/type/finished%). Multiple exports
 *        (e.g., this year + last year) paste one under the other — parser
 *        handles stacked headers and dedupes by MLS#. Old Solds/Actives tabs
 *        still work as fallback.
 *      · "Pricing Model" tab (INTERNAL): hedonic regression on resale SFH
 *        ≤$1.5M — above-grade / finished-bsmt / unfinished-bsmt $/sqft rates,
 *        lot rate, walkout premium, R², median error, publish-grade flag.
 *      · $/sqft insight card cleanup: subtitle, column headers ($/sqft, vs
 *        online avg), blended number moved to a ⚠️ warning strip with "use
 *        your segment + a real CMA" guidance.
 *  v19 Blended $/sqft redesigned: now a distinct reference row inside the
 *      segment table (camel bar, "the portals' number" tag) with the takeaway
 *      split into two short standalone lines.
 *  v18 TM Index card gets a visual scale key like the Months of Supply card:
 *      4-zone bar (<40 buyer's · 40–50 leaning buyers · 50–60 leaning sellers ·
 *      >60 strong seller's) with a marker at this month's value.
 *  v17 $/sqft insight rebuilt as a visual table: one row per segment with bar,
 *      value, and +/− delta vs the blended TM median (labeled as "the number
 *      the portals use"). Blended 12-mo $/sqft added to stats.
 *  v16 Sales-by-month chart readability: month-name x labels (Jul, Aug…, with
 *      year marker), sold-count value label on top of each bar, y-axis with
 *      0/mid/max ticks and "homes sold" axis title.
 *  v15 Lead capture: setupLeadForm() creates a branded Google Form (address,
 *      name, phone, email, timeframe), pipes responses into this spreadsheet,
 *      emails Lance instantly on every submission, and the report's home-value
 *      button now points at the form (mailto fallback until setup is run).
 *  v14 Index and Months of Supply reconciled: graduated index labels (>60 strong
 *      seller's · 50-60 leaning sellers · 40-50 leaning buyers · <40 buyer's) and
 *      an auto-generated reconciliation paragraph on the web page + video script
 *      that explains agreement/disagreement between the two measures.
 *  v13 "▶ Run" tab: tap a checkbox to run any command — no Apps Script editor,
 *      and it works in the Sheets MOBILE app (custom menus don't). One-time:
 *      menu → Install Run-Tab Trigger. Status column shows ✅/❌ + result.
 *  v12 Months of Supply promoted to a headline metric with the industry-standard
 *      scale (<4 seller's / 4–6 balanced / >6 buyer's) + explanation + formula,
 *      shown alongside the TM Index on web page, Dashboard, Stats, and video
 *      script. Index inventory component recentered so 5 mo supply = 50.
 *  v11 Correct YouTube channel URL (@lance141); token .trim() hardening
 *  v10 Custom menu (📊 TM Market) — run everything from the sheet, no editor,
 *      same pattern as Showing Sheet v5. Dashboard gets logo header row via
 *      =IMAGE() with uc?export=view (the format proven in the showing sheets)
 *  v9  LOGO FIXED FOR REAL: embedded as base64 data URI at build time via
 *      DriveApp (script runs as Lance, so no sharing settings needed; logo is
 *      baked into the published HTML). Contact info filled: Jason Mitchell
 *      Real Estate Utah LLC, (801) 860-5225, linktr.ee/Lance141, LocalwithLance.com
 *  v8  publishToGitHub(): pushes the report as index.html to a GitHub repo so
 *      GitHub Pages serves it at a clean shareable URL. Setup in CONFIG.github +
 *      Script Properties (GITHUB_TOKEN). doGet refactored to share buildHtml_()
 *  v7  Working logo URL (lh3.googleusercontent.com format — uc?id is deprecated
 *      and blocked by Google); Sales last-30-days stat in Dashboard/Stats/web/
 *      script; TM Index component breakdown published in Dashboard tab AND web
 *      page (5 subscores with bars); plain-English index explainer on web page
 *  v6  Basement premium removed from ALL public outputs (unverified — pending
 *      Lance's pricing model); replaced with verified $/sqft-by-segment insight.
 *      Basement calc kept in internal Stats tab only.
 *  v5  Self-healing import parser (handles stacked/messy CSV imports in any tab)
 *  v4  setupWorkbook() one-time tab builder + branded Dashboard tab (showing-sheet
 *      style, trend arrows vs prior quarter); prior-quarter stats added
 *  v3  Agent branding block (name/brokerage/phone/license) on web page + footer;
 *      generateScript() monthly video script generator
 *  v2  Matched to actual WFRMLS exports (cma_info + showing_app); resale vs
 *      new-construction segments; months of inventory; basement premium
 *  v1  Initial pipeline: stats + TM Market Index + public web page
 * ------------------------------------------------
 * Matched to actual WFRMLS exports:
 *   - "Solds" tab  = res_cma_info_export.csv   (Sold Date, Sold Price, Status, List Price,
 *       Original List Price, MLS#, DOM, Time Under Contract, Total Square Feet,
 *       Price Per Square Foot, Address, City, Style, Total Bedrooms, Total Bathrooms,
 *       Acres, Year Built, Basement Finished, Garage Capacity)
 *   - "Actives" tab = res_showing_app_export.csv (MLS#, Address, City, List Price,
 *       Original List Price, Status, DOM, ..., Total Square Feet, Agent, ...)
 *
 * Setup:
 * 1. New Google Sheet "TM Farm Data" → Extensions → Apps Script → paste this → save
 * 2. Run setupWorkbook() once → creates all branded tabs:
 *    Dashboard · Stats · Script · Solds · Actives · ReadMe
 * 3. Import CSVs: Solds tab ← res_cma_info_export | Actives tab ← res_showing_app_export
 *    (File → Import → Upload → "Replace data at selected cell", cell A1 of each tab)
 * 4. Run buildStats() → fills Stats + Dashboard. Run generateScript() → drafts video script
 * 5. Deploy → New deployment → Web app → Execute as Me, Access: Anyone → public URL
 *
 * Monthly: re-import fresh exports → buildStats() + generateScript(). Done.
 */

const VERSION = 'v27';

// Graduated index labels — no hard "seller's/buyer's" flip at one point
function idxLabel_(i) {
  return i >= 60 ? "Strong seller's market" : i >= 50 ? 'Leaning sellers'
       : i >= 40 ? 'Leaning buyers' : "Buyer's market";
}

// One-sentence bottom line for the verdict table (auto-adapts monthly)
function bottomLine_(s) {
  if (s.moi == null) return '';
  const tight = s.moi < 4, high = s.moi > 6;
  if (tight && s.index >= 60) return 'Both agree — a true seller\'s market.';
  if (tight && s.index >= 50) return 'Sellers hold the structural leverage — but buyers have more breathing room than the supply number alone suggests.';
  if (tight) return 'Tight supply but soft demand signals — watch which one blinks first.';
  if (high && s.index < 50) return 'Both agree — buyers hold the leverage.';
  return 'Near equilibrium — read both numbers together.';
}

// Auto-generated reconciliation between Months of Supply and the TM Index.
// Explains agreement or disagreement — never leaves the reader with a contradiction.
function reconcile_(s) {
  if (s.moi == null) return '';
  const mos = s.moi.toFixed(1);
  const supplyTight = s.moi < 4, supplyHigh = s.moi > 6;
  if (supplyTight && s.index >= 60)
    return 'Both measures agree: supply is tight at ' + mos + ' months AND the broader signals are hot. A true seller\'s market.';
  if (supplyTight && s.index >= 50)
    return 'Why the two ratings read differently: Months of Supply looks only at inventory — at ' + mos +
      ' months, supply alone says seller\'s market. The ' + CONFIG.farmShort + ' Index also weighs sales pace, price momentum, and negotiation ' +
      'signals, which are running cooler. Translation: sellers hold the structural leverage, but buyers have more ' +
      'breathing room than the supply number alone suggests.';
  if (supplyTight)
    return 'The measures disagree: inventory is scarce (' + mos + ' months — seller\'s side), but pace, price momentum, ' +
      'and negotiation signals currently favor buyers. Tight supply with soft demand — watch which one blinks first.';
  if (supplyHigh && s.index < 50)
    return 'Both measures agree: buyers hold the leverage — supply is high and the broader signals confirm it.';
  return 'Supply sits near the balanced band; the TM Index adds pace and price signals for the fuller picture. Read them together.';
}

// ============================================================
// CUSTOM MENU — appears at top of sheet on every open
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 ' + CONFIG.farmShort + ' Market')
    .addItem('▶ Build Stats & Dashboard', 'buildStats')
    .addItem('✅ Check Setup', 'checkSetupAlert')
    .addItem('🎬 Generate Video Script', 'generateScript')
    .addItem('🌐 Publish to GitHub', 'publishToGitHubWithAlert')
    .addSeparator()
    .addItem('🔑 Set GitHub Token', 'setGithubToken')
    .addItem('⚙️ Setup Workbook (first time only)', 'setupWorkbook')
    .addItem('🔘 Install Run-Tab Trigger (first time only)', 'installRunTrigger')
    .addItem('📝 Setup Lead Form (first time only)', 'setupLeadForm')
    .addToUi();
  // keep the Run tab's version label in sync with the pasted code
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName('▶ Run');
    if (sh) sh.getRange('A1').setValue('📊 ' + CONFIG.farmShort + ' MARKET — CONTROL PANEL · ' + VERSION);
  } catch (e) {}
}

// ---------- LEAD CAPTURE (Google Form → this Sheet + instant email) ----------
function leadFormUrl_() {
  return PropertiesService.getScriptProperties().getProperty('LEAD_FORM_URL') || '';
}

// One-time: creates the branded form, links responses to this spreadsheet,
// installs the instant-notification trigger, and stores the form URL so the
// report's CTA button switches from mailto to the form automatically.
function setupLeadForm() {
  const ss = SpreadsheetApp.getActive();
  const form = FormApp.create("What's my " + CONFIG.farmName + " home worth?");
  form.setDescription('Get your home\'s real number — based on MLS sold data the public sites can\'t see. ' +
    'No pressure, just data.\n' + CONFIG.agentName + ' — ' + CONFIG.agentBrand + ' · ' + CONFIG.brokerage +
    ' · ' + CONFIG.agentPhone + ' · Equal Housing Opportunity');
  form.addTextItem().setTitle('Property address').setRequired(true);
  form.addTextItem().setTitle('Your name').setRequired(true);
  form.addTextItem().setTitle('Phone (call/text)');
  form.addTextItem().setTitle('Email').setRequired(true);
  form.addMultipleChoiceItem().setTitle('Thinking of selling…')
    .setChoiceValues(['Within 6 months', '6–12 months', '1–2 years', 'Just curious about the number']);
  form.addParagraphTextItem().setTitle('Anything I should know? (upgrades, finished basement, etc.)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  const url = form.getPublishedUrl();
  PropertiesService.getScriptProperties().setProperty('LEAD_FORM_URL', url);
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onLeadSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onLeadSubmit').forSpreadsheet(ss).onFormSubmit().create();
  try {
    SpreadsheetApp.getUi().alert('Lead form is LIVE:\n' + url +
      '\n\nResponses land in a "Form Responses" tab here, and you get an instant email per lead.' +
      '\n\nNow run 🌐 Publish to GitHub so the report button points at the form.');
  } catch (e) { Logger.log('Lead form: ' + url); }
  return url;
}

// Fires on every form submission — instant lead alert to your inbox.
function onLeadSubmit(e) {
  const vals = e.namedValues || {};
  const v = k => (vals[k] && vals[k][0]) ? vals[k][0] : '—';
  MailApp.sendEmail({
    to: CONFIG.agentEmail,
    subject: '🔥 NEW ' + CONFIG.farmShort + ' LEAD: ' + v('Property address') + ' — ' + v('Thinking of selling…'),
    body: 'Name: ' + v('Your name') +
      '\nPhone: ' + v('Phone (call/text)') +
      '\nEmail: ' + v('Email') +
      '\nAddress: ' + v('Property address') +
      '\nTimeframe: ' + v('Thinking of selling…') +
      '\nNotes: ' + v('Anything I should know? (upgrades, finished basement, etc.)') +
      '\n\nSpeed-to-lead wins — call them now.\n— ' + CONFIG.farmShort + ' Pipeline ' + VERSION
  });
}

// ---------- ▶ RUN TAB — tap a checkbox to run (works on MOBILE) ----------
const RUN_ACTIONS = [
  ['▶ Build Stats & Dashboard', 'buildStats', 'Absorb 📥 Paste + refresh Stats, Dashboard, Pricing Model'],
  ['✅ Check Setup', 'checkSetup', 'Verify token, lead form, triggers, and data'],
  ['🎬 Generate Video Script', 'generateScript', 'Draft this month\'s video script in the Script tab'],
  ['🌐 Publish to GitHub', 'publishToGitHub', 'Push the live report to your GitHub Pages URL']
];

function buildRunTab_() {
  const ss = SpreadsheetApp.getActive();
  const b = CONFIG.brand;
  const sh = ss.getSheetByName('▶ Run') || ss.insertSheet('▶ Run', 0);
  sh.clear();
  sh.getRange('A1:D1').merge().setValue('📊 ' + CONFIG.farmShort + ' MARKET — CONTROL PANEL · ' + VERSION)
    .setBackground(b.navy).setFontColor(b.cream).setFontSize(14).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(1, 40);
  sh.getRange('A2:D2').merge().setValue('Tap a checkbox to run. Works on phone and desktop. Status appears on the right.')
    .setBackground(b.camel).setFontColor(b.navy).setFontStyle('italic').setHorizontalAlignment('center');
  const rows = RUN_ACTIONS.map(a => [false, a[0], a[2], '']);
  sh.getRange(3, 1, rows.length, 4).setValues(rows);
  sh.getRange(3, 1, rows.length, 1).insertCheckboxes();
  sh.getRange(3, 2, rows.length, 1).setFontWeight('bold').setFontColor(b.terracotta).setFontSize(12);
  sh.getRange(3, 3, rows.length, 1).setFontColor(b.navy).setFontSize(9);
  for (let i = 0; i < rows.length; i++) {
    sh.setRowHeight(3 + i, 34);
    if (i % 2 === 0) sh.getRange(3 + i, 1, 1, 4).setBackground(b.cream);
  }
  sh.setColumnWidth(1, 50).setColumnWidth(2, 220).setColumnWidth(3, 280).setColumnWidth(4, 280);
  sh.setFrozenRows(2);
}

// One-time: installs the trigger that makes the checkboxes work.
// (Must be an INSTALLABLE trigger — simple onEdit can't call UrlFetchApp/GitHub.)
function installRunTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onRunEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onRunEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
  buildRunTab_();
  try { SpreadsheetApp.getUi().alert('▶ Run tab is armed. Tap any checkbox to run that command — including from your phone.'); }
  catch (e) { Logger.log('Run tab armed.'); }
}

function onRunEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== '▶ Run' || e.range.getColumn() !== 1) return;
  if (e.range.getValue() !== true) return;
  const idx = e.range.getRow() - 3;
  if (idx < 0 || idx >= RUN_ACTIONS.length) return;
  e.range.setValue(false);
  const fns = { buildStats, generateScript, publishToGitHub, checkSetup };
  const status = sh.getRange(e.range.getRow(), 4);
  status.setValue('⏳ Running…');
  SpreadsheetApp.flush();
  try {
    const result = fns[RUN_ACTIONS[idx][1]]();
    status.setValue('✅ ' + new Date().toLocaleString() +
      (typeof result === 'string' ? '  →  ' + result : ''));
  } catch (err) {
    status.setValue('❌ ' + err.message);
  }
}
function publishToGitHubWithAlert() {
  const url = publishToGitHub();
  SpreadsheetApp.getUi().alert('Published! Live at:\n' + url +
    '\n(GitHub Pages can take 1-2 min to refresh)');
}

const CONFIG = {
  // == LOCATION SETTINGS - the only lines to edit per location ==
  farmName: 'Lehi',                     // full name: 'Lehi', 'Eagle Mountain', 'Tooele'
  farmShort: 'Lehi',                    // short label: 'Lehi', 'EM', 'Tooele' - drives '<X> Market Index' etc.
  areaLine: 'all of Lehi',              // chart caption: 'all of Lehi'
  numbersLine: "Here's Lehi in numbers.",         // video intro
  agentTagline: 'Data-driven real estate in Lehi',
  // ALSO per location: github.path below ('index.html' TM / 'lehi/index.html' Lehi / ...)
  // =============================================================
  agentName: 'Lance Anderson',
  agentBrand: 'Lance the Realtor',
  agentEmail: 'lancea141@gmail.com',
  agentPhone: '(801) 860-5225',
  brokerage: 'Jason Mitchell Real Estate Utah LLC',
  licenseNo: '',                          // ← optional: UT license #
  website: 'https://LocalwithLance.com',
  linktree: 'https://linktr.ee/Lance141',
  // Logo is embedded as a data URI at build time via DriveApp — no sharing needed
  logoFileId: '1NosHz-mLGpPckIeBhrQpgtwH5YU_Lu6s',
  youtubeUrl: 'https://www.youtube.com/@lance141',
  newConYear: 2024, // Year Built >= this = "new construction"
  brand: { terracotta:'#C0652A', olive:'#6B7A3A', navy:'#2F3E46', camel:'#C2A178', cream:'#F4EDE4' },
  // GitHub Pages publishing — see publishToGitHub() for one-time setup steps
  github: {
    owner: 'lancea141-source',
    repo: 'tm-market-update',
    branch: 'main',
    path: 'lehi/index.html'
  }
};

// ---------- helpers ----------
const num_ = v => {
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) || String(v).trim() === '' ? null : n;
};
function median_(arr) {
  const a = arr.filter(v => v != null && !isNaN(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
// ---------- data (self-healing parser) ----------
// Scans the Solds and Actives tabs row by row. Handles messy imports where both
// exports landed stacked in one tab: any row starting "Sold Date" begins a solds
// block; any row starting "MLS#" begins an actives block. Data rows are assigned
// to whichever header appeared most recently above them.
function scanAll_() {
  const ss = SpreadsheetApp.getActive();
  const solds = [], actives = [];
  ['Data', 'Solds', 'Actives'].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() === 0) return;
    const v = sh.getDataRange().getValues();
    let mode = null, col = null;
    const mkCol = headers => {
      const h = headers.map(x => String(x).toLowerCase().trim());
      return label => h.indexOf(label.toLowerCase());
    };
    v.forEach(row => {
      const first = String(row[0]).toLowerCase().trim();
      const joined = row.map(x => String(x).toLowerCase()).join('|');
      // header rows: combined/solds exports start with "Sold Date"; old actives export starts with "MLS#"
      if (first === 'sold date') { mode = 'combined'; col = mkCol(row); return; }
      if (first === 'mls#' && joined.includes('agent')) { mode = 'oldActives'; col = mkCol(row); return; }
      if (!mode || !col) return;
      const g = label => { const i = col(label); return i > -1 ? num_(row[i]) : null; };
      const mlsIdx = col('MLS#');
      const mls = mlsIdx > -1 ? String(row[mlsIdx]).trim() : '';
      const impIdx = col('Imported');
      const impV = impIdx > -1 ? row[impIdx] : null;
      const impD = impV instanceof Date ? impV : (impV ? new Date(impV) : null);
      const imp = impD && !isNaN(impD) ? impD : null;

      if (mode === 'oldActives') {
        const lp = num_(row[col('List Price')]);
        if (!lp) return;
        actives.push({ lp, dom: g('DOM'), sqft: g('Total Square Feet'), mls, imp });
        return;
      }
      // combined block: route each row by its Status
      const stIdx = col('Status');
      const status = stIdx > -1 ? String(row[stIdx]).trim().toUpperCase() : 'SOLD';
      if (status === 'ACTIVE') {
        const lp = num_(row[col('List Price')]);
        if (!lp) return;
        actives.push({ lp, dom: g('DOM'), sqft: g('Total Square Feet'), mls, imp });
        return;
      }
      if (status !== 'SOLD') return; // skip UNDER CONTRACT/BACKUP etc.
      const sp = num_(row[col('Sold Price')]);
      if (!sp) return;
      const dateV = row[col('Sold Date')];
      // new-format extras (null-safe when pasting the old export format)
      const ag = (g('Main Floor Square Feet') || 0) + (g('Second Floor Square Feet') || 0) +
                 (g('Third Floor Square Feet') || 0) + (g('Fourth Floor Square Feet') || 0);
      const bs = (g('Basement Square Feet') || 0) + (g('Basement 2 Square Feet') || 0) +
                 (g('Basement 3 Square Feet') || 0);
      const bTypeIdx = col('Basement');
      solds.push({
        sp, lp: num_(row[col('List Price')]),
        date: dateV instanceof Date ? dateV : (dateV ? new Date(dateV) : null),
        dom: g('DOM'), sqft: g('Total Square Feet'),
        yb: g('Year Built'), bf: g('Basement Finished'),
        isTH: /town|condo/i.test(String(row[col('Style')] || '')),
        ag: ag || null, bs,
        l1: g('Main Floor Square Feet'),
        up: (g('Second Floor Square Feet') || 0) + (g('Third Floor Square Feet') || 0) +
            (g('Fourth Floor Square Feet') || 0),
        gar: g('Garage Capacity'), bd: g('Total Bedrooms'),
        fb: g('Total Full Bathrooms'), tq: g('Total Three-quarter Bathrooms'),
        hb: g('Total Half Bathrooms'),
        acres: g('Acres') || 0,
        walk: bTypeIdx > -1 ? /walkout|daylight/i.test(String(row[bTypeIdx] || '')) : false,
        mls, imp
      });
    });
  });
  // v24 dedupe & staleness rules:
  //  · duplicate MLS#: the row from the NEWEST import wins (later paste beats older)
  //  · actives are a SNAPSHOT: only the latest import's actives count
  //  · any MLS# that appears as SOLD is never counted as active
  const tms = d => d ? new Date(d).getTime() : 0;
  const pick = arr => {
    const m = {};
    arr.forEach((r, i) => {
      const k = r.mls || ('~row' + i);
      if (!m[k] || tms(r.imp) >= tms(m[k].imp)) m[k] = r;
    });
    return Object.values(m);
  };
  const s = pick(solds);
  const soldSet = new Set(s.map(r => r.mls).filter(Boolean));
  let a = pick(actives).filter(r => !soldSet.has(r.mls));
  const maxImp = Math.max(0, ...a.map(r => tms(r.imp)));
  a = a.filter(r => tms(r.imp) === maxImp);
  if (!s.length) throw new Error('No sold rows found. Paste your export (header starts with "Sold Date") into the ' + PASTE_TAB + ' tab, then run ▶ Build Stats.');
  return { solds: s, actives: a };
}
function getSolds_() { return scanAll_().solds; }
function getActives_() { return scanAll_().actives; }

// ---------- stats ----------
function computeStats_() {
  const { solds, actives } = scanAll_();
  const now = new Date();
  const monthsAgo = m => { const d = new Date(now); d.setMonth(d.getMonth() - m); return d; };
  const win = (rs, mFrom, mTo) => rs.filter(r => r.date && r.date >= monthsAgo(mFrom) && (mTo == null || r.date < monthsAgo(mTo)));

  const last12 = win(solds, 12), last3 = win(solds, 3), prev3 = win(solds, 6, 3);
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const last30 = solds.filter(r => r.date && r.date >= d30);
  const ppsf = rs => median_(rs.filter(r => r.sqft).map(r => r.sp / r.sqft));
  const stl = rs => median_(rs.filter(r => r.lp).map(r => r.sp / r.lp * 100));

  // Segments (12 mo)
  const seg = (label, rs) => ({
    label, n: rs.length,
    medPrice: median_(rs.map(r => r.sp)),
    medPpsf: ppsf(rs), medDom: median_(rs.map(r => r.dom)), stl: stl(rs)
  });
  const resale = last12.filter(r => r.yb && r.yb < CONFIG.newConYear);
  const newCon = last12.filter(r => r.yb && r.yb >= CONFIG.newConYear);
  const segments = [
    seg('Resale — Single Family', resale.filter(r => !r.isTH)),
    seg('Resale — Town/Condo', resale.filter(r => r.isTH)),
    seg('New Construction — Single Family', newCon.filter(r => !r.isTH)),
    seg('New Construction — Town/Condo', newCon.filter(r => r.isTH))
  ].filter(s => s.n > 0);

  // Basement premium (resale SFH)
  const rsf = resale.filter(r => !r.isTH && r.bf != null);
  const basement = {
    fin: median_(rsf.filter(r => r.bf >= 50).map(r => r.sp)),
    unf: median_(rsf.filter(r => r.bf < 50).map(r => r.sp))
  };

  // Monthly trend
  const byMonth = {};
  last12.forEach(r => {
    const k = Utilities.formatDate(r.date, Session.getScriptTimeZone(), 'yyyy-MM');
    (byMonth[k] = byMonth[k] || []).push(r);
  });
  const trend = Object.keys(byMonth).sort().map(k => ({
    month: k, n: byMonth[k].length, medPrice: median_(byMonth[k].map(r => r.sp))
  }));

  // Months of Supply (industry standard): active listings ÷ avg monthly sales.
  // Scale: <4 = seller's market · 4–6 = balanced · >6 = buyer's market
  const moi = last12.length ? actives.length / (last12.length / 12) : null;
  const moiRating = moi == null ? '—' : moi < 4 ? "Seller's Market" : moi <= 6 ? 'Balanced Market' : "Buyer's Market";

  // TM Market Index (0-100): velocity, price momentum, DOM (inv), sale-to-list, inventory (inv)
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const velocity = prev3.length ? clamp(last3.length / prev3.length, 0, 2) / 2 : 0.5;
  // Price momentum on RESALE ONLY — immune to new-construction mix shift.
  // Falls back to all sales if the resale sample is too thin.
  const isResale = r => r.yb && r.yb < CONFIG.newConYear;
  let pmCur = median_(last3.filter(isResale).map(r => r.sp));
  let pmPrev = median_(prev3.filter(isResale).map(r => r.sp));
  let pmLabel = 'resale medians';
  if (last3.filter(isResale).length < 8 || prev3.filter(isResale).length < 8) {
    pmCur = median_(last3.map(r => r.sp)); pmPrev = median_(prev3.map(r => r.sp));
    pmLabel = 'all-sales medians';
  }
  const priceMom = pmPrev ? (clamp(pmCur / pmPrev, 0.8, 1.2) - 0.8) / 0.4 : 0.5;
  const domScore = median_(last3.map(r => r.dom)) != null ? clamp(1 - median_(last3.map(r => r.dom)) / 120, 0, 1) : 0.5;
  const stlScore = stl(last3) ? clamp((stl(last3) - 90) / 15, 0, 1) : 0.5;
  const moiScore = moi != null ? clamp(1 - moi / 10, 0, 1) : 0.5; // 5 mo supply (middle of balanced 4-6) = 50
  const index = Math.round((velocity * .2 + priceMom * .2 + domScore * .2 + stlScore * .2 + moiScore * .2) * 100);

  // Published component breakdown (each 0-100, equal 20% weight)
  const components = [
    { name: 'Sales velocity', raw: last3.length + ' sales vs ' + prev3.length + ' prior qtr',
      score: Math.round(velocity * 100), how: 'more sales than last quarter = hotter' },
    { name: 'Price momentum', raw: '$' + Math.round((pmCur || 0) / 1000) + 'K vs $' +
      Math.round((pmPrev || 0) / 1000) + 'K prior qtr (' + pmLabel + ')',
      score: Math.round(priceMom * 100), how: 'price trend vs last quarter, resale-based to avoid mix distortion' },
    { name: 'Days on market', raw: median_(last3.map(r => r.dom)) + ' days',
      score: Math.round(domScore * 100), how: 'faster = higher (scaled to 120 days)' },
    { name: 'Sale-to-list ratio', raw: (stl(last3) || 0).toFixed(1) + '%',
      score: Math.round(stlScore * 100), how: 'scaled from 90% to 105%' },
    { name: 'Months of Supply', raw: (moi || 0).toFixed(1) + ' mo — ' + moiRating,
      score: Math.round(moiScore * 100), how: 'industry scale: <4 seller · 4–6 balanced · >6 buyer' }
  ];

  return {
    updated: Utilities.formatDate(now, Session.getScriptTimeZone(), 'MMMM d, yyyy'),
    sales12: last12.length, sales3: last3.length, sales30: last30.length,
    medPrice30: median_(last30.map(r => r.sp)), components,
    resaleSales12: resale.length, newConShare: last12.length ? Math.round(newCon.length / last12.length * 100) : 0,
    medPrice3: median_(last3.map(r => r.sp)), medPpsf3: ppsf(last3), medPpsf12: ppsf(last12),
    medDom3: median_(last3.map(r => r.dom)), stl3: stl(last3),
    activeCount: actives.length, medActiveList: median_(actives.map(a => a.lp)),
    prev3Sales: prev3.length, prev3MedPrice: median_(prev3.map(r => r.sp)),
    prev3Ppsf: ppsf(prev3), prev3Dom: median_(prev3.map(r => r.dom)),
    moi, moiRating, index, segments, basement, trend,
    pm: pricingModel_(solds),
    cm: cmaModel_(solds),
    cmTH: cmaTHModel_(solds)
  };
}

// ---------- PRICING MODEL (INTERNAL — hedonic regression) ----------
// price ≈ intercept + rAG·AboveGradeSqFt + rFin·FinishedBsmtSqFt + rUnf·UnfinishedBsmtSqFt
//         + rAcre·Acres + walkoutPremium
// Fit on resale SFH ≤ $1.5M with per-level sqft (needs the new combined export).
function pricingModel_(solds) {
  const data = solds.filter(r =>
    r.yb && r.yb < CONFIG.newConYear && !r.isTH && r.ag && r.ag >= 400 &&
    r.bf != null && r.sp <= 1500000);
  if (data.length < 40) return { ok: false, n: data.length };
  const rows = data.map(r => ({
    y: r.sp,
    x: [1, r.ag, r.bs * r.bf / 100, r.bs * (1 - r.bf / 100), r.acres || 0, r.walk ? 1 : 0]
  }));
  const n = 6;
  const XtX = [], Xty = [];
  for (let a = 0; a < n; a++) {
    Xty[a] = rows.reduce((s, r) => s + r.x[a] * r.y, 0);
    XtX[a] = [];
    for (let b = 0; b < n; b++) XtX[a][b] = rows.reduce((s, r) => s + r.x[a] * r.x[b], 0);
  }
  const A = XtX.map((row, i) => row.concat([Xty[i]]));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    const tmp = A[c]; A[c] = A[p]; A[p] = tmp;
    for (let r = 0; r < n; r++) {
      if (r !== c && A[c][c]) {
        const f = A[r][c] / A[c][c];
        for (let k = 0; k <= n; k++) A[r][k] -= f * A[c][k];
      }
    }
  }
  const beta = A.map((row, i) => row[n] / row[i]);
  const preds = rows.map(r => r.x.reduce((s, x, i) => s + x * beta[i], 0));
  const errs = rows.map((r, i) => Math.abs(r.y - preds[i]) / r.y * 100).sort((x, y) => x - y);
  const ybar = rows.reduce((s, r) => s + r.y, 0) / rows.length;
  const ssRes = rows.reduce((s, r, i) => s + Math.pow(r.y - preds[i], 2), 0);
  const ssTot = rows.reduce((s, r) => s + Math.pow(r.y - ybar, 2), 0);
  return {
    ok: true, n: rows.length,
    intercept: beta[0], ag: beta[1], fin: beta[2], unf: beta[3], acre: beta[4], walk: beta[5],
    r2: 1 - ssRes / ssTot, medErr: errs[Math.floor(errs.length / 2)]
  };
}

function buildPricingTab_(m) {
  const ss = SpreadsheetApp.getActive();
  const b = CONFIG.brand;
  const sh = ss.getSheetByName('Pricing Model') || ss.insertSheet('Pricing Model');
  sh.clear();
  sh.getRange('A1:C1').merge().setValue('🔒 PRICING MODEL — INTERNAL ONLY, DO NOT PUBLISH')
    .setBackground(b.navy).setFontColor(b.cream).setFontWeight('bold').setHorizontalAlignment('center');
  if (!m.ok) {
    sh.getRange('A3').setValue('Not enough model data (' + m.n + ' usable resale SFH rows; need 40+).' +
      ' Paste the combined export with per-floor square footage into the Data tab.');
    return;
  }
  const grade = m.medErr < 6 ? '🟢 PUBLISH-GRADE (median error < 6%)'
    : m.medErr < 10 ? '🟡 CMA/INTERNAL USE — publish ratios only, not $ rates'
    : '🔴 DIRECTIONAL ONLY';
  const rows = [
    ['Sample', m.n + ' resale SFH ≤ $1.5M (excl. new construction & townhomes)', ''],
    ['Model quality', 'R² = ' + m.r2.toFixed(3) + ' · median error ± ' + m.medErr.toFixed(1) + '%', grade],
    ['', '', ''],
    ['COMPONENT RATES', '$ / sqft', '% of above-grade'],
    ['Above-grade sqft', '$' + Math.round(m.ag), '100%'],
    ['Finished basement sqft', '$' + Math.round(m.fin), Math.round(m.fin / m.ag * 100) + '%'],
    ['Unfinished basement sqft', '$' + Math.round(m.unf), Math.round(m.unf / m.ag * 100) + '%'],
    ['Walkout/daylight premium', '+$' + Math.round(m.walk).toLocaleString() + ' (flat)', ''],
    ['Lot', '$' + Math.round(m.acre).toLocaleString() + ' per acre', ''],
    ['Base (intercept)', '$' + Math.round(m.intercept).toLocaleString(), ''],
    ['', '', ''],
    ['CMA USAGE', 'Adjust comps: (sqft difference) × component rate. Walkout premium applies once.', ''],
    ['VALUE ESTIMATE', '= base + AG×' + Math.round(m.ag) + ' + finBsmt×' + Math.round(m.fin) +
      ' + unfBsmt×' + Math.round(m.unf) + ' + acres×' + Math.round(m.acre) +
      ' (+' + Math.round(m.walk).toLocaleString() + ' if walkout)', '± ' + m.medErr.toFixed(0) + '%']
  ];
  sh.getRange(3, 1, rows.length, 3).setValues(rows);
  sh.getRange(6, 1, 1, 3).setBackground(b.olive).setFontColor(b.cream).setFontWeight('bold');
  sh.getRange(4, 3).setFontWeight('bold').setFontColor(m.medErr < 6 ? b.olive : b.terracotta);
  sh.setColumnWidth(1, 220).setColumnWidth(2, 420).setColumnWidth(3, 260);
}

// ---------- Stats tab (video script source) ----------
function buildStats() {
  const abs = absorbPaste_();   // 📥 Paste tab → Data (stamped, deduped, trimmed)
  const s = computeStats_();
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Stats') || ss.insertSheet('Stats');
  sh.clear();
  const $ = n => n == null ? '—' : '$' + Math.round(n).toLocaleString();
  const rows = [
    [CONFIG.farmShort + ' MARKET STATS', 'Updated ' + s.updated],
    [CONFIG.farmShort + ' Market Index (0-100)', s.index + '  (50 = balanced; higher = seller\'s market)'],
    ...s.components.map(c => ['   · ' + c.name, c.score + '/100 — ' + c.raw]),
    ['Sales — last 12 mo', s.sales12 + ' (' + s.resaleSales12 + ' resale / ' + s.newConShare + '% new-con)'],
    ['Sales — last 90 days', s.sales3],
    ['Sales — last 30 days', s.sales30 + (s.medPrice30 ? ' (median ' + $(s.medPrice30) + ')' : '')],
    ['Median sold price (90d)', $(s.medPrice3)],
    ['Median $/sqft (90d)', s.medPpsf3 ? '$' + Math.round(s.medPpsf3) : '—'],
    ['Median DOM (90d)', s.medDom3],
    ['Sale-to-list % (90d)', s.stl3 ? s.stl3.toFixed(1) + '%' : '—'],
    ['Active listings now', s.activeCount + ' (median list ' + $(s.medActiveList) + ')'],
    ['Months of Supply (industry standard)', (s.moi ? s.moi.toFixed(1) : '—') + ' — ' + s.moiRating + '  (<4 seller · 4–6 balanced · >6 buyer)'],
    ['[INTERNAL ONLY — unverified, do not publish] Basement premium (resale SFH)', $(s.basement.fin) + ' vs ' + $(s.basement.unf)],
    ['', ''],
    ['SEGMENTS (12 mo)', 'Sales | Med Price | $/sqft | DOM | STL%']
  ];
  s.segments.forEach(t => rows.push([
    t.label,
    `${t.n} | ${$(t.medPrice)} | $${Math.round(t.medPpsf || 0)} | ${t.medDom || '—'}d | ${t.stl ? t.stl.toFixed(1) : '—'}%`
  ]));
  rows.push(['', ''], ['MONTHLY TREND', 'Sales | Med Price']);
  s.trend.forEach(t => rows.push([t.month, `${t.n} | ${$(t.medPrice)}`]));
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.autoResizeColumns(1, 2);
  buildDashboard_(s);
  try { buildPricingTab_(s.pm); } catch (e) { Logger.log('Pricing model: ' + e); }
  try { buildCmaTab_(s.cm, s.pm, s.cmTH); } catch (e) { Logger.log('CMA tab: ' + e); }
  CacheService.getScriptCache().put('stats', JSON.stringify(s), 21600);
  return abs ? 'absorbed ' + abs.solds + ' solds · ' + abs.actives + ' actives' : 'rebuilt from existing data';
}

// ---------- ONE-TIME WORKBOOK SETUP (run this FIRST) ----------
// Creates all tabs with branded formatting, matching Lance's showing-sheet style:
// Dashboard (presentation) · Solds (raw) · Actives (raw) · Stats · Script · ReadMe
function setupWorkbook() {
  const ss = SpreadsheetApp.getActive();
  const b = CONFIG.brand;
  const tab = name => ss.getSheetByName(name) || ss.insertSheet(name);

  // --- ReadMe / cover ---
  const rm = tab('ReadMe');
  rm.clear();
  rm.getRange('A1:B9').setValues([
    [CONFIG.farmShort + ' MARKET UPDATE — DATA WORKBOOK (' + VERSION + ')', ''],
    [CONFIG.agentBrand + ' · ' + CONFIG.brokerage, ''],
    [CONFIG.agentPhone + ' · ' + CONFIG.agentEmail, ''],
    ['', ''],
    ['MONTHLY WORKFLOW', ''],
    ['1. Paste fresh WFRMLS export', '📥 Paste tab ← the month\'s export (recent solds + ALL current actives), headers included'],
    ['2. Run ▶ Build Stats', 'absorbs the paste into Data (date-stamped, deduped, trimmed to 25 mo) and refreshes Stats + Dashboard + Pricing Model'],
    ['3. Run generateScript()', 'drafts this month\'s video script in the Script tab'],
    ['4. Run publishToGitHub()', 'pushes the report live to your GitHub Pages URL for sharing']
  ]);
  rm.getRange('A1').setFontSize(16).setFontWeight('bold').setFontColor(b.terracotta);
  rm.getRange('A2:A3').setFontColor(b.navy);
  rm.getRange('A5').setFontWeight('bold').setBackground(b.navy).setFontColor(b.cream);
  rm.setColumnWidth(1, 260).setColumnWidth(2, 560);

  // --- single Data tab for the combined export (paste multiple exports one under the other) ---
  const dataHeaders = ['Sold Date','Entry Date','Sold Price','Status','List Price','Original List Price',
    'MLS#','DOM','Time Under Contract','Total Square Feet','Main Floor Square Feet',
    'Second Floor Square Feet','Third Floor Square Feet','Fourth Floor Square Feet',
    'Basement Square Feet','Basement 2 Square Feet','Basement 3 Square Feet','Basement',
    'Basement Finished','ADU Square Feet','Price Per Square Foot','Address','City','Style',
    'Total Half Bathrooms','Total Three-quarter Bathrooms','Total Full Bathrooms','Total Bedrooms',
    'Total Bathrooms','Solar?','Year Built','Effective Year Built','Acres','Garage Capacity'];
  const dataSh = tab('Data');
  if (dataSh.getLastRow() === 0) dataSh.getRange(1, 1, 1, dataHeaders.length).setValues([dataHeaders]);
  dataSh.getRange(1, 1, 1, dataHeaders.length)
    .setBackground(b.olive).setFontColor(b.cream).setFontWeight('bold');
  dataSh.setFrozenRows(1);

  tab('Stats'); tab('Script'); tab('Dashboard'); tab('Pricing Model'); tab('📐 CMA Adjustments'); tab('Import Log');
  const pasteSh = tab(PASTE_TAB);
  if (pasteSh.getLastRow() === 0) buildPasteBanner_(pasteSh);
  buildRunTab_();
  // order tabs (old Solds/Actives tabs, if present, sort after these)
  ['▶ Run', PASTE_TAB,'Dashboard','Stats','Script','Pricing Model','📐 CMA Adjustments','Data','Import Log','ReadMe'].forEach((n, i) => {
    ss.setActiveSheet(ss.getSheetByName(n)); ss.moveActiveSheet(i + 1);
  });
  const s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0) ss.deleteSheet(s1);
  ss.setActiveSheet(ss.getSheetByName('ReadMe'));
}

// ---------- DASHBOARD TAB (showing-sheet style presentation) ----------
// Called automatically by buildStats(). Branded header block + big stat rows + trend arrows.
function buildDashboard_(s) {
  const ss = SpreadsheetApp.getActive();
  const b = CONFIG.brand;
  const sh = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard');
  sh.clear();
  const $ = n => n == null ? '—' : '$' + Math.round(n).toLocaleString();

  // header block (showing-sheet pattern: navy bar, logo left via =IMAGE, title right)
  sh.setRowHeight(1, 90);
  const logoCell = sh.getRange(1, 1);
  logoCell.setBackground(b.navy)
    .setFormula('=IMAGE("https://drive.google.com/uc?export=view&id=' + CONFIG.logoFileId + '",4,80,120)')
    .setHorizontalAlignment('left').setVerticalAlignment('middle');
  sh.getRange(1, 2, 1, 3).merge().setValue('📊 ' + CONFIG.farmName.toUpperCase() + ' MARKET DASHBOARD')
    .setBackground(b.navy).setFontColor(b.cream).setFontSize(15).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.getRange('A2:D2').merge()
    .setValue(CONFIG.agentBrand + '  ·  ' + CONFIG.brokerage + '  ·  ' + CONFIG.agentPhone + '  ·  Updated ' + s.updated + '  ·  ' + VERSION)
    .setBackground(b.camel).setFontColor(b.navy).setHorizontalAlignment('center').setFontStyle('italic');

  // TM Index banner
  sh.getRange('A3:D3').merge()
    .setValue(CONFIG.farmShort + ' MARKET INDEX:  ' + s.index + '  —  ' + idxLabel_(s.index).toUpperCase() +
      '   |   SUPPLY: ' + (s.moi ? s.moi.toFixed(1) + ' MO — ' + s.moiRating.toUpperCase() : '—'))
    .setBackground(b.terracotta).setFontColor(b.cream).setFontSize(13).setFontWeight('bold')
    .setHorizontalAlignment('center');
  sh.setRowHeight(3, 36);

  // INDEX BREAKDOWN — the 5 published components, highlighted
  sh.getRange('A4:D4').merge().setValue('WHAT\'S DRIVING THE INDEX  (each 20% · 50 = neutral)')
    .setBackground(b.camel).setFontColor(b.navy).setFontWeight('bold').setHorizontalAlignment('center');
  const compRows = s.components.map(c => [c.name, c.raw, c.score + ' / 100', c.how]);
  sh.getRange(5, 1, compRows.length, 4).setValues(compRows);
  for (let k = 0; k < compRows.length; k++) {
    const r = 5 + k;
    sh.getRange(r, 1).setFontWeight('bold');
    sh.getRange(r, 3).setFontWeight('bold')
      .setFontColor(s.components[k].score >= 50 ? b.olive : b.terracotta);
    sh.getRange(r, 1, 1, 4).setBackground(k % 2 ? b.cream : '#ffffff');
    sh.setRowHeight(r, 28);
  }
  const statStart = 5 + compRows.length + 1;

  // stat rows: [label, value, vs prior qtr arrow, note]
  const arrow = (cur, prev, invert) => {
    if (cur == null || prev == null || !prev) return '';
    const pct = (cur - prev) / prev * 100;
    if (Math.abs(pct) < 1) return '→ flat';
    const up = pct > 0;
    return (up ? '▲ ' : '▼ ') + Math.abs(pct).toFixed(1) + '%' + ((up !== !!invert) ? ' ' : ' ');
  };
  const rows = [
    ['METRIC (last 90 days)', 'VALUE', 'VS PRIOR QTR', 'NOTE'],
    ['Homes sold — last 30 days', s.sales30, '', s.medPrice30 ? 'median ' + $(s.medPrice30) : ''],
    ['Homes sold', s.sales3, arrow(s.sales3, s.prev3Sales), ''],
    ['Median sold price', $(s.medPrice3), arrow(s.medPrice3, s.prev3MedPrice), 'blends new-con + resale'],
    ['Median $/sqft', s.medPpsf3 ? '$' + Math.round(s.medPpsf3) : '—', arrow(s.medPpsf3, s.prev3Ppsf), ''],
    ['Median days on market', s.medDom3, arrow(s.medDom3, s.prev3Dom, true), 'lower = hotter'],
    ['Sale-to-list ratio', s.stl3 ? s.stl3.toFixed(1) + '%' : '—', '', 'priced right = full price'],
    ['Active listings', s.activeCount, '', 'median list ' + $(s.medActiveList)],
    ['Months of Supply', (s.moi ? s.moi.toFixed(1) : '—') + ' — ' + s.moiRating, '', 'industry: <4 seller · 4–6 balanced · >6 buyer'],
    ['12-mo sales', s.sales12, '', s.newConShare + '% new construction'],
    ['Farmable resale sales (12 mo)', s.resaleSales12, '', 'the true farm market'],
    ['$/sqft spread by segment', s.segments.map(t => '$' + Math.round(t.medPpsf || 0)).join(' / '),
      '', s.segments.map(t => t.label.replace(' — ', ' ')).join(' / ')]
  ];
  sh.getRange(statStart, 1, rows.length, 4).setValues(rows);
  sh.getRange(statStart, 1, 1, 4).setBackground(b.olive).setFontColor(b.cream).setFontWeight('bold');
  // banding + arrow colors
  for (let i = 1; i < rows.length; i++) {
    const r = statStart + i;
    if (i % 2 === 0) sh.getRange(r, 1, 1, 4).setBackground(b.cream);
    const a = String(rows[i][2]);
    if (a.startsWith('▲')) sh.getRange(r, 3).setFontColor(b.olive).setFontWeight('bold');
    if (a.startsWith('▼')) sh.getRange(r, 3).setFontColor(b.terracotta).setFontWeight('bold');
    sh.setRowHeight(r, 30);
  }
  sh.getRange(statStart + rows.length + 1, 1, 1, 4).merge()
    .setValue('Utah is a non-disclosure state — this MLS sold data is not publicly available. · Equal Housing Opportunity')
    .setFontStyle('italic').setFontColor(b.olive).setFontSize(9);
  sh.setColumnWidth(1, 240).setColumnWidth(2, 200).setColumnWidth(3, 120).setColumnWidth(4, 220);
  sh.setFrozenRows(4);
}

// ---------- monthly video script generator ----------
// Run after buildStats(). Writes a filled-in 5-block script to the "Script" tab.
// You only rewrite the INSIGHT block; everything else is read-ready.
function generateScript() {
  const s = computeStats_();
  const $ = n => n == null ? '—' : '$' + Math.round(n).toLocaleString();
  const month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM yyyy');
  const domPrev = null; // optional: hardcode last month's DOM for the comparison line
  const idxLabel = idxLabel_(s.index).toLowerCase();

  const blocks = [
    ['BLOCK', 'SCRIPT — ' + CONFIG.farmShort + ' Market Update ' + month],
    ['1. HOOK (0:00-0:20)',
      `[INSERT INSIGHT-OF-THE-MONTH AS A CLAIM. Ex: "$/sqft in ${CONFIG.farmName} runs from ` +
      `$${Math.round(Math.min(...s.segments.map(t => t.medPpsf || 999)))} to ` +
      `$${Math.round(Math.max(...s.segments.map(t => t.medPpsf || 0)))} depending on segment — ` +
      `if your estimate used one number, it's wrong."] ` +
      `I'm Lance, I live in the data, and this is your ${month} ${CONFIG.farmName} Market Update.`],
    ['2. DASHBOARD (0:20-1:30)',
      `${CONFIG.numbersLine} In just the last 30 days, ${s.sales30} homes sold. ` +
      `Over the last 90 days, ${s.sales3}. ` +
      `Median price per square foot: $${Math.round(s.medPpsf3)}. ` +
      `Median days on market: ${s.medDom3}${domPrev ? ` — compared to ${domPrev} last quarter` : ''}. ` +
      `Sale-to-list ratio: ${s.stl3.toFixed(1)}% — correctly priced homes are getting their number. ` +
      `Now the industry-standard number: Months of Supply. ${s.activeCount} active listings at the current ` +
      `sales pace = ${s.moi.toFixed(1)} months. The standard scale says under 4 is a seller's market, ` +
      `4 to 6 is balanced, over 6 is a buyer's market — so ${CONFIG.farmShort} is officially a ${s.moiRating.toLowerCase()}. ` +
      `And my ${CONFIG.farmShort} Market Index — which blends supply with velocity, price momentum, DOM, and sale-to-list — ` +
      `sits at ${s.index}, where fifty is perfectly balanced: that's ${idxLabel}. ${reconcile_(s)} ` +
      `What's driving it this month: ${[...s.components].sort((a, b) => b.score - a.score)
        .map(c => c.name.toLowerCase() + ' at ' + c.score).join(', ')}.`],
    ['3. INSIGHT (1:30-3:00)',
      `[WRITE THIS MONTH'S STORY — one insight, 2-3 numbers max. Raw material: ` +
      `12-mo sales ${s.sales12} (${s.newConShare}% new construction, ${s.resaleSales12} resale). ` +
      `Segments: ${s.segments.map(t => `${t.label}: ${t.n} @ ${$(t.medPrice)} ($${Math.round(t.medPpsf || 0)}/sqft)`).join(' | ')}.]`],
    ['4. SO WHAT (3:00-4:00)',
      `If you're selling: [one sentence — e.g. pricing precision matters, resale competes with builders]. ` +
      `If you're buying: [one sentence — e.g. what ${s.medDom3}-day DOM and ${s.moi.toFixed(1)} months of supply mean for your offer].`],
    ['5. CTA (4:00-4:30)',
      `I publish the live ${CONFIG.farmName} data — the numbers Zillow legally can't show you — at the link below, ` +
      `updated every month. Want YOUR home's real number? Comment "DATA" or hit the link. ` +
      `No pressure, just data. See you next month.`],
    ['TITLE', `${CONFIG.farmName} Market Update ${month} — [HOOK AS CLAIM]`],
    ['STAT CARDS', `${s.sales3} sold (90d) · $${Math.round(s.medPpsf3)}/sqft · ${s.medDom3} DOM · ` +
      `${s.stl3.toFixed(1)}% sale-to-list · ${s.moi.toFixed(1)} mo inventory · Index ${s.index}`]
  ];
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Script') || ss.insertSheet('Script');
  sh.clear();
  sh.getRange(1, 1, blocks.length, 2).setValues(blocks);
  sh.setColumnWidth(2, 700);
  sh.getRange(1, 2, blocks.length, 1).setWrap(true);
}

// ---------- public branded page ----------
function doGet() {
  const cached = CacheService.getScriptCache().get('stats');
  const s = cached ? JSON.parse(cached) : computeStats_();
  return HtmlService.createHtmlOutput(buildHtml_(s))
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Logo as base64 data URI — baked into the HTML itself, renders anywhere
// (web app, GitHub Pages, email) regardless of Drive sharing settings.
function getLogoDataUri_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('logoUri');
  if (hit) return hit;
  try {
    const blob = DriveApp.getFileById(CONFIG.logoFileId).getBlob();
    const uri = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
    if (uri.length < 90000) cache.put('logoUri', uri, 21600); // cache if it fits
    return uri;
  } catch (e) {
    Logger.log('Logo fetch failed: ' + e);
    return ''; // page still renders, just without logo
  }
}

function buildHtml_(s) {
  const b = CONFIG.brand;
  const logo = getLogoDataUri_();
  const leadUrl = leadFormUrl_() ||
    `mailto:${CONFIG.agentEmail}?subject=What is my ${CONFIG.farmName} home worth?`;
  const $ = n => n == null ? '—' : '$' + Math.round(n).toLocaleString();

  const segRows = s.segments.map(t => `
    <tr><td>${t.label}</td><td>${t.n}</td><td>${$(t.medPrice)}</td>
    <td>${t.medPpsf ? '$' + Math.round(t.medPpsf) : '—'}</td><td>${t.medDom || '—'}</td></tr>`).join('');
  const maxN = Math.max(...s.trend.map(t => t.n), 1);
  const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const bars = s.trend.map((t, i) => {
    const mo = mNames[Number(t.month.slice(5)) - 1];
    const yr = (i === 0 || t.month.slice(5) === '01') ? `<b>'${t.month.slice(2, 4)}</b> ` : '';
    return `
    <div class="bar-wrap" title="${mo} ${t.month.slice(0, 4)}: ${t.n} homes sold">
      <span class="bar-val">${t.n}</span>
      <div class="bar" style="height:${Math.max(Math.round(t.n / maxN * 100), 3)}%"></div>
      <span class="bar-mo">${yr}${mo}</span>
    </div>`;
  }).join('');
  const yAxis = `
    <div class="y-axis"><span>${maxN}</span><span>${Math.round(maxN / 2)}</span><span>0</span></div>`;

  const html = `<!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${CONFIG.farmName} Market Update | ${CONFIG.agentName}</title>
  <style>
    :root{--terra:${b.terracotta};--olive:${b.olive};--navy:${b.navy};--camel:${b.camel};--cream:${b.cream}}
    *{box-sizing:border-box;margin:0}
    body{font-family:Georgia,serif;background:var(--cream);color:var(--navy)}
    .wrap{max-width:640px;margin:0 auto;padding:20px}
    header{text-align:center;padding:24px 0;border-bottom:3px solid var(--terra)}
    header img{max-height:70px}
    h1{font-size:1.5em;margin-top:10px}
    h3{margin:18px 0 8px}
    .updated{color:var(--olive);font-size:.85em;font-style:italic}
    .index-card{background:var(--navy);color:var(--cream);border-radius:12px;padding:24px;text-align:center;margin:20px 0}
    .index-num{font-size:3.2em;font-weight:bold;color:var(--camel)}
    .idx-scale{position:relative;display:flex;margin:16px 0 14px;border-radius:6px}
    .idx-zone{padding:5px 2px;font-size:.6em;color:var(--cream);text-align:center;line-height:1.3}
    .idx-zone:first-child{border-radius:6px 0 0 6px}
    .idx-zone:last-child{border-radius:0 6px 6px 0}
    .idx-marker{position:absolute;top:100%;transform:translateX(-50%);color:var(--camel);font-size:.85em}
    .comp-wrap{margin-top:18px;text-align:left}
    .comp-key{font-size:.62em;letter-spacing:.08em;color:var(--camel);font-weight:bold;margin-bottom:6px}
    .comp{display:flex;align-items:center;gap:10px;margin-top:8px}
    .comp-name{flex:0 0 34%;font-size:.8em}
    .comp-track{flex:1;position:relative;height:10px;background:rgba(244,237,228,.18);border-radius:5px;overflow:visible}
    .comp-fill{position:absolute;left:0;top:0;bottom:0;background:var(--terra);border-radius:5px}
    .comp-mid{position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:var(--camel);opacity:.8}
    .comp-score{flex:0 0 2.2em;font-weight:bold;color:var(--camel);font-size:.85em;text-align:right}
    .comp-raw{margin-left:calc(34% + 10px);font-size:.68em;color:var(--camel);font-style:italic}
    .index-note{margin-top:16px;font-size:.72em;font-style:italic;color:var(--cream);opacity:.85}
    .mos-card{background:#fff;border-radius:12px;padding:20px;text-align:center;margin:20px 0;border-top:4px solid var(--olive)}
    .mos-kicker{font-size:.75em;letter-spacing:.15em;color:var(--olive);font-weight:bold}
    .mos-num{font-size:2.6em;font-weight:bold;color:var(--navy);margin-top:4px}
    .mos-unit{font-size:.4em;color:var(--olive)}
    .mos-rating{font-size:1.1em;font-weight:bold;color:var(--terra)}
    .mos-scale{position:relative;display:flex;margin:18px 0 4px;border-radius:6px;overflow:visible}
    .mos-zone{flex:1;padding:6px 2px;font-size:.65em;color:var(--cream);text-align:center;line-height:1.3}
    .mos-zone:first-child{border-radius:6px 0 0 6px;flex:0 0 40%}
    .mos-zone:nth-child(2){flex:0 0 20%}
    .mos-zone:last-child{border-radius:0 6px 6px 0;flex:0 0 40%}
    .mos-marker{position:absolute;top:100%;transform:translateX(-50%);color:var(--navy);font-size:.9em}
    .mos-axis{font-size:.62em;color:var(--olive);font-style:italic;margin-top:14px}
    .kv-block{margin-top:14px;text-align:left}
    .kv-head{font-size:.68em;font-weight:bold;letter-spacing:.12em;color:var(--olive);margin:10px 0 4px}
    .kv-row{display:flex;justify-content:space-between;gap:10px;font-size:.78em;padding:4px 0;border-bottom:1px solid rgba(107,122,58,.15)}
    .kv-row span:last-child,.kv-row b:last-child{text-align:right}
    .kv-foot{font-size:.68em;font-style:italic;color:var(--olive);margin-top:6px}
    .mos-reconcile{margin-top:14px;font-size:.78em;text-align:left;background:var(--cream);border-left:4px solid var(--terra);padding:10px;border-radius:0 6px 6px 0}
    .vt{width:100%;border-collapse:collapse;font-size:.95em;margin:4px 0;background:transparent}
    .vt th{background:transparent;color:var(--olive);font-size:.8em;text-align:left;padding:3px 6px 3px 0;border-bottom:1px solid var(--camel)}
    .vt td{padding:5px 6px 5px 0;border-bottom:1px solid rgba(194,161,120,.4);vertical-align:top}
    .vt-bottom{margin-top:8px;font-size:.95em}
    .pm-card{background:#fff;border-radius:12px;padding:18px;margin:14px 0;border-top:4px solid var(--navy)}
    .pm-sub{font-size:.72em;color:var(--olive);font-style:italic;margin:2px 0 8px}
    .ignore-box{margin-top:12px;border:2px solid var(--terra);border-radius:8px;padding:10px;background:rgba(244,237,228,.5)}
    .ignore-title{font-size:.7em;font-weight:bold;letter-spacing:.12em;color:var(--terra);margin-bottom:4px}
    .ignore-why{font-size:.72em;margin-top:4px}
    .ppsf-close{margin-top:10px;font-size:.78em;text-align:center;font-weight:bold}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
    .stat{background:#fff;border-radius:10px;padding:14px;text-align:center;border-top:4px solid var(--terra)}
    .stat b{display:block;font-size:1.3em}
    .stat span{font-size:.75em;color:var(--olive)}
    table{width:100%;background:#fff;border-radius:10px;border-collapse:collapse;overflow:hidden;font-size:.82em;margin:12px 0}
    th{background:var(--olive);color:var(--cream);padding:8px;text-align:left}
    td{padding:8px;border-bottom:1px solid var(--cream)}
    .chart-outer{display:flex;background:#fff;border-radius:10px;padding:14px 14px 8px 6px;gap:6px}
    .y-axis{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;
      font-size:.6em;color:var(--olive);padding-bottom:26px;padding-top:12px;min-width:20px}
    .chart{display:flex;align-items:flex-end;gap:4px;height:150px;flex:1;border-left:1px solid var(--camel);padding-left:6px}
    .bar-wrap{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}
    .bar{width:100%;background:var(--terra);border-radius:3px 3px 0 0;min-height:4px}
    .bar-val{font-size:.6em;font-weight:bold;color:var(--navy);margin-bottom:2px}
    .bar-mo{font-size:.55em;margin-top:4px;color:var(--olive);white-space:nowrap}
    .insight{background:var(--camel);color:var(--navy);border-radius:10px;padding:16px;margin:14px 0;font-size:.92em}
    .insight-title{font-weight:bold}
    .insight-sub{font-size:.75em;font-style:italic;margin:4px 0 10px;opacity:.85}
    .ppsf-head{font-size:.62em;font-weight:bold;opacity:.75;margin-bottom:-2px}
    .ppsf-warn{margin-top:12px;padding:10px;font-size:.78em;line-height:1.55;background:rgba(244,237,228,.6);border-left:4px solid var(--terra);border-radius:0 6px 6px 0}
    .ppsf-row{display:flex;align-items:center;gap:8px;margin-top:6px}
    .ppsf-name{flex:0 0 44%;font-size:.78em;line-height:1.2}
    .ppsf-track{flex:1;height:12px;background:rgba(47,62,70,.15);border-radius:6px;overflow:hidden}
    .ppsf-fill{display:block;height:100%;background:var(--navy);border-radius:6px}
    .ppsf-val{flex:0 0 3em;font-weight:bold;font-size:.9em;text-align:right}
    .ppsf-diff{flex:0 0 2.8em;font-size:.72em;font-weight:bold;text-align:right}
    .ppsf-ref{margin-top:10px;padding-top:10px;border-top:1px solid rgba(47,62,70,.25)}
    .ppsf-fill-ref{background:repeating-linear-gradient(45deg,var(--cream),var(--cream) 4px,rgba(47,62,70,.35) 4px,rgba(47,62,70,.35) 8px)}
    .ppsf-diff{white-space:nowrap}
    .ppsf-takeaway{margin-top:12px;padding-top:10px;border-top:1px solid rgba(47,62,70,.25);font-size:.8em;line-height:1.6;text-align:center}
    .cta{display:block;background:var(--terra);color:var(--cream);text-align:center;padding:16px;border-radius:10px;text-decoration:none;font-size:1.05em;margin:14px 0}
    footer{text-align:center;font-size:.75em;color:var(--olive);padding:20px 0}
  </style></head><body><div class="wrap">
  <header>
    ${logo ? `<img src="${logo}" alt="${CONFIG.agentBrand}">` : ''}
    <h1>${CONFIG.farmName} Market Update</h1>
    <div class="updated">Live MLS data · Updated ${s.updated}</div>
    <div class="updated">${CONFIG.agentBrand} · ${CONFIG.brokerage}</div>
  </header>
  <div class="index-card">
    <div>${CONFIG.farmShort} MARKET INDEX</div>
    <div class="index-num">${s.index}</div>
    <div>${idxLabel_(s.index)}</div>
    <div class="idx-scale">
      <div class="idx-zone" style="flex:0 0 40%;background:var(--olive)">Buyer's<br>&lt; 40</div>
      <div class="idx-zone" style="flex:0 0 10%;background:#8a9a55">Lean buy<br>40–50</div>
      <div class="idx-zone" style="flex:0 0 10%;background:#d08a52">Lean sell<br>50–60</div>
      <div class="idx-zone" style="flex:0 0 40%;background:var(--terra)">Seller's<br>&gt; 60</div>
      <div class="idx-marker" style="left:${Math.min(Math.max(s.index, 2), 98)}%">▲</div>
    </div>
    <div class="comp-wrap">
      <div class="comp-key">HOW TO READ: each signal scored 0–100 · 50 = neutral · higher favors sellers</div>
      ${s.components.map(c => `
      <div class="comp">
        <span class="comp-name">${c.name}</span>
        <span class="comp-track"><span class="comp-fill" style="width:${c.score}%"></span><span class="comp-mid"></span></span>
        <span class="comp-score">${c.score}</span>
      </div>
      <div class="comp-raw">${c.raw} · <i>${c.how}</i></div>`).join('')}
    </div>
    <div class="index-note">The ${CONFIG.farmShort} Market Index is my proprietary composite: five components, equally weighted,
    from the last 90 days of MLS data. 50 = a perfectly balanced market — above 50 favors sellers, below favors buyers.</div>
  </div>

  <div class="mos-card">
    <div class="mos-kicker">MONTHS OF SUPPLY — the industry standard</div>
    <div class="mos-num">${s.moi ? s.moi.toFixed(1) : '—'}<span class="mos-unit"> months</span></div>
    <div class="mos-rating">${s.moiRating}</div>
    <div class="mos-scale">
      <div class="mos-zone" style="background:var(--olive);flex:0 0 40%">Buyer's<br>&gt; 6 mo</div>
      <div class="mos-zone" style="background:var(--camel);color:var(--navy);flex:0 0 20%">Balanced<br>4–6 mo</div>
      <div class="mos-zone" style="background:var(--terra);flex:0 0 40%">Seller's<br>&lt; 4 mo</div>
      <div class="mos-marker" style="left:${s.moi ? Math.min(Math.max((10 - s.moi) / 10 * 100, 2), 98) : 50}%">▲</div>
    </div>
    <div class="mos-axis">← more supply&nbsp;&nbsp;·&nbsp;&nbsp;less supply →</div>
    <div class="kv-block">
      <div class="kv-head">THE MATH</div>
      <div class="kv-row"><span>${s.activeCount} active listings ÷ ${(s.sales12 / 12).toFixed(0)} sales/month</span><b>= ${s.moi ? s.moi.toFixed(1) : '—'} months</b></div>
      <div class="kv-head">WHAT THE NUMBER MEANS</div>
      <div class="kv-row"><span><b>Under 4 mo</b> · Seller's market</span><span>Sellers hold leverage, prices trend up</span></div>
      <div class="kv-row"><span><b>4–6 mo</b> · Balanced</span><span>Supply matches demand, prices stabilize</span></div>
      <div class="kv-row"><span><b>Over 6 mo</b> · Buyer's market</span><span>Homes sit, buyers negotiate harder</span></div>
      <div class="kv-foot">The industry-standard rating used by appraisers and agents.</div>
    </div>
    <div class="mos-reconcile">
      <div class="kv-head">🔍 READING THE TWO NUMBERS TOGETHER</div>
      <table class="vt">
        <tr><th></th><th>Verdict</th><th>Why</th></tr>
        <tr><td>Months of Supply</td><td><b>${s.moiRating}</b></td><td>Counts only inventory — ${s.moi ? s.moi.toFixed(1) : '—'} months is ${s.moi < 4 ? 'scarce' : s.moi <= 6 ? 'balanced' : 'plentiful'}</td></tr>
        <tr><td>${CONFIG.farmShort} Index (${s.index})</td><td><b>${idxLabel_(s.index)}</b></td><td>Adds sales pace, price momentum &amp; negotiation signals</td></tr>
      </table>
      <div class="vt-bottom"><b>BOTTOM LINE:</b> ${bottomLine_(s)}</div>
    </div>
  </div>
  <div class="grid">
    <div class="stat"><b>${s.sales30}</b><span>Homes sold (last 30 days)</span></div>
    <div class="stat"><b>${$(s.medPrice3)}</b><span>Median sold (90 days)</span></div>
    <div class="stat"><b>${s.medPpsf3 ? '$' + Math.round(s.medPpsf3) : '—'}</b><span>Median $/sqft (90 days)</span></div>
    <div class="stat"><b>${s.medDom3 ?? '—'}</b><span>Median days on market</span></div>
    <div class="stat"><b>${s.moi ? s.moi.toFixed(1) + ' mo' : '—'}</b><span>Inventory supply (${s.activeCount} active)</span></div>
  </div>
  <div class="insight">
    <div class="insight-title">💡 Price per square foot is not one number here</div>
    <div class="insight-sub">Each segment trades at its own rate:</div>
    ${(() => {
      const blend = Math.round(s.medPpsf12 || 0);
      const maxV = Math.max(...s.segments.map(t => t.medPpsf || 0), blend);
      return s.segments.map(t => {
        const val = Math.round(t.medPpsf || 0);
        return `
        <div class="ppsf-row">
          <span class="ppsf-name">${t.label}</span>
          <span class="ppsf-track"><span class="ppsf-fill" style="width:${Math.round(val / maxV * 100)}%"></span></span>
          <span class="ppsf-val">$${val}</span>
        </div>`;
      }).join('') + `
        <div class="ignore-box">
          <div class="ignore-title">🚫 THE NUMBER TO IGNORE</div>
          <div class="kv-row"><span>The online "${CONFIG.farmShort} average"</span><b><s>$${blend}/sqft</s></b></div>
          <div class="ignore-why">Blends townhomes with luxury, new with resale — nothing actually sells at it.</div>
        </div>
        <div class="ppsf-close">Your segment's rate = the starting point&nbsp;&nbsp;·&nbsp;&nbsp;a CMA = the answer</div>`;
    })()}
  </div>
  ${s.pm && s.pm.ok && s.pm.medErr < 10 ? `
  <div class="pm-card">
    <div class="mos-kicker">WHAT A SQUARE FOOT IS ACTUALLY WORTH IN ${CONFIG.farmShort.toUpperCase()}</div>
    <div class="pm-sub">(resale single-family)</div>
    <div class="kv-row"><span>Above-grade living space</span><span><b>$${Math.round(s.pm.ag)}/sqft</b> · 100%</span></div>
    <div class="kv-row"><span>Finished basement</span><span><b>$${Math.round(s.pm.fin)}/sqft</b> · ${Math.round(s.pm.fin / s.pm.ag * 100)}%</span></div>
    <div class="kv-row"><span>Unfinished basement</span><span><b>$${Math.round(s.pm.unf)}/sqft</b> · ${Math.round(s.pm.unf / s.pm.ag * 100)}%</span></div>
    <div class="kv-row"><span>Walkout/daylight basement</span><span><b>+$${Math.round(s.pm.walk / 1000)}K</b> · flat premium</span></div>
    <div class="kv-head" style="margin-top:12px">📐 ${CONFIG.farmShort.toUpperCase()} PRICING MODEL</div>
    <div class="kv-row"><span>Built from</span><span>${s.pm.n} resale sales · 24 months</span></div>
    <div class="kv-row"><span>Accuracy</span><span>${s.pm.medErr < 6 ? '🟢' : '🟡 beta'} · typical error ±${Math.round(s.pm.medErr)}%</span></div>
    <div class="kv-row"><span>Key finding</span><span>Basements worth ${Math.round(s.pm.fin / s.pm.ag * 100)}% here — not the old "half" rule</span></div>
    <div class="kv-row"><span>Your exact number</span><span><b>↓ get the real number below</b></span></div>
    ${s.cm && s.cm.ok ? `<div class="kv-row"><span>For agents</span><span><a href="cma-rates/" style="color:var(--terra);font-weight:bold">the full ${CONFIG.farmShort} adjustment table →</a></span></div>` : ''}
  </div>` : ''}
  <h3>Homes sold by month — ${CONFIG.areaLine} (last 12 months)</h3>
  <div class="chart-outer">${yAxis}<div class="chart">${bars}</div></div>
  <h3>Market segments — last 12 months</h3>
  <table><tr><th>Segment</th><th>Sold</th><th>Med. Price</th><th>$/sqft</th><th>DOM</th></tr>${segRows}</table>
  <a class="cta" href="${leadUrl}">What's YOUR home worth? Get the real number →</a>
  <a class="cta" style="background:var(--olive)" href="${CONFIG.youtubeUrl}">▶ Watch this week's video update</a>
  <footer>Utah is a non-disclosure state — sold prices are not public record. This data comes directly from MLS records available only to licensed agents.<br><br>
  <b>${CONFIG.agentName} — ${CONFIG.agentBrand}</b><br>
  ${CONFIG.brokerage}${CONFIG.licenseNo ? ' · Lic. ' + CONFIG.licenseNo : ''}<br>
  <a href="tel:${CONFIG.agentPhone.replace(/[^0-9]/g, '')}" style="color:inherit">${CONFIG.agentPhone}</a> · <a href="mailto:${CONFIG.agentEmail}" style="color:inherit">${CONFIG.agentEmail}</a><br>
  <a href="${CONFIG.website}" style="color:inherit">${CONFIG.website.replace('https://', '')}</a> · <a href="${CONFIG.linktree}" style="color:inherit">linktr.ee/Lance141</a><br>
  ${CONFIG.agentTagline} · Equal Housing Opportunity</footer>
  </div></body></html>`;
  return html;
}

// ---------- GITHUB PAGES PUBLISHING ----------
// ONE-TIME SETUP:
// 1. github.com → New repository → name: tm-market-update → Public → Create
// 2. Repo Settings → Pages → Source: "Deploy from a branch" → Branch: main / root → Save
// 3. github.com → Settings → Developer settings → Fine-grained tokens → Generate:
//    only select the tm-market-update repo, Permissions → Contents: Read & write
// 4. Apps Script → Project Settings (gear) → Script Properties → Add:
//    key GITHUB_TOKEN, value = your token
// 5. Fill CONFIG.github.owner above → run publishToGitHub()
// Your report goes live at: https://YOUR_GITHUB_USERNAME.github.io/tm-market-update/
// MONTHLY: buildStats() → publishToGitHub(). That's it.
function publishToGitHub() {
  const g = CONFIG.github;
  const token = (PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN') || '').trim();
  if (!token) throw new Error('Add GITHUB_TOKEN in Project Settings → Script Properties (see setup notes above publishToGitHub).');
  if (g.owner === 'YOUR_GITHUB_USERNAME') throw new Error('Fill in CONFIG.github.owner with your GitHub username.');

  const s = computeStats_();
  ghPut_(g, token, g.path, buildHtml_(s),
    CONFIG.farmShort + ' Market Update ' + s.updated + ' (' + VERSION + ')');
  if (s.cm && s.cm.ok) {
    ghPut_(g, token, g.path.replace(/index\.html$/, 'cma-rates/index.html'), buildCmaHtml_(s),
      CONFIG.farmShort + ' CMA adjustment table ' + s.updated + ' (' + VERSION + ')');
  }
  const live = `https://${g.owner}.github.io/${g.repo}/${g.path.replace(/index\.html$/, '')}`;
  Logger.log('✅ Published: ' + live + (s.cm && s.cm.ok ? ' (+ cma-rates/)' : ''));
  return live;
}

// Create-or-update one file in the repo.
function ghPut_(g, token, path, html, msg) {
  const url = `https://api.github.com/repos/${g.owner}/${g.repo}/contents/${path}`;
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };
  let sha = null;
  const probe = UrlFetchApp.fetch(url + '?ref=' + g.branch, { headers, muteHttpExceptions: true });
  if (probe.getResponseCode() === 200) sha = JSON.parse(probe.getContentText()).sha;
  const payload = { message: msg, content: Utilities.base64Encode(html, Utilities.Charset.UTF_8), branch: g.branch };
  if (sha) payload.sha = sha;
  const res = UrlFetchApp.fetch(url, { method: 'put', headers, contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true });
  const code = res.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error('GitHub publish failed (' + code + ') for ' + path + ': ' + res.getContentText());
  }
}

// ============================================================
// v24 — 📥 PASTE INBOX, DATA MANAGEMENT, 🔑 TOKEN, ✅ CHECK SETUP
// ============================================================
const PASTE_TAB = '📥 Paste';

function buildPasteBanner_(sh) {
  sh.getRange('A1:F1').merge()
    .setValue('📥 PASTE EXPORTS BELOW THIS ROW — headers included. ▶ Build Stats absorbs them into Data and clears this tab.')
    .setBackground(CONFIG.brand.camel).setFontColor(CONFIG.brand.navy)
    .setFontWeight('bold').setHorizontalAlignment('center');
  sh.setRowHeight(1, 32);
}

// Splits a value grid into export blocks (header row + its data rows).
function pasteBlocks_(v) {
  const blocks = []; let cur = null;
  v.forEach(row => {
    const first = String(row[0]).toLowerCase().trim();
    const joined = row.map(x => String(x).toLowerCase()).join('|');
    if (first === 'sold date' || (first === 'mls#' && joined.includes('agent'))) {
      cur = { header: row.slice(), old: first === 'mls#', rows: [] };
      blocks.push(cur); return;
    }
    if (!cur) return;
    if (row.every(c => String(c).trim() === '')) return;
    cur.rows.push(row.slice());
  });
  return blocks;
}

// 📥 Paste → Data. Stamps every row with the import date, appends as a
// block, logs the import, then compacts Data (dedupe + snapshot + trim).
function absorbPaste_() {
  const ss = SpreadsheetApp.getActive();
  const src = ss.getSheetByName(PASTE_TAB);
  if (!src || src.getLastRow() < 2) return null;
  const blocks = pasteBlocks_(src.getDataRange().getValues());
  const total = blocks.reduce((s, b) => s + b.rows.length, 0);
  if (!total) return null;
  const stamp = new Date();
  const dataSh = ss.getSheetByName('Data') || ss.insertSheet('Data');
  const b = CONFIG.brand;
  let sc = 0, ac = 0;
  blocks.forEach(blk => {
    if (!blk.rows.length) return;
    const w = blk.header.length;
    const hdr = blk.header.concat(['Imported']);
    const si = blk.header.map(x => String(x).toLowerCase().trim()).indexOf('status');
    const rows = blk.rows.map(r => {
      const st = blk.old ? 'ACTIVE' : (si > -1 ? String(r[si]).trim().toUpperCase() : 'SOLD');
      if (st === 'ACTIVE') ac++; else if (st === 'SOLD') sc++;
      const rr = r.slice(0, w);
      while (rr.length < w) rr.push('');
      return rr.concat([stamp]);
    });
    const r0 = dataSh.getLastRow() + 1;
    dataSh.getRange(r0, 1, 1, hdr.length).setValues([hdr])
      .setBackground(b.olive).setFontColor(b.cream).setFontWeight('bold');
    dataSh.getRange(r0 + 1, 1, rows.length, hdr.length).setValues(rows);
  });
  src.clear();
  buildPasteBanner_(src);
  logImport_(stamp, sc, ac);
  try { compactData_(); } catch (e) { Logger.log('Compact skipped: ' + e); }
  return { solds: sc, actives: ac };
}

function logImport_(stamp, sc, ac) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Import Log') || ss.insertSheet('Import Log');
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 3).setValues([['IMPORT HISTORY', 'solds absorbed', 'actives absorbed']])
      .setBackground(CONFIG.brand.navy).setFontColor(CONFIG.brand.cream).setFontWeight('bold');
    sh.setColumnWidth(1, 180);
  }
  sh.appendRow([stamp, sc, ac]);
}

// Rewrites the Data tab lean: duplicate MLS# resolved (newest import wins,
// SOLD beats ACTIVE), stale actives dropped (only the latest snapshot kept),
// solds older than 25 months dropped. Raw columns preserved block-by-block.
function compactData_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Data');
  if (!sh || sh.getLastRow() === 0) return;
  const v = sh.getDataRange().getValues();
  const W = v[0].length;
  const blocks = pasteBlocks_(v);
  if (!blocks.length) return;
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 25);
  const tms = d => d ? d.getTime() : 0;
  const recs = [];
  blocks.forEach((blk, bi) => {
    const h = blk.header.map(x => String(x).toLowerCase().trim());
    const ix = l => h.indexOf(l);
    blk.rows.forEach(row => {
      const mls = ix('mls#') > -1 ? String(row[ix('mls#')]).trim() : '';
      const st = blk.old ? 'ACTIVE' : (ix('status') > -1 ? String(row[ix('status')]).trim().toUpperCase() : 'SOLD');
      const dv = !blk.old && ix('sold date') > -1 ? row[ix('sold date')] : null;
      let sd = dv instanceof Date ? dv : (dv ? new Date(dv) : null);
      if (sd && isNaN(sd)) sd = null;
      const iv = ix('imported') > -1 ? row[ix('imported')] : null;
      let imp = iv instanceof Date ? iv : (iv ? new Date(iv) : null);
      if (imp && isNaN(imp)) imp = null;
      recs.push({ bi, row, mls, st, sd, imp });
    });
  });
  const best = {};
  recs.forEach(r => {
    if (!r.mls) return;
    const o = best[r.mls];
    if (!o) { best[r.mls] = r; return; }
    if (tms(r.imp) >= tms(o.imp) && !(o.st === 'SOLD' && r.st !== 'SOLD')) best[r.mls] = r;
  });
  const soldMls = new Set(recs.filter(r => r.st === 'SOLD' && r.mls).map(r => r.mls));
  const snapImp = Math.max(0, ...recs.filter(r => r.st !== 'SOLD').map(r => tms(r.imp)));
  const keep = r => {
    if (r.mls && best[r.mls] && best[r.mls] !== r) return false;
    if (r.st === 'SOLD') return !r.sd || r.sd >= cutoff;
    if (r.mls && soldMls.has(r.mls)) return false;
    return tms(r.imp) === snapImp; // actives & other statuses: latest snapshot only
  };
  const out = [];
  blocks.forEach((blk, bi) => {
    const rows = recs.filter(r => r.bi === bi && keep(r)).map(r => r.row);
    if (rows.length) out.push({ header: blk.header, rows });
  });
  sh.clear();
  const b = CONFIG.brand;
  let r0 = 1;
  out.forEach(blk => {
    sh.getRange(r0, 1, 1, W).setValues([blk.header.slice(0, W)])
      .setBackground(b.olive).setFontColor(b.cream).setFontWeight('bold');
    sh.getRange(r0 + 1, 1, blk.rows.length, W).setValues(blk.rows.map(r => r.slice(0, W)));
    r0 += 1 + blk.rows.length;
  });
}

// 🔑 One-time per sheet copy: paste the GitHub token into a prompt box.
function setGithubToken() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('🔑 Set GitHub Token',
    'Paste your GitHub fine-grained token (github_pat_…).\nStored in this sheet\'s Script Properties — never in a cell.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const t = r.getResponseText().trim();
  if (!t) { ui.alert('Nothing saved — the box was empty.'); return; }
  PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', t);
  ui.alert('✅ Token saved (…' + t.slice(-4) + '). 🌐 Publish to GitHub is ready.');
}

// ✅ Setup health check — safe to run anytime, changes nothing.
function checkSetup() {
  const p = PropertiesService.getScriptProperties();
  const token = (p.getProperty('GITHUB_TOKEN') || '').trim();
  const form = p.getProperty('LEAD_FORM_URL') || '';
  const trig = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  let dataLine;
  try {
    const d = scanAll_();
    const newest = d.solds.reduce((m, r) => r.date && (!m || r.date > m) ? r.date : m, null);
    dataLine = d.solds.length + ' solds (newest ' +
      (newest ? Utilities.formatDate(newest, Session.getScriptTimeZone(), 'MMM d, yyyy') : '—') +
      ') · ' + d.actives.length + ' actives';
  } catch (e) { dataLine = '✗ ' + e.message; }
  const lines = [
    'Pipeline: ' + VERSION,
    'Location: ' + CONFIG.farmName + ' → https://' + CONFIG.github.owner + '.github.io/' +
      CONFIG.github.repo + '/' + CONFIG.github.path.replace(/index\.html$/, ''),
    'GitHub token: ' + (token ? '✓ saved (…' + token.slice(-4) + ')' : '✗ MISSING — run 🔑 Set GitHub Token'),
    'Lead form: ' + (form ? '✓ live' : '✗ not created — run 📝 Setup Lead Form'),
    'Run-tab trigger: ' + (trig.indexOf('onRunEdit') > -1 ? '✓ installed' : '✗ MISSING — run 🔘 Install Run-Tab Trigger'),
    'Lead-alert trigger: ' + (trig.indexOf('onLeadSubmit') > -1 ? '✓ installed' : (form ? '✗ MISSING — rerun 📝 Setup Lead Form' : '— created with lead form')),
    'Data: ' + dataLine
  ];
  return lines.join('\n');
}
function checkSetupAlert() {
  SpreadsheetApp.getUi().alert('✅ CHECK SETUP — ' + CONFIG.farmShort + ' (' + VERSION + ')\n\n' + checkSetup());
}

// ============================================================
// v25 — 📐 CMA ADJUSTMENT ENGINE
// ============================================================
// Full hedonic model:
// price ≈ base + rL1·MainSqFt + rUp·UpperSqFt + rFin·FinBsmt + rUnf·UnfBsmt
//        + rAcre·Acres + walkout + rGar·GarageBays + rAge·Age
//        + rFB·FullBaths + rTQ·¾Baths + rHB·½Baths + rBd·Bedrooms
function cmaModel_(solds) {
  const yNow = new Date().getFullYear();
  const data = solds.filter(r =>
    r.yb && r.yb < CONFIG.newConYear && !r.isTH && r.l1 && r.l1 >= 300 &&
    r.bf != null && r.sp <= 1500000);
  if (data.length < 60) return { ok: false, n: data.length };
  const rows = data.map(r => ({
    y: r.sp,
    x: [1, r.l1, r.up || 0, r.bs * r.bf / 100, r.bs * (1 - r.bf / 100),
        r.acres || 0, r.walk ? 1 : 0, r.gar || 0, yNow - r.yb,
        r.fb || 0, r.tq || 0, r.hb || 0, r.bd || 0]
  }));
  const n = 13;
  const XtX = [], Xty = [];
  for (let a = 0; a < n; a++) {
    Xty[a] = rows.reduce((s2, r) => s2 + r.x[a] * r.y, 0);
    XtX[a] = [];
    for (let c = 0; c < n; c++) XtX[a][c] = rows.reduce((s2, r) => s2 + r.x[a] * r.x[c], 0);
  }
  const A = XtX.map((row, i) => row.concat([Xty[i]]));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    const tmp = A[c]; A[c] = A[p]; A[p] = tmp;
    for (let r = 0; r < n; r++) {
      if (r !== c && A[c][c]) {
        const f = A[r][c] / A[c][c];
        for (let k = 0; k <= n; k++) A[r][k] -= f * A[c][k];
      }
    }
  }
  const beta = A.map((row, i) => row[n] / row[i]);
  if (beta.some(v => !isFinite(v))) return { ok: false, n: rows.length };
  const preds = rows.map(r => r.x.reduce((s2, x, i) => s2 + x * beta[i], 0));
  const errs = rows.map((r, i) => Math.abs(r.y - preds[i]) / r.y * 100).sort((a2, b2) => a2 - b2);
  const ybar = rows.reduce((s2, r) => s2 + r.y, 0) / rows.length;
  const ssRes = rows.reduce((s2, r, i) => s2 + Math.pow(r.y - preds[i], 2), 0);
  const ssTot = rows.reduce((s2, r) => s2 + Math.pow(r.y - ybar, 2), 0);
  return {
    ok: true, n: rows.length, r2: 1 - ssRes / ssTot, medErr: errs[Math.floor(errs.length / 2)],
    base: beta[0], l1: beta[1], up: beta[2], fin: beta[3], unf: beta[4],
    acre: beta[5], walk: beta[6], gar: beta[7], age: beta[8],
    fb: beta[9], tq: beta[10], hb: beta[11], bd: beta[12]
  };
}

// Shared row data for the tab + public page. Basement rates come from the
// stable 5-component model when available.
function cmaRows_(cm, pm) {
  const $K = v => (v < 0 ? '−$' : '+$') + Math.round(Math.abs(v)).toLocaleString();
  const fin = pm && pm.ok ? pm.fin : cm.fin;
  const unf = pm && pm.ok ? pm.unf : cm.unf;
  return [
    ['L1 (main floor) sqft', '$' + Math.round(cm.l1) + '/sqft', '🟢 main-level space typically worth ~2× upper (rambler premium)'],
    ['L2/L3/L4 (upper) sqft', '$' + Math.round(cm.up) + '/sqft', '🟢'],
    ['Finished basement sqft', '$' + Math.round(fin) + '/sqft', '🟢 from the stable 5-component model'],
    ['Unfinished basement sqft', '$' + Math.round(unf) + '/sqft', '🟡'],
    ['Walkout/daylight basement', $K(cm.walk) + ' flat', '🟢 applies once'],
    ['Garage capacity', $K(cm.gar) + ' per bay', '🟢'],
    ['Acres (lot)', $K(cm.acre) + ' per acre', '🟢'],
    ['Year built', $K(cm.age) + ' per year of age', '🟡 use for ±10-yr gaps, not 30'],
    ['Full baths', $K(cm.fb), '🟡'],
    ['¾ baths', $K(cm.tq), '🟡 small sample'],
    ['½ baths', $K(cm.hb), "🔴 noise — don't adjust"],
    ['Bedrooms', '$0', '🔴 do NOT adjust — beds are priced inside sqft; more beds at same sqft = chopped-up floor plan'],
    ['Carport capacity', '—', 'not in export'],
    ['Total SqFt / GL Area / $ per sold sqft', '—', 'computed outputs, not adjustments']
  ];
}

function buildCmaTab_(cm, pm, cmTH) {
  const ss = SpreadsheetApp.getActive();
  const b = CONFIG.brand;
  const sh = ss.getSheetByName('📐 CMA Adjustments') || ss.insertSheet('📐 CMA Adjustments');
  sh.clear();
  sh.getRange('A1:C1').merge()
    .setValue('📐 ' + CONFIG.farmShort.toUpperCase() + ' CMA ADJUSTMENT TABLE — refits on every ▶ Build Stats')
    .setBackground(b.navy).setFontColor(b.cream).setFontWeight('bold').setHorizontalAlignment('center');
  if (!cm || !cm.ok) {
    sh.getRange('A3').setValue('Not enough model data (' + (cm ? cm.n : 0) +
      ' usable resale SFH rows; need 60+). Paste more history into ' + PASTE_TAB + '.');
    return;
  }
  const rows = [['CMA FIELD', 'ADJUSTMENT', 'CONFIDENCE / NOTE']].concat(cmaRows_(cm, pm));
  rows.push(['', '', '']);
  rows.push(['MODEL', 'R² ' + cm.r2.toFixed(3) + ' · median error ±' + cm.medErr.toFixed(1) + '%',
    cm.n + ' resale SFH sales']);
  if (pm && pm.ok) rows.push(['ANCHOR ESTIMATE',
    '= $' + Math.round(pm.intercept).toLocaleString() + ' + AG×$' + Math.round(pm.ag) +
    ' + finBsmt×$' + Math.round(pm.fin) + ' + unfBsmt×$' + Math.round(pm.unf) +
    ' + acres×$' + Math.round(pm.acre).toLocaleString() +
    ' (+$' + Math.round(pm.walk).toLocaleString() + ' walkout)', '±' + pm.medErr.toFixed(0) + '%']);
  rows.push(['SCOPE', 'Resale single-family ≤ $1.5M in ' + CONFIG.farmName +
    ' only — do not stretch to luxury' + (cmTH && cmTH.ok ? '' : ', townhomes,') +
    ' or other areas', 'refits monthly']);
  if (cmTH && cmTH.ok) {
    rows.push(['', '', '']);
    rows.push(['TOWNHOME / CONDO MODEL (resale)',
      'R² ' + cmTH.r2.toFixed(3) + ' · median error ±' + cmTH.medErr.toFixed(1) + '%',
      cmTH.n + ' sales']);
    cmaRowsTH_(cmTH).forEach(r => rows.push(r));
  }
  sh.getRange(3, 1, rows.length, 3).setValues(rows);
  sh.getRange(3, 1, 1, 3).setBackground(b.olive).setFontColor(b.cream).setFontWeight('bold');
  for (let i = 1; i < rows.length; i++) if (i % 2 === 0) sh.getRange(3 + i, 1, 1, 3).setBackground(b.cream);
  sh.setColumnWidth(1, 240).setColumnWidth(2, 340).setColumnWidth(3, 420);
}

// Public agent-facing page — published to cma-rates/ next to the report.
function buildCmaHtml_(s) {
  const b = CONFIG.brand, cm = s.cm, pm = s.pm;
  const logo = getLogoDataUri_();
  const leadUrl = leadFormUrl_() || `mailto:${CONFIG.agentEmail}?subject=CMA request — ${CONFIG.farmName}`;
  const rowsHtml = cmaRows_(cm, pm).map(r =>
    `<div class="kv-row"><span>${r[0]}</span><span><b>${r[1]}</b></span></div><div class="note">${r[2]}</div>`).join('');
  return `<!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${CONFIG.farmName} CMA Adjustment Table | ${CONFIG.agentName}</title>
  <style>
    :root{--terra:${b.terracotta};--olive:${b.olive};--navy:${b.navy};--camel:${b.camel};--cream:${b.cream}}
    *{box-sizing:border-box;margin:0}
    body{font-family:Georgia,serif;background:var(--cream);color:var(--navy)}
    .wrap{max-width:640px;margin:0 auto;padding:20px}
    header{text-align:center;padding:24px 0;border-bottom:3px solid var(--terra)}
    header img{max-height:70px}
    h1{font-size:1.4em;margin-top:10px}
    .updated{color:var(--olive);font-size:.85em;font-style:italic}
    .card{background:#fff;border-radius:12px;padding:18px;margin:16px 0;border-top:4px solid var(--navy)}
    .kicker{font-size:.72em;letter-spacing:.13em;color:var(--olive);font-weight:bold}
    .kv-row{display:flex;justify-content:space-between;gap:10px;font-size:.85em;padding:6px 0 0;border-top:1px solid rgba(107,122,58,.15)}
    .note{font-size:.68em;color:var(--olive);font-style:italic;padding:2px 0 6px}
    .warn{margin-top:12px;border:2px solid var(--terra);border-radius:8px;padding:10px;font-size:.78em;background:rgba(244,237,228,.5)}
    .cta{display:block;background:var(--terra);color:var(--cream);text-align:center;padding:14px;border-radius:10px;text-decoration:none;margin:12px 0}
    footer{text-align:center;font-size:.72em;color:var(--olive);padding:18px 0}
  </style></head><body><div class="wrap">
  <header>
    ${logo ? `<img src="${logo}" alt="${CONFIG.agentBrand}">` : ''}
    <h1>The ${CONFIG.farmShort} Adjustment Table</h1>
    <div class="updated">What each feature is actually worth in ${CONFIG.farmName} · fit on ${cm.n} resale sales · Updated ${s.updated}</div>
    <div class="updated">${CONFIG.agentBrand} · ${CONFIG.brokerage}</div>
  </header>
  <div class="card">
    <div class="kicker">FIELD-BY-FIELD ADJUSTMENTS (resale single-family)</div>
    ${rowsHtml}
  </div>
  ${s.cmTH && s.cmTH.ok ? `<div class="card">
    <div class="kicker">TOWNHOME / CONDO ADJUSTMENTS (resale)</div>
    ${cmaRowsTH_(s.cmTH).map(r => `<div class="kv-row"><span>${r[0]}</span><span><b>${r[1]}</b></span></div><div class="note">${r[2]}</div>`).join('')}
    <div class="note">Model: R² ${s.cmTH.r2.toFixed(2)} · median error ±${s.cmTH.medErr.toFixed(1)}% · ${s.cmTH.n} resale town/condo sales</div>
  </div>` : ''}
  ${pm && pm.ok ? `<div class="card">
    <div class="kicker">📐 ANCHOR ESTIMATE FORMULA</div>
    <div class="kv-row"><span>Value ≈</span><span><b>$${Math.round(pm.intercept).toLocaleString()} + AG×$${Math.round(pm.ag)} + finBsmt×$${Math.round(pm.fin)} + unfBsmt×$${Math.round(pm.unf)} + acres×$${Math.round(pm.acre).toLocaleString()} (+$${Math.round(pm.walk).toLocaleString()} if walkout)</b></span></div>
    <div class="note">Anchor the estimate first, then adjust each comp to the subject with the table above. Walkout premium applies once.</div>
  </div>` : ''}
  <div class="card">
    <div class="kicker">MODEL QUALITY & SCOPE</div>
    <div class="kv-row"><span>Accuracy</span><span><b>R² ${cm.r2.toFixed(2)} · median error ±${cm.medErr.toFixed(1)}%</b></span></div>
    <div class="kv-row"><span>Sample</span><span><b>${cm.n} resale SFH sales · rolling window</b></span></div>
    <div class="warn">🚫 Scope: resale ≤ $1.5M in ${CONFIG.farmName} only. Do not stretch to luxury${s.cmTH && s.cmTH.ok ? '' : ', townhomes,'} or other areas — they need their own fit. Rates refit monthly from MLS sold data.</div>
  </div>
  <a class="cta" href="../">← Full ${CONFIG.farmName} market report</a>
  <a class="cta" style="background:var(--olive)" href="${leadUrl}">Need the exact number? Request a CMA →</a>
  <footer>Model-derived adjustment rates — not an appraisal. Utah is a non-disclosure state; sold data from MLS records available to licensed agents.<br><br>
  <b>${CONFIG.agentName} — ${CONFIG.agentBrand}</b> · ${CONFIG.brokerage}<br>
  ${CONFIG.agentPhone} · ${CONFIG.agentEmail} · Equal Housing Opportunity</footer>
  </div></body></html>`;
}

// ============================================================
// v26 — TOWNHOME/CONDO MODEL + shared solver
// ============================================================
// Generic least-squares: rows = [{y, x:[...n]}] → {beta, r2, medErr} or null.
function regress_(rows, n) {
  const XtX = [], Xty = [];
  for (let a = 0; a < n; a++) {
    Xty[a] = rows.reduce((s2, r) => s2 + r.x[a] * r.y, 0);
    XtX[a] = [];
    for (let c = 0; c < n; c++) XtX[a][c] = rows.reduce((s2, r) => s2 + r.x[a] * r.x[c], 0);
  }
  const A = XtX.map((row, i) => row.concat([Xty[i]]));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    const tmp = A[c]; A[c] = A[p]; A[p] = tmp;
    for (let r = 0; r < n; r++) {
      if (r !== c && A[c][c]) {
        const f = A[r][c] / A[c][c];
        for (let k = 0; k <= n; k++) A[r][k] -= f * A[c][k];
      }
    }
  }
  const beta = A.map((row, i) => row[n] / row[i]);
  if (beta.some(v => !isFinite(v))) return null;
  const preds = rows.map(r => r.x.reduce((s2, x, i) => s2 + x * beta[i], 0));
  const errs = rows.map((r, i) => Math.abs(r.y - preds[i]) / r.y * 100).sort((a2, b2) => a2 - b2);
  const ybar = rows.reduce((s2, r) => s2 + r.y, 0) / rows.length;
  const ssRes = rows.reduce((s2, r, i) => s2 + Math.pow(r.y - preds[i], 2), 0);
  const ssTot = rows.reduce((s2, r) => s2 + Math.pow(r.y - ybar, 2), 0);
  return { beta, r2: 1 - ssRes / ssTot, medErr: errs[Math.floor(errs.length / 2)] };
}

// Resale town/condo fit. No acres/walkout — TH lots are uniform.
function cmaTHModel_(solds) {
  const yNow = new Date().getFullYear();
  const data = solds.filter(r =>
    r.yb && r.yb < CONFIG.newConYear && r.isTH && r.ag && r.ag >= 400 && r.sp <= 1500000);
  if (data.length < 60) return { ok: false, n: data.length };
  const rows = data.map(r => ({
    y: r.sp,
    x: [1, r.ag, r.bs * (r.bf || 0) / 100, r.bs * (1 - (r.bf || 0) / 100),
        r.gar || 0, yNow - r.yb, r.fb || 0, r.tq || 0, r.hb || 0, r.bd || 0]
  }));
  const f = regress_(rows, 10);
  if (!f) return { ok: false, n: rows.length };
  const b = f.beta;
  return { ok: true, n: rows.length, r2: f.r2, medErr: f.medErr,
    base: b[0], ag: b[1], fin: b[2], unf: b[3], gar: b[4], age: b[5],
    fb: b[6], tq: b[7], hb: b[8], bd: b[9] };
}

function cmaRowsTH_(m) {
  const $K = v => (v < 0 ? '−$' : '+$') + Math.round(Math.abs(v)).toLocaleString();
  return [
    ['Above-grade sqft', '$' + Math.round(m.ag) + '/sqft', '🟢'],
    ['Finished basement sqft', '$' + Math.round(m.fin) + '/sqft', '🟡 many TH have no basement — thin signal'],
    ['Unfinished basement sqft', '$' + Math.round(m.unf) + '/sqft', '🟡'],
    ['Garage capacity', $K(m.gar) + ' per bay', '🟢 garages matter in TH — often the differentiator'],
    ['Year built', $K(m.age) + ' per year of age', '🟡 use for ±10-yr gaps'],
    ['Full baths', $K(m.fb), '🟡'],
    ['¾ baths', $K(m.tq), '🟡'],
    ['½ baths', $K(m.hb), '🟡'],
    ['Bedrooms', $K(m.bd), '🟡 verify against sqft before adjusting'],
    ['Acres / walkout', '—', 'not modeled — townhome lots are uniform']
  ];
}
