/**
 * LAND MODEL + REPORTS — vM1.5
 * Lance the Realtor
 *
 * MONTHLY WORKFLOW:
 *   1. Paste your latest full URE export into the "New Export" tab
 *      (header row included). Overwrite whatever was there before.
 *   2. Menu: Land Model -> Run All (or step through 1-4).
 *   That's it. "New Export" is scratch space — everything permanent
 *   lives in "Archive," which is never cleared.
 *
 * v1.1 — parcel links auto-detect from the County column.
 * v1.2 — Lot Facts (view/terrain/street) parsed into model features.
 *         Reports auto-publish to GitHub Pages, stable leads slug,
 *         Drive kept as fallback if the GitHub push fails.
 * v1.3 — "Set GitHub Token" menu item (no more Project Settings).
 *         Market report writes a manifest.json; a land-only index at
 *         tm-market-update/land/ rebuilds itself from every manifest
 *         found in the repo. Root index.html and /cma-rates/ untouched.
 * v1.4 — Meta description + Open Graph tags on every published page,
 *         so shared links preview with title/description/logo instead
 *         of a bare URL.
 * v1.5 — Replaced Raw1/2/3 with a single "New Export" paste tab that
 *         upserts into a permanent "Archive" tab keyed by MLS# — a
 *         sale that ages out of next month's rolling-window export
 *         no longer silently disappears from your sample.
 *         Added a "Run Log" tab: pinned block (last run, version,
 *         live links) plus an append-only history row per action.
 *         If a "Data" tab exists from an older version, it's migrated
 *         into "Archive" automatically, once, the first time Ingest
 *         runs after upgrading.
 *
 * ---------------------------------------------------------------
 * BACKUP COPY — saved for version protection. This file is a snapshot;
 * it is not run from here. The live copy lives in Apps Script attached
 * to the Salt Lake County land Google Sheet.
 * ---------------------------------------------------------------
 */

var VERSION = 'vM1.5';

var CFG = {
  ACRE_MAX:      2.0,
  ACRE_MIN:      0.05,
  MIN_CITY_N:    8,
  MIN_FEATURE_N: 15,
  RIDGE:         0.5,
  OUTLIER_IQR:   2.5,
  LOGO:          'https://drive.google.com/uc?id=1NosHz-mLGpPckIeBhrQpgtwH5YU_Lu6s',
  BRAND: { terra:'#C0652A', olive:'#6B7A3A', navy:'#2F3E46', camel:'#C2A178', cream:'#F4EDE4' },
  GITHUB: {
    owner:         'lancea141-source',
    repo:          'tm-market-update',
    branch:        'main',
    marketSlug:    'salt-lake-county',
    landIndexPath: 'land'
  }
};

var ARCHIVE_COLS = ['MLS#','Status','Address','City','County','Acres','List Price',
  'Original List Price','Sold Price','Sold Date','DOM','Tax ID',
  'Zoning','Utilities','Water','Estimated Taxes','Area','Agent','Lot Facts'];

var PARCEL_URLS = {
  'Salt Lake': 'https://apps.saltlakecounty.gov/assessor/new/javaapi2/parcelviewext.cfm?parcel_ID={ID}&query=Y',
  'Utah':      'https://www.utahcounty.gov/LandRecords/Property.asp?av_serial={ID}'
};

function parcelLink_(county, taxId) {
  var id = String(taxId || '').trim();
  if (!id) return '';
  var c = String(county || '').trim();
  var tpl = PARCEL_URLS[c];
  if (tpl) {
    var clean = (c === 'Utah') ? id.replace(/-/g, '') : id;
    return tpl.replace('{ID}', encodeURIComponent(clean));
  }
  return 'https://www.google.com/search?q=' +
         encodeURIComponent(c + ' county utah assessor parcel ' + id);
}

var LOT_FEATURES = [
  { label: 'View: Mountain',   key: 'view: mountain' },
  { label: 'View: Valley',     key: 'view: valley' },
  { label: 'View: Lake',       key: 'view: lake' },
  { label: 'Cul-de-Sac',       key: 'cul-de-sac' },
  { label: 'Curb & Gutter',    key: 'curb' },
  { label: 'Sidewalks',        key: 'sidewalks' },
  { label: 'Sloped Terrain',   key: 'grad slope' },
  { label: 'Flat Terrain',     key: 'terrain: flat' },
  { label: 'Fenced',           key: 'fenced' },
  { label: 'Horse Property',   key: 'horse' }
];

function hasFeature_(lotFacts, key) {
  return String(lotFacts || '').toLowerCase().indexOf(key) > -1 ? 1 : 0;
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Land Model')
    .addItem('1. Ingest New Export', 'ingest')
    .addItem('2. Build Model', 'buildModel')
    .addItem('3. Market Report', 'buildMarketReport')
    .addItem('4. Leads Report', 'buildLeadsReport')
    .addSeparator()
    .addItem('Run All', 'runAll')
    .addSeparator()
    .addItem('Set GitHub Token', 'setGithubToken')
    .addToUi();
}

function runAll() { ingest(); buildModel(); buildMarketReport(); buildLeadsReport(); }

/* ============================ TOKEN ============================ */

function setGithubToken() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('GitHub Token',
    'Paste your fine-grained PAT for ' + CFG.GITHUB.repo +
    '\n(scope: this repo only, permission Contents: Read and write):',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var token = res.getResponseText().trim();
  if (!token) { ui.alert('No token entered.'); return; }
  PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', token);
  ui.alert('Token saved. It will be used automatically on the next publish.');
}

/* ============================ INGEST (Archive upsert) ============================ */

function ingest() {
  var ss = SpreadsheetApp.getActive();
  var cols = ARCHIVE_COLS;

  var archiveSh = ss.getSheetByName('Archive');
  if (!archiveSh) {
    archiveSh = ss.insertSheet('Archive');
    archiveSh.getRange(1, 1, 1, cols.length).setValues([cols])
      .setFontWeight('bold').setBackground(CFG.BRAND.camel);
    archiveSh.setFrozenRows(1);

    // one-time migration from an older version's "Data" tab, if present
    var oldData = ss.getSheetByName('Data');
    if (oldData && oldData.getLastRow() > 1) {
      var oldVals = oldData.getDataRange().getValues();
      var oldHdr = oldVals[0];
      var migrated = oldVals.slice(1).map(function (r) {
        var o = {};
        for (var j = 0; j < oldHdr.length; j++) o[oldHdr[j]] = r[j];
        return cols.map(function (c) { return o[c] !== undefined ? o[c] : ''; });
      });
      if (migrated.length) {
        archiveSh.getRange(2, 1, migrated.length, cols.length).setValues(migrated);
      }
    }
  }

  var neSh = ss.getSheetByName('New Export');
  if (!neSh || neSh.getLastRow() < 2) {
    throw new Error('Paste your latest export into the "New Export" tab, then run Ingest again.');
  }
  var neVals = neSh.getDataRange().getValues();
  var neHdr = neVals[0].map(function (x) { return String(x).trim(); });

  var archVals = archiveSh.getDataRange().getValues();
  var archHdr = archVals[0];
  var mlsIdx = archHdr.indexOf('MLS#');
  var rowByMls = {};
  for (var i = 1; i < archVals.length; i++) {
    var id = String(archVals[i][mlsIdx] || '').trim();
    if (id) rowByMls[id] = i + 1; // 1-based sheet row
  }

  var added = 0, updated = 0, toAppend = [];
  neVals.slice(1).forEach(function (r) {
    var o = {};
    for (var j = 0; j < neHdr.length; j++) o[neHdr[j]] = r[j];
    var id = String(o['MLS#'] || '').trim();
    if (!id) return;
    var rowVals = cols.map(function (c) { return o[c] !== undefined ? o[c] : ''; });
    if (rowByMls[id]) {
      archiveSh.getRange(rowByMls[id], 1, 1, cols.length).setValues([rowVals]);
      updated++;
    } else {
      toAppend.push(rowVals);
      added++;
    }
  });
  if (toAppend.length) {
    archiveSh.getRange(archiveSh.getLastRow() + 1, 1, toAppend.length, cols.length).setValues(toAppend);
  }

  var total = archiveSh.getLastRow() - 1;
  SpreadsheetApp.getActive().toast(added + ' new, ' + updated + ' updated, ' + total + ' total in Archive', 'Ingest', 5);
  logRun_('Ingest', { n: total });
}

/* ============================ HELPERS ============================ */

function num_(v) {
  if (typeof v === 'number') return v;
  var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
}

function parseDate_(v) {
  if (v instanceof Date) return v;
  var s = String(v || '').trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? new Date(+m[3], +m[1] - 1, +m[2]) : null;
}

function utilTier_(s) {
  s = String(s || '');
  if (s.indexOf('Stubbed') > -1) return 2;
  if (s.indexOf('Available') > -1) return 1;
  return 0;
}

function median_(a) { return quantile_(a, 0.5); }

function quantile_(arr, q) {
  if (!arr.length) return 0;
  var a = arr.slice().sort(function (x, y) { return x - y; });
  var pos = (a.length - 1) * q, b = Math.floor(pos), r = pos - b;
  return a[b + 1] !== undefined ? a[b] + r * (a[b + 1] - a[b]) : a[b];
}

function readData_() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Archive');
  if (!sh) throw new Error('Run Ingest first.');
  var v = sh.getDataRange().getValues(), h = v[0];
  return v.slice(1).map(function (r) {
    var o = {};
    for (var i = 0; i < h.length; i++) o[h[i]] = r[i];
    o.acres    = num_(o['Acres']);
    o.list     = num_(o['List Price']);
    o.orig     = num_(o['Original List Price']);
    o.sold     = num_(o['Sold Price']);
    o.dom      = num_(o['DOM']);
    o.date     = parseDate_(o['Sold Date']);
    o.city     = String(o['City'] || '').trim();
    o.county   = String(o['County'] || '').trim();
    o.status   = String(o['Status'] || '').trim().toUpperCase();
    o.util     = utilTier_(o['Utilities']);
    o.lotFacts = o['Lot Facts'];
    return o;
  });
}

/* ============================ OLS ============================ */

function solveRidge_(X, y, lam) {
  var n = X.length, p = X[0].length, A = [], b = [], i, j, k;
  for (i = 0; i < p; i++) { A.push(new Array(p)); for (j = 0; j < p; j++) A[i][j] = 0; b.push(0); }
  for (k = 0; k < n; k++) {
    for (i = 0; i < p; i++) {
      b[i] += X[k][i] * y[k];
      for (j = 0; j < p; j++) A[i][j] += X[k][i] * X[k][j];
    }
  }
  for (i = 1; i < p; i++) A[i][i] += lam;

  for (i = 0; i < p; i++) A[i].push(b[i]);
  for (i = 0; i < p; i++) {
    var piv = i;
    for (k = i + 1; k < p; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
    var t = A[i]; A[i] = A[piv]; A[piv] = t;
    if (Math.abs(A[i][i]) < 1e-12) continue;
    for (k = i + 1; k < p; k++) {
      var f = A[k][i] / A[i][i];
      for (j = i; j <= p; j++) A[k][j] -= f * A[i][j];
    }
  }
  var beta = new Array(p);
  for (i = p - 1; i >= 0; i--) {
    var s = A[i][p];
    for (j = i + 1; j < p; j++) s -= A[i][j] * beta[j];
    beta[i] = Math.abs(A[i][i]) < 1e-12 ? 0 : s / A[i][i];
  }
  return beta;
}

/* ============================ MODEL ============================ */

function buildModel() {
  var rows = readData_();

  var fit = rows.filter(function (r) {
    return r.status === 'SOLD' && r.sold > 0 && r.acres &&
           r.acres >= CFG.ACRE_MIN && r.acres < CFG.ACRE_MAX && r.date;
  });
  if (fit.length < 30) throw new Error('Only ' + fit.length + ' usable solds.');

  var ppa = fit.map(function (r) { return r.sold / r.acres; });
  var q1 = quantile_(ppa, 0.25), q3 = quantile_(ppa, 0.75), iqr = q3 - q1;
  var lo = q1 - CFG.OUTLIER_IQR * iqr, hi = q3 + CFG.OUTLIER_IQR * iqr;
  var trimmed = fit.length;
  fit = fit.filter(function (r) { var p = r.sold / r.acres; return p >= lo && p <= hi; });
  trimmed -= fit.length;

  var cnt = {};
  fit.forEach(function (r) { cnt[r.city] = (cnt[r.city] || 0) + 1; });
  var cities = Object.keys(cnt).filter(function (c) { return cnt[c] >= CFG.MIN_CITY_N; })
                     .sort(function (a, b) { return cnt[b] - cnt[a]; });
  if (!cities.length) throw new Error('No city has ' + CFG.MIN_CITY_N + '+ sales. Lower MIN_CITY_N.');
  var base = cities[0];
  var dummies = cities.slice(1);

  var features = LOT_FEATURES.filter(function (ft) {
    var c = fit.filter(function (r) { return hasFeature_(r.lotFacts, ft.key); }).length;
    return c >= CFG.MIN_FEATURE_N && c <= fit.length - CFG.MIN_FEATURE_N;
  });

  var t0 = Math.min.apply(null, fit.map(function (r) { return r.date.getTime(); }));
  function months_(d) { return (d.getTime() - t0) / (1000 * 60 * 60 * 24 * 30.44); }

  function design_(r) {
    var x = [1, Math.log(r.acres), months_(r.date), r.util];
    dummies.forEach(function (c) { x.push(r.city === c ? 1 : 0); });
    features.forEach(function (ft) { x.push(hasFeature_(r.lotFacts, ft.key)); });
    return x;
  }

  var X = fit.map(design_), y = fit.map(function (r) { return Math.log(r.sold); });
  var beta = solveRidge_(X, y, CFG.RIDGE);

  var ybar = y.reduce(function (a, b) { return a + b; }, 0) / y.length;
  var ssr = 0, sst = 0, resid = [];
  for (var i = 0; i < X.length; i++) {
    var p = 0;
    for (var j = 0; j < beta.length; j++) p += X[i][j] * beta[j];
    resid.push(y[i] - p);
    ssr += Math.pow(y[i] - p, 2);
    sst += Math.pow(y[i] - ybar, 2);
  }
  var r2 = 1 - ssr / sst;
  var smear = resid.reduce(function (a, e) { return a + Math.exp(e); }, 0) / resid.length;
  var mape = median_(resid.map(function (e) { return Math.abs(Math.exp(e) - 1); }));

  var M = {
    beta: beta, dummies: dummies, features: features, base: base, t0: t0, smear: smear,
    n: fit.length, r2: r2, mape: mape, trimmed: trimmed,
    elasticity: beta[1], timeCoef: beta[2], utilCoef: beta[3],
    cityN: cnt,
    minDate: new Date(t0),
    maxDate: new Date(Math.max.apply(null, fit.map(function (r) { return r.date.getTime(); })))
  };
  PropertiesService.getDocumentProperties().setProperty('MODEL', JSON.stringify(M));

  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Model') || ss.insertSheet('Model');
  sh.clear();
  var out = [
    ['LAND MODEL', ''],
    ['Fit rows (n)', M.n],
    ['R-squared', M.r2],
    ['Median abs error', M.mape],
    ['Size elasticity', M.elasticity],
    ['$/acre change per doubling', Math.pow(2, M.elasticity - 1) - 1],
    ['Monthly time trend', Math.exp(M.timeCoef) - 1],
    ['Utility tier coef', Math.exp(M.utilCoef) - 1],
    ['Outliers trimmed', M.trimmed],
    ['Base city', M.base],
    ['Scope', CFG.ACRE_MIN + ' - ' + CFG.ACRE_MAX + ' acres, SOLD only'],
    ['', ''],
    ['CITY PREMIUM vs ' + M.base, 'n']
  ];
  M.dummies.forEach(function (c, k) {
    out.push([c + '  ' + fmtPct_(Math.exp(beta[4 + k]) - 1), M.cityN[c]]);
  });
  out.push(['', '']);
  out.push(['LOT FEATURES', 'n in sample']);
  if (!M.features.length) {
    out.push(['No feature met the ' + CFG.MIN_FEATURE_N + '-sample threshold', '']);
  } else {
    M.features.forEach(function (ft, k) {
      var idx = 4 + M.dummies.length + k;
      var c = fit.filter(function (r) { return hasFeature_(r.lotFacts, ft.key); }).length;
      out.push([ft.label + '  ' + fmtPct_(Math.exp(beta[idx]) - 1), c]);
    });
  }

  sh.getRange(1, 1, out.length, 2).setValues(out);
  sh.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground(CFG.BRAND.navy)
    .setFontColor(CFG.BRAND.cream);
  sh.getRange(3, 2).setNumberFormat('0.000');
  sh.getRange(4, 2).setNumberFormat('0.0%');
  sh.getRange(6, 2, 3, 1).setNumberFormat('0.0%');
  sh.autoResizeColumns(1, 2);

  ss.toast('n=' + M.n + '  R2=' + M.r2.toFixed(3) + '  elasticity=' + M.elasticity.toFixed(3) +
           '  features=' + M.features.length, 'Model', 6);

  logRun_('Build Model', { n: M.n, r2: M.r2, elasticity: M.elasticity });
}

function getModel_() {
  var s = PropertiesService.getDocumentProperties().getProperty('MODEL');
  if (!s) throw new Error('Run Build Model first.');
  var M = JSON.parse(s);
  M.minDate = new Date(M.minDate); M.maxDate = new Date(M.maxDate);
  return M;
}

function predict_(M, acres, city, util, date, lotFacts) {
  var t = ((date ? date.getTime() : M.maxDate.getTime()) - M.t0) / (1000 * 60 * 60 * 24 * 30.44);
  var x = [1, Math.log(acres), t, util];
  M.dummies.forEach(function (c) { x.push(city === c ? 1 : 0); });
  (M.features || []).forEach(function (ft) { x.push(hasFeature_(lotFacts, ft.key)); });
  var lp = 0;
  for (var i = 0; i < M.beta.length; i++) lp += x[i] * M.beta[i];
  return Math.exp(lp) * M.smear;
}

/* ============================ FORMAT ============================ */

function fmt$_(v) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function fmtPct_(v) {
  if (v === null || isNaN(v)) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
}
function esc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function css_() {
  var B = CFG.BRAND;
  return '<style>' +
  '*{box-sizing:border-box}body{margin:0;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:' + B.navy + ';background:' + B.cream + '}' +
  '.wrap{max-width:940px;margin:0 auto;padding:0 18px 60px}' +
  'header{background:' + B.navy + ';color:' + B.cream + ';padding:28px 18px;text-align:center}' +
  'header img{height:54px;margin-bottom:10px}' +
  'h1{margin:6px 0;font-size:26px;letter-spacing:.5px}' +
  'header .sub{color:' + B.camel + ';font-size:14px}' +
  'h2{margin:34px 0 12px;font-size:20px;border-bottom:3px solid ' + B.terra + ';padding-bottom:7px}' +
  'h3{margin:22px 0 8px;font-size:16px;color:' + B.terra + '}' +
  '.kpis{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0}' +
  '.kpi{flex:1 1 150px;background:#fff;border-left:5px solid ' + B.terra + ';border-radius:8px;padding:14px}' +
  '.kpi .v{font-size:24px;font-weight:700;color:' + B.navy + '}' +
  '.kpi .l{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:' + B.olive + '}' +
  'table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin:14px 0;font-size:14px}' +
  'th{background:' + B.camel + ';text-align:left;padding:10px;font-size:12px;text-transform:uppercase;letter-spacing:.5px}' +
  'td{padding:9px 10px;border-top:1px solid #EDE4D8}' +
  'tr:nth-child(even) td{background:#FBF7F1}' +
  '.card{background:#fff;border-radius:10px;padding:18px;margin:14px 0;border-left:5px solid ' + B.camel + '}' +
  '.card.hot{border-left-color:' + B.terra + '}' +
  '.card h4{margin:0 0 4px;font-size:17px}' +
  '.meta{font-size:13px;color:' + B.olive + ';margin-bottom:10px}' +
  '.gap{font-size:22px;font-weight:700;color:' + B.terra + '}' +
  '.grid{display:flex;flex-wrap:wrap;gap:14px;font-size:13px;margin:10px 0}' +
  '.grid div{flex:1 1 110px}.grid b{display:block;color:' + B.navy + ';font-size:15px}' +
  '.note{background:#fff;border-left:5px solid ' + B.olive + ';padding:14px;border-radius:8px;margin:16px 0;font-size:14px}' +
  '.script{background:' + B.navy + ';color:' + B.cream + ';padding:14px;border-radius:8px;font-size:14px;font-style:italic;margin:10px 0}' +
  'a{color:' + B.terra + '}footer{text-align:center;font-size:12px;color:' + B.olive + ';padding:30px 18px}' +
  '@media(max-width:600px){.kpi{flex:1 1 100%}table{font-size:13px}}' +
  '</style>';
}

function head_(title, sub, description) {
  var desc = esc_(description || sub || '');
  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc_(title) + '</title>' +
    '<meta name="description" content="' + desc + '">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:title" content="' + esc_(title) + '">' +
    '<meta property="og:description" content="' + desc + '">' +
    '<meta property="og:image" content="' + CFG.LOGO + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    css_() + '</head><body>' +
    '<header><img src="' + CFG.LOGO + '" alt="Lance the Realtor">' +
    '<h1>' + esc_(title) + '</h1><div class="sub">' + esc_(sub) + '</div></header><div class="wrap">';
}

function kpi_(v, l) { return '<div class="kpi"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }

/* ====================== RUN LOG ====================== */

function ensureRunLogSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Run Log');
  if (sh) return sh;

  sh = ss.insertSheet('Run Log');
  sh.setTabColor(CFG.BRAND.navy);
  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 320);
  for (var c = 3; c <= 8; c++) sh.setColumnWidth(c, 110);
  sh.setColumnWidth(8, 300);

  sh.getRange(1, 1, 1, 2).merge().setValue('RUN LOG')
    .setFontWeight('bold').setFontSize(14)
    .setBackground(CFG.BRAND.navy).setFontColor(CFG.BRAND.cream);

  var labels = ['Last updated', 'Version', 'Market report (live)', 'Leads report (live)', 'Land index (all markets)'];
  labels.forEach(function (l, i) {
    sh.getRange(i + 2, 1).setValue(l).setFontWeight('bold').setBackground(CFG.BRAND.camel);
    sh.getRange(i + 2, 2).setValue('—');
  });

  sh.getRange(8, 1, 1, 8).setValues([[
    'Timestamp', 'Version', 'Action', 'N', 'R²', 'Elasticity', 'Median $/acre', 'Link'
  ]]).setFontWeight('bold').setBackground(CFG.BRAND.camel);

  sh.setFrozenRows(8);
  return sh;
}

function updateRunLogPinned_(fields) {
  var sh = ensureRunLogSheet_();
  sh.getRange(2, 2).setValue(Utilities.formatDate(new Date(), 'GMT', 'MMM d, yyyy h:mm a') + ' UTC');
  if (fields.version)      sh.getRange(3, 2).setValue(fields.version);
  if (fields.marketUrl)    sh.getRange(4, 2).setValue(fields.marketUrl);
  if (fields.leadsUrl)     sh.getRange(5, 2).setValue(fields.leadsUrl);
  if (fields.landIndexUrl) sh.getRange(6, 2).setValue(fields.landIndexUrl);
}

function appendRunLogEntry_(entry) {
  var sh = ensureRunLogSheet_();
  sh.insertRowAfter(8); // newest entry always lands right below the frozen header
  var row = [
    Utilities.formatDate(new Date(), 'GMT', 'MMM d, yyyy h:mm a') + ' UTC',
    VERSION,
    entry.action || '',
    (entry.n !== undefined && entry.n !== null) ? entry.n : '',
    (entry.r2 !== undefined && entry.r2 !== null) ? Number(entry.r2.toFixed(3)) : '',
    (entry.elasticity !== undefined && entry.elasticity !== null) ? Number(entry.elasticity.toFixed(3)) : '',
    (entry.medianPpa !== undefined && entry.medianPpa !== null) ? entry.medianPpa : '',
    entry.link || ''
  ];
  sh.getRange(9, 1, 1, 8).setValues([row]);
  if (row[6] !== '') sh.getRange(9, 7).setNumberFormat('$#,##0');
}

function logRun_(action, opts) {
  opts = opts || {};
  updateRunLogPinned_({
    version: VERSION,
    marketUrl: opts.marketUrl,
    leadsUrl: opts.leadsUrl,
    landIndexUrl: opts.landIndexUrl
  });
  appendRunLogEntry_({
    action: action, n: opts.n, r2: opts.r2, elasticity: opts.elasticity,
    medianPpa: opts.medianPpa, link: opts.link
  });
}

/* ====================== GITHUB PUBLISH ====================== */

function getGithubToken_() {
  var t = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!t) throw new Error('No GitHub token set. Menu: Land Model -> Set GitHub Token.');
  return t;
}

function getLeadsSlug_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('LEADS_SLUG');
  if (!s) {
    s = Utilities.getUuid().replace(/-/g, '').substring(0, 10);
    props.setProperty('LEADS_SLUG', s);
  }
  return s;
}

function ghHeaders_(token) {
  return { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' };
}

function ghGetSha_(path, token) {
  var url = 'https://api.github.com/repos/' + CFG.GITHUB.owner + '/' + CFG.GITHUB.repo +
            '/contents/' + path + '?ref=' + CFG.GITHUB.branch;
  var res = UrlFetchApp.fetch(url, { headers: ghHeaders_(token), muteHttpExceptions: true });
  if (res.getResponseCode() === 200) return JSON.parse(res.getContentText()).sha;
  return null;
}

function ghPutFile_(path, content, token) {
  var sha = ghGetSha_(path, token);
  var payload = {
    message: 'Publish ' + path + ' - ' + new Date().toISOString(),
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: CFG.GITHUB.branch
  };
  if (sha) payload.sha = sha;
  var url = 'https://api.github.com/repos/' + CFG.GITHUB.owner + '/' + CFG.GITHUB.repo + '/contents/' + path;
  var res = UrlFetchApp.fetch(url, {
    method: 'put', contentType: 'application/json',
    headers: ghHeaders_(token), payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error('GitHub publish failed (' + code + '): ' + res.getContentText().substring(0, 300));
  }
}

function publishReport_(html, driveName, ghRelDir) {
  var driveUrl = '';
  try {
    var f = DriveApp.createFile(driveName, html, MimeType.HTML);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    driveUrl = f.getUrl();
  } catch (e) {
    driveUrl = 'Drive save failed: ' + e.message;
  }

  var ghUrl = '', ghError = '';
  try {
    var token = getGithubToken_();
    ghPutFile_(ghRelDir + '/index.html', html, token);
    ghUrl = 'https://' + CFG.GITHUB.owner + '.github.io/' + CFG.GITHUB.repo + '/' + ghRelDir + '/';
  } catch (e) {
    ghError = e.message;
  }

  return { drive: driveUrl, github: ghUrl, ghError: ghError };
}

function showPublishResult_(result, extraNote) {
  var msg = '';
  if (result.github) msg += 'Live:\n' + result.github + '\n\n';
  if (result.ghError) msg += 'GitHub publish failed:\n' + result.ghError + '\n\n';
  msg += 'Drive backup:\n' + result.drive;
  if (extraNote) msg += '\n\n' + extraNote;
  SpreadsheetApp.getUi().alert(msg);
}

/* ====================== LAND INDEX (manifest-driven) ====================== */

function manifestPath_() { return CFG.GITHUB.marketSlug + '/land/manifest.json'; }

function writeManifest_(M, cName, small, token) {
  var manifest = {
    name: cName,
    slug: CFG.GITHUB.marketSlug,
    updated: new Date().toISOString(),
    n: M.n,
    r2: M.r2,
    medianPpa: median_(small.map(function (r) { return r.sold / r.acres; })),
    marketUrl: CFG.GITHUB.marketSlug + '/land/'
  };
  ghPutFile_(manifestPath_(), JSON.stringify(manifest), token);
}

function fetchRepoTree_(token) {
  var branchUrl = 'https://api.github.com/repos/' + CFG.GITHUB.owner + '/' + CFG.GITHUB.repo +
                   '/branches/' + CFG.GITHUB.branch;
  var bRes = UrlFetchApp.fetch(branchUrl, { headers: ghHeaders_(token), muteHttpExceptions: true });
  if (bRes.getResponseCode() !== 200) throw new Error('Could not read branch: ' + bRes.getContentText().substring(0, 200));
  var treeSha = JSON.parse(bRes.getContentText()).commit.commit.tree.sha;

  var treeUrl = 'https://api.github.com/repos/' + CFG.GITHUB.owner + '/' + CFG.GITHUB.repo +
                '/git/trees/' + treeSha + '?recursive=1';
  var tRes = UrlFetchApp.fetch(treeUrl, { headers: ghHeaders_(token), muteHttpExceptions: true });
  if (tRes.getResponseCode() !== 200) throw new Error('Could not read tree: ' + tRes.getContentText().substring(0, 200));
  return JSON.parse(tRes.getContentText()).tree || [];
}

function fetchBlob_(sha, token) {
  var url = 'https://api.github.com/repos/' + CFG.GITHUB.owner + '/' + CFG.GITHUB.repo + '/git/blobs/' + sha;
  var res = UrlFetchApp.fetch(url, { headers: ghHeaders_(token), muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  var j = JSON.parse(res.getContentText());
  return Utilities.newBlob(Utilities.base64Decode(j.content), 'text/plain').getDataAsString();
}

function fetchAllLandManifests_(token) {
  var tree = fetchRepoTree_(token);
  var pattern = /^([^\/]+)\/land\/manifest\.json$/;
  var manifests = [];
  tree.forEach(function (entry) {
    if (entry.type !== 'blob') return;
    if (!pattern.test(entry.path)) return;
    var text = fetchBlob_(entry.sha, token);
    if (!text) return;
    try { manifests.push(JSON.parse(text)); } catch (e) { /* skip bad json */ }
  });
  return manifests;
}

function buildLandIndexHtml_(manifests) {
  manifests.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

  var h = head_('Land Market Reports',
    manifests.length + ' market' + (manifests.length === 1 ? '' : 's') + ' tracked',
    'Open, data-driven land pricing across every market Lance the Realtor tracks — sold comps, city premiums, and lot-feature effects, published in full.');

  h += '<div class="note">Pricing analysis for building lots, refreshed from live MLS data. ' +
    'Each market models sold parcels, current inventory, and lot features to price land the way it actually trades.</div>';

  manifests.forEach(function (m) {
    var updated = m.updated ? Utilities.formatDate(new Date(m.updated), 'GMT', 'MMM d, yyyy') : '—';
    h += '<div class="card">' +
      '<h4>' + esc_(m.name || m.slug) + '</h4>' +
      '<div class="meta">Updated ' + updated + '</div>' +
      '<div class="grid">' +
      '<div><b>' + (m.n || '—') + '</b>Sales modeled</div>' +
      '<div><b>' + (m.medianPpa ? fmt$_(m.medianPpa) : '—') + '</b>Median $/acre</div>' +
      '<div><b>' + (m.r2 !== undefined ? m.r2.toFixed(3) : '—') + '</b>Model R²</div>' +
      '</div>' +
      '<div style="margin-top:10px"><a href="../' + esc_(m.marketUrl) + '">Full market report →</a></div>' +
      '</div>';
  });

  h += '</div><footer>Lance the Realtor · Data-driven market analysis<br>' +
    'Generated ' + Utilities.formatDate(new Date(), 'GMT', 'MMMM d, yyyy') + '.</footer></body></html>';
  return h;
}

function rebuildLandIndex_(token) {
  var manifests = fetchAllLandManifests_(token);
  var html = buildLandIndexHtml_(manifests);
  ghPutFile_(CFG.GITHUB.landIndexPath + '/index.html', html, token);
  return 'https://' + CFG.GITHUB.owner + '.github.io/' + CFG.GITHUB.repo + '/' + CFG.GITHUB.landIndexPath + '/';
}

/* ====================== MARKET REPORT ====================== */

function buildMarketReport() {
  var M = getModel_(), rows = readData_();
  var sold = rows.filter(function (r) { return r.status === 'SOLD' && r.sold > 0 && r.acres; });
  var small = sold.filter(function (r) { return r.acres < CFG.ACRE_MAX; });
  var large = sold.filter(function (r) { return r.acres >= CFG.ACRE_MAX; });
  var act = rows.filter(function (r) { return r.status.indexOf('ACTIVE') === 0 || r.status === 'BACKUP'; });

  var counties = {};
  rows.forEach(function (r) { if (r.county) counties[r.county] = 1; });
  var cName = Object.keys(counties).join(' & ') || 'Local';

  var span = (M.maxDate - M.minDate) / (1000 * 60 * 60 * 24 * 30.44);
  var mos = act.length / (small.length / span);

  var cuts = sold.filter(function (r) { return r.orig && r.sold && r.sold < r.orig * 0.999; })
                 .map(function (r) { return 1 - r.sold / r.orig; });

  var over = [];
  act.forEach(function (r) {
    if (!r.acres || r.acres >= CFG.ACRE_MAX || !r.list) return;
    over.push(r.list / predict_(M, r.acres, r.city, r.util, null, r.lotFacts) - 1);
  });

  var medPpa = median_(small.map(function (r) { return r.sold / r.acres; }));
  var descr = cName + ' land market: ' + M.n + ' sales analyzed, median ' + fmt$_(medPpa) +
    '/acre, size elasticity ' + M.elasticity.toFixed(2) + '. Full methodology published.';

  var h = head_(cName + ' County Land Market',
    'Building lots under ' + CFG.ACRE_MAX + ' acres · ' +
    Utilities.formatDate(M.minDate, 'GMT', 'MMM yyyy') + ' – ' +
    Utilities.formatDate(M.maxDate, 'GMT', 'MMM yyyy'),
    descr);

  h += '<div class="kpis">' +
    kpi_(M.n, 'Sales modeled') +
    kpi_(fmt$_(medPpa), 'Median $/acre') +
    kpi_(M.elasticity.toFixed(3), 'Size elasticity') +
    kpi_(mos.toFixed(1) + ' mo', 'Months of supply') +
    '</div>';

  h += '<h2>What the data shows</h2>';
  h += '<div class="note"><b>Size elasticity of ' + M.elasticity.toFixed(3) + '.</b> ' +
    'Doubling lot size raises price about ' + Math.round((Math.pow(2, M.elasticity) - 1) * 100) +
    '%, so price per acre falls roughly ' + Math.round(Math.abs(Math.pow(2, M.elasticity - 1) - 1) * 100) +
    '% with each doubling. Buyers pay for the right to build, not for raw ground.</div>';

  if (cuts.length) {
    h += '<div class="note"><b>' + cuts.length + ' of ' + sold.length +
      ' sales closed below their original asking price</b>, at a median total discount of ' +
      (median_(cuts) * 100).toFixed(1) + '%. Sale-to-<i>last</i>-list ratios near 100% are a reporting ' +
      'artifact of Utah non-disclosure — they measure the price after reductions, not the price the seller started at.</div>';
  }

  if (over.length) {
    h += '<div class="note"><b>Current inventory is priced ' + fmtPct_(median_(over)) +
      ' against the model.</b> Of ' + over.length + ' active listings in scope, ' +
      over.filter(function (x) { return x > 0.15; }).length +
      ' are more than 15% above modeled value. That overhang is the pipeline for the next round of expired listings.</div>';
  }

  h += '<h2>City premiums</h2><p>Held at equal lot size, utilities and date — this is location alone.</p>';
  h += '<table><tr><th>City</th><th>vs ' + esc_(M.base) + '</th><th>Sales</th><th>Median $/acre</th></tr>';
  var cityRows = [[M.base, 0, M.cityN[M.base]]];
  M.dummies.forEach(function (c, k) { cityRows.push([c, M.beta[4 + k], M.cityN[c]]); });
  cityRows.sort(function (a, b) { return b[1] - a[1]; });
  cityRows.forEach(function (cr) {
    var p = small.filter(function (r) { return r.city === cr[0]; })
                 .map(function (r) { return r.sold / r.acres; });
    h += '<tr><td><b>' + esc_(cr[0]) + '</b></td><td>' +
      (cr[1] === 0 ? '<i>baseline</i>' : fmtPct_(Math.exp(cr[1]) - 1)) +
      '</td><td>' + cr[2] + '</td><td>' + fmt$_(median_(p)) + '</td></tr>';
  });
  h += '</table>';

  if (M.features && M.features.length) {
    h += '<h2>What the lot itself is worth</h2>' +
      '<p>Held at equal city, size, utilities and date — these are the physical features of the parcel.</p>' +
      '<table><tr><th>Feature</th><th>Price effect</th></tr>';
    M.features.forEach(function (ft, k) {
      h += '<tr><td>' + esc_(ft.label) + '</td><td>' + fmtPct_(Math.exp(M.beta[4 + M.dummies.length + k]) - 1) + '</td></tr>';
    });
    h += '</table>';
  }

  h += '<h2>Price by lot size</h2><table><tr><th>Acres</th><th>Sales</th><th>Median price</th><th>Median $/acre</th></tr>';
  [[0, .25], [.25, .5], [.5, 1], [1, 2]].forEach(function (b) {
    var s = small.filter(function (r) { return r.acres >= b[0] && r.acres < b[1]; });
    if (s.length < 3) return;
    h += '<tr><td>' + b[0] + ' – ' + b[1] + '</td><td>' + s.length + '</td><td>' +
      fmt$_(median_(s.map(function (r) { return r.sold; }))) + '</td><td>' +
      fmt$_(median_(s.map(function (r) { return r.sold / r.acres; }))) + '</td></tr>';
  });
  h += '</table>';

  if (large.length >= 5) {
    h += '<h2>Why large parcels are excluded</h2>' +
      '<p>This market contains two kinds of land that do not price the same way, and only one of them ' +
      'can be modeled reliably from public sales data.</p>' +
      '<table><tr><th></th><th>Under ' + CFG.ACRE_MAX + ' ac</th><th>' + CFG.ACRE_MAX + '+ ac</th></tr>' +
      '<tr><td>Sales</td><td>' + small.length + '</td><td>' + large.length + '</td></tr>' +
      '<tr><td>Median $/acre</td><td>' + fmt$_(medPpa) +
      '</td><td>' + fmt$_(median_(large.map(function (r) { return r.sold / r.acres; }))) + '</td></tr>' +
      '<tr><td>Stubbed utilities</td><td>' +
      Math.round(100 * small.filter(function (r) { return r.util === 2; }).length / small.length) + '%</td><td>' +
      Math.round(100 * large.filter(function (r) { return r.util === 2; }).length / large.length) + '%</td></tr>' +
      '</table>' +
      '<div class="note">Under ' + CFG.ACRE_MAX + ' acres, price follows size, location, services and lot ' +
      'features in a predictable curve. Above it the relationship breaks down — these are mostly unserviced ' +
      'parcels on the fringe, priced on entitlement risk and utility distance rather than on acreage. ' +
      'A parcel in that range needs individual analysis, not a model. ' +
      '<b>If you own acreage that has not sold, that is the reason, and it is fixable with the right approach.</b></div>';
  }

  h += '<h2>Method</h2><p>Log-linear regression on ' + M.n + ' sales, ' +
    Utilities.formatDate(M.minDate, 'GMT', 'MMM yyyy') + ' to ' +
    Utilities.formatDate(M.maxDate, 'GMT', 'MMM yyyy') + '. Predictors: lot size (log), city, ' +
    'utility availability, months elapsed' +
    (M.features && M.features.length ? ', and ' + M.features.length + ' lot features (' +
      M.features.map(function (f) { return f.label; }).join(', ') + ')' : '') + '. ' +
    'R² = ' + M.r2.toFixed(3) + '. Median absolute error ' + (M.mape * 100).toFixed(1) + '%. ' +
    M.trimmed + ' outliers removed at ' + CFG.OUTLIER_IQR + '× IQR on price per acre. ' +
    'Cities with fewer than ' + CFG.MIN_CITY_N + ' sales are pooled. ' +
    'Source: WFRMLS/URE closed sales.</p>';

  h += '</div><footer>Lance the Realtor · Data-driven market analysis<br>' +
    'Generated ' + Utilities.formatDate(new Date(), 'GMT', 'MMMM d, yyyy') +
    '. Estimates are statistical, not appraisals.</footer></body></html>';

  var ghDir = CFG.GITHUB.marketSlug + '/land';
  var result = publishReport_(h, cName + ' Land Market ' + Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd') + '.html', ghDir);

  var indexUrl = '', indexNote = '';
  if (result.github) {
    try {
      var token = getGithubToken_();
      writeManifest_(M, cName, small, token);
      indexUrl = rebuildLandIndex_(token);
      indexNote = 'Land index updated:\n' + indexUrl;
    } catch (e) {
      indexNote = 'Land index did not update: ' + e.message;
    }
  }

  showPublishResult_(result, indexNote);

  logRun_('Market Report', {
    n: M.n, r2: M.r2, elasticity: M.elasticity, medianPpa: medPpa,
    link: result.github || result.drive,
    marketUrl: result.github || result.drive,
    landIndexUrl: indexUrl || undefined
  });

  return result;
}

/* ====================== LEADS REPORT ====================== */

function buildLeadsReport() {
  var M = getModel_(), rows = readData_();

  var act = rows.filter(function (r) {
    return (r.status.indexOf('ACTIVE') === 0 || r.status === 'BACKUP') &&
           r.acres && r.acres < CFG.ACRE_MAX && r.list;
  });

  function score_(r, price) {
    var p = predict_(M, r.acres, r.city, r.util, null, r.lotFacts);
    var gap = price - p;
    return { pred: p, gap: gap, gapPct: gap / p,
             cut: (r.orig && r.list) ? 1 - r.list / r.orig : 0,
             comp: act.filter(function (a) {
               return a.city === r.city && a.list < price &&
                      Math.abs(a.acres - r.acres) < Math.max(0.25, r.acres * 0.5);
             }).length };
  }

  var dead = rows.filter(function (r) {
    return (r.status === 'EXPIRED' || r.status === 'WITHDRAWN') &&
           r.acres && r.acres < CFG.ACRE_MAX && r.list;
  }).map(function (r) { var s = score_(r, r.list); for (var k in s) r[k] = s[k]; return r; })
    .sort(function (a, b) { return b.gapPct - a.gapPct; });

  var domMed = median_(act.map(function (r) { return r.dom || 0; }));
  var pre = act.map(function (r) { var s = score_(r, r.list); for (var k in s) r[k] = s[k]; return r; })
    .filter(function (r) { return r.gapPct > 0.15 && r.dom > domMed; })
    .sort(function (a, b) { return (b.gapPct * b.dom) - (a.gapPct * a.dom); });

  var noCut = dead.filter(function (r) { return r.cut < 0.001; }).length;
  var noCutPct = Math.round(100 * noCut / Math.max(dead.length, 1));
  var medDom = Math.round(median_(dead.map(function (r) { return r.dom || 0; })));

  var h = head_('Land Opportunity Report',
    dead.length + ' expired & withdrawn · ' + pre.length + ' at-risk active listings',
    'Private analysis — expired and at-risk land listings ranked against modeled value. Not for public distribution.');

  h += '<div class="kpis">' +
    kpi_(dead.length, 'Dead listings') +
    kpi_(fmtPct_(median_(dead.map(function (r) { return r.gapPct; }))), 'Median gap to model') +
    kpi_(medDom, 'Median days listed') +
    kpi_(noCutPct + '%', 'Never cut price') +
    '</div>';

  h += '<div class="note"><b>' + noCutPct + '% of these listings never reduced their price.</b> ' +
    'The typical one sat about ' + medDom + ' days at the original number and expired. ' +
    'This is not a market that rejects sellers — it is a market that never got an answer, ' +
    'because the price never met it.</div>';

  if (pre.length) {
    h += '<h2>Tier 0 — Still listed, heading the same way</h2>' +
      '<p>Active listings priced above the model and sitting longer than the median. ' +
      'These owners still have an agent, which means a listing agreement with an end date. ' +
      'Reaching them first is worth more than reaching an expired owner sixth.</p>';
    pre.slice(0, 15).forEach(function (r) { h += card_(r, 'Active · ' + (r.dom || 0) + ' days'); });
  }

  h += '<h2>Tier 1 — Expired & withdrawn</h2>';
  dead.slice(0, 40).forEach(function (r) {
    h += card_(r, String(r['Status']) + ' · ' + (r.dom || 0) + ' days listed');
  });

  h += '<h2>Approach</h2>' +
    '<div class="script">"I track land pricing in ' + esc_(M.base) + ' and the surrounding cities — ' +
    'I run a regression on every closed lot sale in the county. Your parcel came up in the analysis. ' +
    'The number I get is different from where it was listed, and I think the gap explains why it sat. ' +
    'Can I walk you through what the sales actually show? No obligation — worst case you get a clearer ' +
    'picture than you had."</div>' +
    '<div class="note"><b>For the ones that never cut:</b> avoid implying they were greedy. ' +
    'The honest framing is that they never received the market\'s answer. ' +
    '<b>For the ones that cut and still failed:</b> lead with that — they already tried the obvious lever, ' +
    'which proves price alone was not the whole problem and opens the door to exposure, ' +
    'positioning and buyer targeting.</div>';

  h += '</div><footer>Lance the Realtor · Data-driven market analysis<br>' +
    'Model n=' + M.n + ', R²=' + M.r2.toFixed(3) + ', median error ' + (M.mape * 100).toFixed(1) + '%.<br>' +
    'Estimates are statistical, not appraisals. Verify ownership before contact and honor Do Not Call.</footer></body></html>';

  var slug = getLeadsSlug_();
  var ghDir = CFG.GITHUB.marketSlug + '/land/leads-' + slug;
  var result = publishReport_(h, 'Land Leads ' + Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd') + '.html', ghDir);
  showPublishResult_(result);

  logRun_('Leads Report', {
    n: M.n, r2: M.r2, elasticity: M.elasticity,
    link: result.github || result.drive,
    leadsUrl: result.github || result.drive
  });

  return result;
}

function card_(r, status) {
  var link = parcelLink_(r.county, r['Tax ID']);
  var h = '<div class="card' + (r.gapPct > 0.25 ? ' hot' : '') + '">' +
    '<h4>' + esc_(r['Address']) + '</h4>' +
    '<div class="meta">' + esc_(r.city) + ' · ' + r.acres + ' acres · ' + esc_(status) +
    ' · MLS ' + esc_(r['MLS#']) + '</div>' +
    '<div class="gap">' + fmt$_(Math.abs(r.gap)) + ' ' + (r.gap > 0 ? 'above' : 'below') +
    ' modeled value <span style="font-size:15px">(' + fmtPct_(r.gapPct) + ')</span></div>' +
    '<div class="grid">' +
    '<div><b>' + fmt$_(r.list) + '</b>Listed at</div>' +
    '<div><b>' + fmt$_(r.pred) + '</b>Model value</div>' +
    '<div><b>' + (r.cut > 0.001 ? fmtPct_(-r.cut) : 'never cut') + '</b>Price change</div>' +
    '<div><b>' + r.comp + '</b>Cheaper rivals</div>' +
    '</div>';
  if (r.comp > 0) {
    h += '<div style="font-size:13px;color:' + CFG.BRAND.olive + '">' + r.comp +
      ' comparable lot' + (r.comp > 1 ? 's are' : ' is') + ' currently listed in ' + esc_(r.city) +
      ' below this price.</div>';
  }
  if (link) h += '<div style="margin-top:8px"><a href="' + link +
    '" target="_blank">County parcel record →</a></div>';
  return h + '</div>';
}
