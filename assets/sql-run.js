/* sql-run.js — adds a ▶ Run button under every SQL block so learners can
 * execute queries against seeded sample schemas, fully offline over file://.
 *
 * Targets: every static `pre.sql` (except `.bad` deliberately-wrong examples)
 * and every practice `textarea.sql-box`. The engine (AlaSQL) + seed data
 * (sql-data.js) + the quantified-ALL rewrite (sql-rewrite.js) are loaded lazily
 * on the first Run click, so opening a lesson stays light.
 *
 * Each Run builds a FRESH in-memory database from the block's schema, so runs
 * never leak into each other. Schema is resolved from the block's data-schema,
 * else its closest .ex practice box, else <body data-schema>, else car-insurance.
 *
 * Loads AFTER sql-blocks.js (both deferred), so practice boxes are already
 * highlighted/wrapped by the time we attach buttons.
 */
(function () {
  'use strict';

  function base() {
    var s = document.getElementsByTagName('script');
    for (var i = 0; i < s.length; i++) {
      var src = s[i].src || '', k = src.indexOf('sql-run.js');
      if (k >= 0) return src.slice(0, k);
    }
    return '../assets/';
  }
  var BASE = base();

  /* ---------- lazy engine loader ---------- */
  var enginePromise = null;
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = src; sc.onload = res; sc.onerror = function () { rej(new Error('load ' + src)); };
      document.head.appendChild(sc);
    });
  }
  function ensureEngine() {
    if (enginePromise) return enginePromise;
    enginePromise = loadScript(BASE + 'alasql.min.js')
      .then(function () { return loadScript(BASE + 'sql-data.js'); })
      .then(function () { return loadScript(BASE + 'sql-rewrite.js'); })
      .then(function () { return window.alasql; });
    return enginePromise;
  }

  /* ---------- schema resolution ---------- */
  function resolveSchema(block) {
    if (block.dataset && block.dataset.schema) return block.dataset.schema;
    // an exercise's practice box defines the schema for everything inside it
    // (incl. its model-answer <pre>). Check it BEFORE walking up to <body>,
    // whose page-default data-schema would otherwise shadow it.
    var ex = block.closest && block.closest('.ex');
    if (ex) { var b = ex.querySelector('[data-schema]'); if (b) return b.getAttribute('data-schema'); }
    var anc = block.closest && block.closest('[data-schema]');   // wrapper or <body> default
    if (anc) return anc.getAttribute('data-schema');
    return 'car-insurance';
  }

  function getSQL(block) {
    var raw = block.tagName === 'TEXTAREA' ? block.value : block.textContent;
    return raw.replace(/--[^\n]*/g, '').trim();   // drop -- line comments (safe for our lessons)
  }

  function execOn(alasql, schema, sql) {
    var defs = window.SQL_SCHEMAS[schema];
    if (!defs) throw new Error('הסכמה "' + schema + '" לא נטענה.');
    var db = new alasql.Database();        // fresh DB per run
    defs.forEach(function (s) { db.exec(s); });
    return db.exec(window.sqlRewriteAll(sql));
  }

  /* ---------- rendering ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function errHTML(msg) { return '<div class="sqlrun-err">⚠️ שגיאה: ' + esc(msg) + '</div>'; }
  function resultHTML(res) {
    if (!Array.isArray(res)) return '<div class="sqlrun-msg">✓ בוצע.</div>';
    if (!res.length) return '<div class="sqlrun-msg">✓ הרצה תקינה — 0 שורות.</div>';
    var cols = Object.keys(res[0]);
    var h = '<table><thead><tr>';
    cols.forEach(function (c) { h += '<th>' + esc(c) + '</th>'; });
    h += '</tr></thead><tbody>';
    res.forEach(function (row) {
      h += '<tr>';
      cols.forEach(function (c) {
        var v = row[c];
        h += '<td>' + (v == null ? '<span class="sqlrun-null">NULL</span>' : esc(v)) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table><div class="sqlrun-msg">' + res.length + ' שורות</div>';
  }

  /* ---------- answer checking (compare to the model solution) ---------- */
  // Canonical form: multiset of rows, values by column position, names ignored,
  // row order ignored. So aliasing / row-order differences pass, but wrong
  // columns / values / counts fail. (Order-by correctness isn't enforced.)
  function cell(v) { return v == null ? null : (typeof v === 'number' ? v : String(v)); }
  function canon(res) {
    if (!Array.isArray(res)) return null;
    var rows = res.map(function (r) {
      return JSON.stringify(Object.keys(r).map(function (k) { return cell(r[k]); }));
    });
    rows.sort();
    return JSON.stringify(rows);
  }
  function verdictHTML(ok, gotN, wantN) {
    if (ok) return '<div class="sqlrun-ok">✓ תשובה נכונה! התוצאה תואמת את הפתרון.</div>';
    var why = gotN === wantN
      ? 'אותו מספר שורות (' + gotN + '), אך הערכים או העמודות שונים.'
      : 'קיבלת ' + gotN + ' שורות, הציפייה ' + wantN + '.';
    return '<div class="sqlrun-no">✗ עדיין לא תואם לפתרון. ' + why + ' נסו שוב, או לחצו "הצג פתרון".</div>';
  }
  function expectedSQL(block) {              // the model answer for a practice box
    if (block.tagName !== 'TEXTAREA') return null;
    var ex = block.closest('.ex'); if (!ex) return null;
    var pre = ex.querySelector('.solution pre.sql'); // first model query
    return pre ? getSQL(pre) : null;
  }

  /* ---------- wiring ---------- */
  function attach(block) {
    if (block._run) return; block._run = true;
    var anchor = (block.tagName === 'TEXTAREA' && block.closest('.hlbox')) || block;

    var wrap = document.createElement('div'); wrap.className = 'sqlrun';
    var btn = document.createElement('button'); btn.type = 'button';
    btn.className = 'sqlrun-btn'; btn.textContent = '▶ הרץ';
    var out = document.createElement('div'); out.className = 'sqlrun-out';
    wrap.appendChild(btn); wrap.appendChild(out);
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);

    btn.addEventListener('click', function () {
      var sql = getSQL(block);
      if (!sql) { out.innerHTML = '<div class="sqlrun-msg">כתוב שאילתה קודם 🙂</div>'; return; }
      btn.disabled = true; var label = btn.textContent; btn.textContent = '…';
      ensureEngine().then(function (alasql) {
        var schema = resolveSchema(block);
        var res = execOn(alasql, schema, sql);
        var verdict = '';
        var exp = expectedSQL(block);          // practice box -> auto-check vs model
        if (exp) {
          try {
            var want = execOn(alasql, schema, exp), c1 = canon(res), c2 = canon(want);
            if (c1 !== null && c2 !== null) verdict = verdictHTML(c1 === c2, res.length, want.length);
          } catch (e) { /* model failed to run -> just show the result, no verdict */ }
        }
        out.innerHTML = verdict + resultHTML(res);
      }).catch(function (e) {
        out.innerHTML = errHTML((e && e.message) || 'הרצה נכשלה.');
      }).then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }

  var CSS =
    '.sqlrun{margin:10px 0 2px;direction:rtl}' +
    '.sqlrun-btn{background:#0b8457;color:#fff;border:none;border-radius:9px;padding:6px 15px;' +
      "font:600 14px Heebo,Assistant,Arial,sans-serif;cursor:pointer}" +
    '.sqlrun-btn:hover{background:#0a6f49}.sqlrun-btn:disabled{opacity:.6;cursor:default}' +
    '.sqlrun-out{margin-top:8px;direction:ltr;text-align:left;overflow-x:auto}' +
    '.sqlrun-out table{border-collapse:collapse;font:13px ui-monospace,Menlo,Consolas,monospace;background:#fff;margin:0}' +
    '.sqlrun-out th,.sqlrun-out td{border:1px solid #d6e2f6;padding:4px 10px;text-align:left;white-space:nowrap}' +
    '.sqlrun-out th{background:#eef2f8;color:#2b4a8b}' +
    '.sqlrun-null{color:#9aa7bd;font-style:italic}' +
    '.sqlrun-msg{margin-top:5px;font:13px Heebo,Assistant,Arial,sans-serif;color:#5b6b86;direction:rtl}' +
    '.sqlrun-err{background:#fdecea;border:1px solid #f1c0b8;color:#8e2a20;border-radius:8px;' +
      "padding:7px 12px;font:13px Heebo,Assistant,Arial,sans-serif;direction:rtl}" +
    '.sqlrun-ok{background:#e6f4ee;border:1px solid #bfe3d2;color:#0a5d3f;border-radius:8px;' +
      "padding:7px 12px;margin-bottom:8px;font:600 13.5px Heebo,Assistant,Arial,sans-serif;direction:rtl}" +
    '.sqlrun-no{background:#fff7e6;border:1px solid #f3e0a8;color:#8a5a00;border-radius:8px;' +
      "padding:7px 12px;margin-bottom:8px;font:600 13.5px Heebo,Assistant,Arial,sans-serif;direction:rtl}" +
    '@media print{.sqlrun{display:none}}';

  function go() {
    // skip deliberately-wrong (.bad) and explicitly non-runnable (data-norun, e.g. create assertion) blocks
    var blocks = [].slice.call(document.querySelectorAll('pre.sql:not(.bad):not([data-norun]), textarea.sql-box:not([data-norun])'));
    if (!blocks.length) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    blocks.forEach(attach);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
