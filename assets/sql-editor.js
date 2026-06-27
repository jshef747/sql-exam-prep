/* sql-editor.js — a tiny, dependency-free SQL editor for the lessons.
 * Features: live syntax highlighting, line numbers, and schema-aware
 * autocomplete (keywords + tables + columns, with alias resolution).
 *
 * Usage in a lesson:
 *   <link rel="stylesheet" href="../assets/sql-editor.css">
 *   <script src="../assets/sql-editor.js" defer></script>
 *   <textarea class="sql-edit" data-schema="car-insurance" placeholder="select ..."></textarea>
 *
 * Pure logic (computeSuggestions, buildAliasMap, ...) is exported for Node tests
 * and runs without a DOM. DOM wiring only activates in a browser.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // Node
  root.SQLEditor = api;                                                      // browser
  if (typeof document !== 'undefined') api._initOnLoad();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* ---------- schemas (table -> columns) ---------- */
  var SCHEMAS = {
    'car-insurance': {
      person:   ['id', 'fname', 'lname', 'street', 'city', 'birth'],
      owns:     ['id', 'license'],
      car:      ['license', 'model', 'brand', 'year'],
      accident: ['accident_id', 'license', 'date', 'driver_id', 'damage', 'garage_id'],
      garage:   ['garage_id', 'garage_name', 'street', 'city']
    },
    bank: {
      branch:   ['branch-name', 'branch-city', 'assets'],
      customer: ['customer-name', 'street', 'customer-city'],
      deposit:  ['account-number', 'customer-name', 'branch-name', 'balance'],
      borrow:   ['loan-number', 'customer-name', 'branch-name', 'amount']
    },
    library: {
      Books:       ['isbn', 'title', 'publ_year', 'pages', 'author_id', 'num_copies'],
      Authors:     ['author_id', 'name', 'birth_year'],
      Borrowers:   ['borrower_id', 'name', 'phone_number', 'address'],
      Loans:       ['loan_id', 'book_isbn', 'borrower_id', 'loan_date', 'return_date'],
      Genres:      ['genre_id', 'genre_name'],
      Book_Genres: ['isbn', 'genre_id']
    },
    popes: {
      Papacy: ['title', 'number', 'start', 'end'],
      Info:   ['title', 'number', 'fname', 'lname', 'birth', 'death']
    }
  };

  // single-word keywords for coloring
  var HL_KEYWORDS = ('select distinct from where and or not in as join inner left right full outer ' +
    'on using natural group by order having asc desc union intersect minus except exists some any all ' +
    'contains between like is null insert into values delete update set create table view assertion check ' +
    'primary key foreign references count sum avg min max').split(/\s+/);
  var HLKW = {};
  HL_KEYWORDS.forEach(function (k) { HLKW[k] = true; });

  // completion entries (may be multi-word snippets for nicer IDE feel)
  var COMPLETIONS = ['select', 'distinct', 'from', 'where', 'and', 'or', 'not', 'in', 'as',
    'join', 'inner join', 'left outer join', 'right outer join', 'full join', 'on', 'using', 'natural join',
    'group by', 'order by', 'having', 'asc', 'desc', 'union', 'intersect', 'minus',
    'exists', 'not exists', 'some', 'all', 'contains', 'between', 'like',
    'is null', 'is not null', 'insert into', 'values', 'delete', 'update', 'set',
    'create table', 'create view', 'create assertion', 'check', 'primary key', 'foreign key', 'references',
    'count', 'sum', 'avg', 'min', 'max'];

  /* ---------- pure logic ---------- */

  function mergedSchema() {
    var out = {};
    for (var s in SCHEMAS) for (var t in SCHEMAS[s]) out[t] = SCHEMAS[s][t];
    return out;
  }

  function resolveSchema(name) {
    if (name && SCHEMAS[name]) return SCHEMAS[name];
    return mergedSchema();
  }

  // The identifier under the caret. `start` scans left; `end` scans right from
  // selEnd (or the caret) so the replace range covers the WHOLE token even when
  // the caret is mid-word or a selection extends past it. `raw` (start..caret)
  // is the prefix used for filtering.
  var TOKCH = /[A-Za-z0-9_.]/;
  function currentToken(text, caret, selEnd) {
    var i = caret;
    while (i > 0 && TOKCH.test(text.charAt(i - 1))) i--;
    var j = (selEnd == null ? caret : selEnd);
    while (j < text.length && TOKCH.test(text.charAt(j))) j++;
    return { raw: text.slice(i, caret), start: i, end: j };
  }

  // map alias/table-name (lowercased) -> real table name, by scanning from/join clauses
  function buildAliasMap(text, schema) {
    var map = {}, t;
    for (t in schema) map[t.toLowerCase()] = t;
    var re = /\b(from|join)\b([\s\S]*?)(\bwhere\b|\bgroup\b|\border\b|\bhaving\b|\bon\b|\bjoin\b|;|$)/gi, m;
    while ((m = re.exec(text))) {
      m[2].split(',').forEach(function (part) {
        var toks = part.trim().split(/\s+/).filter(Boolean);
        if (!toks.length) return;
        var first = toks[0].toLowerCase();
        var real = map[first];                          // is the first token a known table?
        if (!real) return;
        var alias = null;
        if (toks.length === 2 && toks[1].toLowerCase() !== 'as') alias = toks[1];
        else if (toks.length === 3 && toks[1].toLowerCase() === 'as') alias = toks[2];
        if (alias) map[alias.toLowerCase()] = real;
      });
      if (re.lastIndex === m.index) re.lastIndex++;      // guard against zero-length loops
    }
    return map;
  }

  function rank(cands, lower, start, end) {
    var out = [], seen = {};
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i], key = c.label.toLowerCase();
      if (seen[key]) continue;
      if (lower === '' || key.indexOf(lower) === 0) { out.push(c); seen[key] = true; }
    }
    out = out.slice(0, 12);
    return { items: out, start: start, end: end, token: lower };
  }

  /* Given full text, caret index, and a schema name, return the suggestion list,
     the replacement range [start,end], and whether it should auto-open. */
  function computeSuggestions(text, caret, schemaName, selEnd) {
    var schema = resolveSchema(schemaName);
    var tok = currentToken(text, caret, selEnd);
    var raw = tok.raw;

    // column completion after "qualifier."
    if (raw.indexOf('.') !== -1) {
      var parts = raw.split('.');
      var qualifier = parts[0];
      var partial = parts[parts.length - 1];
      var aliasMap = buildAliasMap(text, schema);
      var tbl = aliasMap[qualifier.toLowerCase()];
      var cols = tbl ? schema[tbl] : [];
      var dotCands = cols.map(function (c) { return { label: c, type: 'col', detail: tbl }; });
      var r = rank(dotCands, partial.toLowerCase(), caret - partial.length, tok.end);
      r.auto = true;
      return r;
    }

    var before = text.slice(0, tok.start).replace(/\s+$/, '');
    var pm = before.match(/([A-Za-z_]+)\s*$/);
    var prevWord = pm ? pm[1].toLowerCase() : '';
    var tableCtx = ['from', 'join', 'into', 'update', 'table', 'references'].indexOf(prevWord) !== -1;

    var tables = Object.keys(schema);
    var kwCands = COMPLETIONS.map(function (k) { return { label: k, type: 'kw' }; });
    var tblCands = tables.map(function (t) { return { label: t, type: 'table' }; });
    var colMap = {};
    tables.forEach(function (t) {
      schema[t].forEach(function (c) { (colMap[c] = colMap[c] || []).push(t); });
    });
    var colCands = Object.keys(colMap).map(function (c) {
      return { label: c, type: 'col', detail: colMap[c].length === 1 ? colMap[c][0] : '' };
    });

    var cands = tableCtx ? tblCands.concat(kwCands, colCands)
                         : kwCands.concat(tblCands, colCands);
    var lower = raw.toLowerCase();
    var res = rank(cands, lower, tok.start, tok.end);
    res.auto = lower.length >= 1 || tableCtx;
    return res;
  }

  /* ---------- highlighting ---------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function highlight(code) {
    return esc(code).replace(
      /('[^']*')|(--[^\n]*)|(\b\d+\b)|([A-Za-z_][A-Za-z0-9_]*)/g,
      function (m, str, cmt, num, word) {
        if (str) return '<span class="str">' + str + '</span>';
        if (cmt) return '<span class="cmt">' + cmt + '</span>';
        if (num) return '<span class="num">' + num + '</span>';
        if (word && HLKW[word.toLowerCase()]) return '<span class="kw">' + word + '</span>';
        return m;
      }
    );
  }

  /* ---------- DOM wiring (browser only) ---------- */

  function caretXY(ta, pos) {
    var s = getComputedStyle(ta);
    var div = document.createElement('div');
    ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'tabSize'
    ].forEach(function (p) { div.style[p] = s[p]; });
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre';
    div.style.overflow = 'hidden';
    // The editor is LTR even though the surrounding page is RTL. The mirror is
    // appended to <body> (RTL), so we MUST pin it to LTR or offsetLeft is
    // measured from the wrong edge and the popup lands far to the right.
    div.style.direction = 'ltr';
    div.style.textAlign = 'left';
    div.style.unicodeBidi = 'isolate';
    div.style.top = '0'; div.style.left = '-9999px';
    div.textContent = ta.value.slice(0, pos);
    var span = document.createElement('span');
    span.textContent = '​';
    div.appendChild(span);
    document.body.appendChild(div);
    var x = span.offsetLeft, y = span.offsetTop;
    var lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.5;
    document.body.removeChild(div);
    return { left: x, top: y, height: lh };
  }

  function highlightStatic(pre) { pre.innerHTML = highlight(pre.textContent); }

  function upgrade(ta) {
    if (ta._sqle) return;
    ta._sqle = true;
    var schemaName = ta.getAttribute('data-schema') || 'all';
    ta.setAttribute('wrap', 'off');
    ta.setAttribute('spellcheck', 'false');
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('dir', 'ltr');

    var wrap = document.createElement('div');
    wrap.className = 'sqle';
    var gutter = document.createElement('div');
    gutter.className = 'sqle-gutter';
    var area = document.createElement('div');
    area.className = 'sqle-area';
    var hl = document.createElement('pre');
    hl.className = 'sqle-hl';
    hl.setAttribute('aria-hidden', 'true');

    ta.parentNode.insertBefore(wrap, ta);
    wrap.appendChild(gutter);
    wrap.appendChild(area);
    area.appendChild(hl);
    area.appendChild(ta);

    var hint = document.createElement('div');
    hint.className = 'sqle-hint';
    hint.innerHTML = '↔ אנגלית · השלמה: <code>Tab</code>/<code>↵</code> לבחירה · <code>Esc</code> לסגירה · <code>Ctrl+Space</code> לפתיחה · <code>Esc</code> ואז <code>Tab</code> ליציאה';
    wrap.parentNode.insertBefore(hint, wrap.nextSibling);

    var pop = null, items = [], active = 0, sugg = null, escaped = false;

    function render() {
      var v = ta.value;
      hl.innerHTML = highlight(v.charAt(v.length - 1) === '\n' ? v + ' ' : v);
      var lines = v.split('\n').length;
      var g = '';
      for (var i = 1; i <= lines; i++) g += '<span>' + i + '</span>';
      gutter.innerHTML = g;
      syncScroll();
    }
    function syncScroll() {
      hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft;
      gutter.scrollTop = ta.scrollTop;
    }

    function closePop() { if (pop) { pop.remove(); pop = null; } items = []; }
    function openPop(list) {
      closePop();
      items = list; active = 0;
      pop = document.createElement('div');
      pop.className = 'sqle-pop';
      list.forEach(function (it, idx) {
        var row = document.createElement('div');
        row.className = 'it ' + it.type + (idx === 0 ? ' active' : '');
        var ty = it.type === 'kw' ? 'keyword' : (it.type === 'table' ? 'table' : 'column');
        var det = it.detail ? (' · ' + it.detail) : '';
        row.innerHTML = '<span class="lbl">' + it.label + '</span>' +
          '<span class="ty t-' + it.type + '">' + ty + det + '</span>';
        row.addEventListener('mousedown', function (e) { e.preventDefault(); accept(it); });
        row.addEventListener('mouseenter', function () { active = idx; paint(); });
        pop.appendChild(row);
      });
      area.appendChild(pop);
      var c = caretXY(ta, ta.selectionStart);
      var left = Math.max(2, c.left - ta.scrollLeft);
      var top = c.top - ta.scrollTop + c.height + 2;
      var maxLeft = area.clientWidth - pop.offsetWidth - 4;   // keep it inside the editor
      if (maxLeft > 2 && left > maxLeft) left = maxLeft;
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
    }
    function paint() {
      if (!pop) return;
      var rows = pop.querySelectorAll('.it');
      rows.forEach(function (r, i) { r.classList.toggle('active', i === active); });
      if (rows[active]) rows[active].scrollIntoView({ block: 'nearest' });
    }
    function accept(it) {
      // Recompute the range against the LIVE caret/selection so a stale range
      // (e.g. after Shift+Arrow extended the selection) can't strand characters.
      var r = computeSuggestions(ta.value, ta.selectionStart, schemaName, ta.selectionEnd);
      ta.setRangeText(it.label, r.start, r.end, 'end');
      closePop(); render(); ta.focus();
    }

    function reSuggest(force) {
      var r = computeSuggestions(ta.value, ta.selectionStart, schemaName, ta.selectionEnd);
      sugg = r;
      var list = r.items;
      // nothing useful to add if the only suggestion equals what's already typed
      if (list.length === 1 && list[0].label.toLowerCase() === r.token && r.token !== '') list = [];
      if (list.length && (force || r.auto)) openPop(list);
      else closePop();
    }

    function editText(str) {
      var s = ta.selectionStart, e = ta.selectionEnd;
      ta.setRangeText(str, s, e, 'end');
      render();
    }
    function autoIndent() {
      var v = ta.value, p = ta.selectionStart;
      var ls = v.lastIndexOf('\n', p - 1) + 1;
      var lead = (v.slice(ls, p).match(/^[ \t]*/) || [''])[0];
      editText('\n' + lead);
      closePop();
    }
    function outdent() {
      var v = ta.value, p = ta.selectionStart;
      var ls = v.lastIndexOf('\n', p - 1) + 1;
      var removed = 0;
      while (removed < 2 && v.charAt(ls + removed) === ' ') removed++;
      if (removed) {
        ta.value = v.slice(0, ls) + v.slice(ls + removed);
        var np = Math.max(ls, p - removed);
        ta.selectionStart = ta.selectionEnd = np;
        render();
      }
    }

    ta.addEventListener('input', function () { escaped = false; render(); reSuggest(false); });
    ta.addEventListener('scroll', syncScroll);
    ta.addEventListener('focus', function () { wrap.classList.add('focused'); });
    ta.addEventListener('blur', function () {
      wrap.classList.remove('focused');
      setTimeout(closePop, 120);
    });
    ta.addEventListener('click', function () { reSuggest(false); });
    ta.addEventListener('keydown', function (e) {
      if (e.isComposing || e.keyCode === 229) return;          // don't hijack IME composition
      if (e.key === 'Escape') {                                // Esc closes popup AND releases the next Tab
        if (pop) closePop();
        escaped = true; e.preventDefault(); return;
      }
      if (e.key !== 'Tab') escaped = false;                    // any other key cancels the release
      if (pop) {
        if (e.key === 'ArrowDown') { active = (active + 1) % items.length; e.preventDefault(); paint(); return; }
        if (e.key === 'ArrowUp') { active = (active - 1 + items.length) % items.length; e.preventDefault(); paint(); return; }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); accept(items[active]); return; }
      }
      if (e.key === ' ' && e.ctrlKey) { e.preventDefault(); reSuggest(true); return; }
      if (e.key === 'Tab') {
        if (escaped) { escaped = false; return; }              // after Esc: let Tab move focus (no keyboard trap)
        e.preventDefault(); e.shiftKey ? outdent() : editText('  '); return;
      }
      if (e.key === 'Enter') { e.preventDefault(); autoIndent(); return; }
    });
    // keep popup glued to caret as content/scroll changes are handled by reSuggest/openPop

    render();
  }

  function initOnLoad() {
    function go() {
      document.querySelectorAll('pre.sql').forEach(highlightStatic);
      document.querySelectorAll('textarea.sql-edit').forEach(upgrade);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }

  return {
    SCHEMAS: SCHEMAS,
    computeSuggestions: computeSuggestions,
    buildAliasMap: buildAliasMap,
    currentToken: currentToken,
    highlight: highlight,
    _initOnLoad: initOnLoad
  };
});
