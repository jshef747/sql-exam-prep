/* sql-blocks.js — one include for every lesson. It:
 *   1) always syntax-highlights static <pre class="sql"> blocks;
 *   2) shows a 3-way toggle for how the practice <textarea class="sql-box"> behave:
 *        - 'autocomplete'  -> full mini-IDE (loads sql-editor.js)
 *        - 'highlight'     -> live syntax highlighting only (overlay, no chrome)
 *        - 'plain'         -> a normal textarea
 *   The choice is saved (localStorage + URL hash) and persists across lessons.
 *
 *  Markup a lesson needs:
 *   <head> ... <script src="../assets/sql-blocks.js" defer></script>
 *   practice box: <textarea class="sql-box" data-schema="car-insurance" placeholder="select ..."></textarea>
 */
(function () {
  'use strict';

  var MODES = ['autocomplete', 'highlight', 'plain'];
  var LABELS = { autocomplete: 'השלמה אוטומטית', highlight: 'צביעת תחביר', plain: 'ללא' };
  var DEFAULT = 'highlight';

  function getMode() {
    var h = (location.hash.match(/sqlmode=(\w+)/) || [])[1];
    if (h && MODES.indexOf(h) >= 0) { try { localStorage.setItem('sqlMode', h); } catch (e) {} return h; }
    try { var m = localStorage.getItem('sqlMode'); if (m && MODES.indexOf(m) >= 0) return m; } catch (e) {}
    return DEFAULT;
  }
  function setMode(m) {
    try { localStorage.setItem('sqlMode', m); } catch (e) {}
    location.hash = 'sqlmode=' + m;      // carries the choice through the reload even without localStorage
    location.reload();
  }

  function assetBase() {
    var s = document.getElementsByTagName('script');
    for (var i = 0; i < s.length; i++) {
      var src = s[i].src || '', k = src.indexOf('sql-blocks.js');
      if (k >= 0) return src.slice(0, k);
    }
    return '../assets/';
  }

  /* ---------- shared highlighter ---------- */
  var KW = ('select distinct from where and or not in as join inner left right full outer ' +
    'on using natural group by order having asc desc union intersect minus except exists some any all ' +
    'contains between like is null insert into values delete update set create table view assertion check ' +
    'primary key foreign references count sum avg min max').split(/\s+/);
  var KWSET = {}; KW.forEach(function (k) { KWSET[k] = true; });
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function highlight(code) {
    return esc(code).replace(
      /('[^']*')|(--[^\n]*)|([A-Za-z_][A-Za-z0-9_]*)/g,
      function (m, str, cmt, word) {
        if (str) return '<span class="str">' + str + '</span>';
        if (cmt) return '<span class="cmt">' + cmt + '</span>';
        if (word && KWSET[word.toLowerCase()]) return '<span class="kw">' + word + '</span>';
        return m;
      });
  }
  function highlightStatic() {
    document.querySelectorAll('pre.sql').forEach(function (el) { el.innerHTML = highlight(el.textContent); });
  }

  /* ---------- injected styles ---------- */
  var CSS =
    /* baseline look for a practice box in any mode */
    'textarea.sql-box{width:100%;min-height:84px;direction:ltr;text-align:left;' +
      "font:14.5px/1.6 ui-monospace,'SF Mono',Menlo,Consolas,monospace;" +
      'border:1px solid #e2e8f2;border-radius:10px;padding:10px 12px;resize:vertical;background:#fff;color:#1a2233}' +
    /* highlight overlay */
    '.hlbox{position:relative;direction:ltr;text-align:left}' +
    '.hlbox-pre{position:absolute;inset:0;margin:0;pointer-events:none;overflow:hidden;' +
      'padding:10px 12px;border:1px solid transparent;border-radius:10px;' +
      "font:14.5px/1.6 ui-monospace,'SF Mono',Menlo,Consolas,monospace;" +
      'white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;color:#1a2233}' +
    '.hlbox.hlbox>textarea{position:relative;display:block;width:100%;min-height:84px;margin:0;' +
      'padding:10px 12px;border:1px solid #e2e8f2;border-radius:10px;' +
      "font:14.5px/1.6 ui-monospace,'SF Mono',Menlo,Consolas,monospace;" +
      'white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;' +
      'background:transparent;color:transparent;caret-color:#1a2233;resize:vertical;outline:none}' +
    '.hlbox.focused>textarea{border-color:#2b4a8b;box-shadow:0 0 0 3px rgba(43,74,139,.12)}' +
    '.hlbox>textarea::selection{background:rgba(43,74,139,.22)}' +
    '.hlbox>textarea::placeholder{color:#9aa7bd}' +
    '.hlbox-pre .kw{color:#1d4ed8;font-weight:700}.hlbox-pre .str{color:#b45309}.hlbox-pre .cmt{color:#6b7280;font-style:italic}' +
    /* toggle */
    '#sqlmode{position:fixed;top:10px;left:10px;z-index:9999;display:flex;gap:4px;align-items:center;' +
      'background:#fff;border:1px solid #d6e2f6;border-radius:999px;padding:4px 8px;' +
      'box-shadow:0 4px 14px rgba(20,40,80,.15);font-family:Heebo,Assistant,Arial,sans-serif;font-size:12.5px;direction:rtl}' +
    '#sqlmode b{color:#5b6b86;font-weight:700;margin:0 4px}' +
    '#sqlmode button{border:none;background:#eef2f8;color:#2b4a8b;border-radius:999px;padding:4px 10px;cursor:pointer;font:inherit}' +
    '#sqlmode button.on{background:#2b4a8b;color:#fff}' +
    '@media print{#sqlmode{display:none}}';
  function injectCSS() {
    if (document.getElementById('sqlblocks-css')) return;
    var s = document.createElement('style'); s.id = 'sqlblocks-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- highlight overlay mode ---------- */
  function upgradeHighlight(ta) {
    if (ta._hl) return; ta._hl = true;
    ta.setAttribute('dir', 'ltr'); ta.setAttribute('spellcheck', 'false');
    ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('autocomplete', 'off');
    var wrap = document.createElement('div'); wrap.className = 'hlbox';
    var pre = document.createElement('pre'); pre.className = 'hlbox-pre'; pre.setAttribute('aria-hidden', 'true');
    ta.parentNode.insertBefore(wrap, ta); wrap.appendChild(pre); wrap.appendChild(ta);
    function sync() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; }
    function render() {
      var v = ta.value;
      pre.innerHTML = highlight(v.charAt(v.length - 1) === '\n' ? v + ' ' : v); sync();
    }
    ta.addEventListener('input', render);
    ta.addEventListener('scroll', sync);
    ta.addEventListener('focus', function () { wrap.classList.add('focused'); });
    ta.addEventListener('blur', function () { wrap.classList.remove('focused'); });
    render();
  }

  /* ---------- autocomplete mode (load the optional mini-IDE) ---------- */
  function loadEditor(boxes) {
    var base = assetBase();
    var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = base + 'sql-editor.css';
    document.head.appendChild(link);
    boxes.forEach(function (ta) {
      ta.classList.add('sql-edit');
      if (!ta.getAttribute('data-schema')) ta.setAttribute('data-schema', 'car-insurance');
    });
    var sc = document.createElement('script'); sc.src = base + 'sql-editor.js';
    document.head.appendChild(sc);   // its own init upgrades textarea.sql-edit on load
  }

  /* ---------- toggle UI ---------- */
  function buildToggle(current) {
    if (document.getElementById('sqlmode')) return;
    var bar = document.createElement('div'); bar.id = 'sqlmode';
    var b = document.createElement('b'); b.textContent = 'בלוקי SQL:'; bar.appendChild(b);
    MODES.forEach(function (m) {
      var btn = document.createElement('button');
      btn.textContent = LABELS[m];
      if (m === current) btn.className = 'on';
      btn.addEventListener('click', function () { if (m !== current) setMode(m); });
      bar.appendChild(btn);
    });
    document.body.appendChild(bar);
  }

  /* ---------- persistence: keep what the user typed ----------
   * Robust on file:// — mirrors to BOTH localStorage AND window.name.
   * Safari (and some setups) do NOT persist localStorage on file:// pages, so a plain
   * refresh would lose everything. window.name survives a same-tab reload regardless of
   * storage policy, so it's the reliable fallback. All page values live in one JSON blob,
   * keyed by page path so multiple lessons in the same tab don't clobber each other. */
  var STORE_KEY = 'sqlboxes';
  var WN_PREFIX = 'SQLBOXES:';
  function readStore() {
    var data = {};
    try { var ls = localStorage.getItem(STORE_KEY); if (ls) data = JSON.parse(ls) || {}; } catch (e) {}
    try {
      if (window.name && window.name.indexOf(WN_PREFIX) === 0) {
        var wn = JSON.parse(window.name.slice(WN_PREFIX.length)) || {};
        for (var p in wn) {                       // merge: keep localStorage values, fill gaps from window.name
          if (!data[p]) data[p] = wn[p];
          else for (var k in wn[p]) if (data[p][k] == null) data[p][k] = wn[p][k];
        }
      }
    } catch (e) {}
    return data;
  }
  function writeStore(data) {
    var s;
    try { s = JSON.stringify(data); } catch (e) { return; }
    try { localStorage.setItem(STORE_KEY, s); } catch (e) {}
    try { window.name = WN_PREFIX + s; } catch (e) {}
  }
  function restorePersistence(boxes) {
    var store = readStore();
    var page = location.pathname || document.title;
    if (!store[page]) store[page] = {};
    boxes.forEach(function (ta, i) {
      if (store[page][i] != null) ta.value = store[page][i];
      function save() { store[page][i] = ta.value; writeStore(store); }
      // 'input' = typing/paste; 'keyup' also catches autocomplete-accept (setRangeText fires no input); 'blur' = safety net.
      ta.addEventListener('input', save);
      ta.addEventListener('keyup', save);
      ta.addEventListener('blur', save);
    });
  }

  /* ---------- boot ---------- */
  function go() {
    highlightStatic();
    var boxes = [].slice.call(document.querySelectorAll('textarea.sql-box'));
    if (!boxes.length) return;            // no practice boxes -> no toggle (e.g. glossary)
    injectCSS();
    restorePersistence(boxes);            // load saved answers + wire saving BEFORE any mode wraps the box
    var mode = getMode();
    buildToggle(mode);
    if (mode === 'highlight') boxes.forEach(upgradeHighlight);
    else if (mode === 'autocomplete') loadEditor(boxes);
    /* 'plain' -> leave the textareas styled by the baseline rule above */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
