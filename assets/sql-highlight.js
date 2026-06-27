/* sql-highlight.js — syntax highlighting ONLY. No autocomplete, no line numbers,
 * no keyboard hijacking. Two jobs:
 *   1) color every static <pre class="sql"> block;
 *   2) give every <textarea class="sql-box"> live highlighting as you type
 *      (a highlighted <pre> rendered behind a transparent textarea).
 * The full mini-IDE (autocomplete etc.) still lives in sql-editor.js as an option. */
(function () {
  'use strict';

  var KW = ('select distinct from where and or not in as join inner left right full outer ' +
    'on using natural group by order having asc desc union intersect minus except exists some any all ' +
    'contains between like is null insert into values delete update set create table view assertion check ' +
    'primary key foreign references count sum avg min max').split(/\s+/);
  var KWSET = {};
  KW.forEach(function (k) { KWSET[k] = true; });

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function highlight(code) {
    return esc(code).replace(
      /('[^']*')|(--[^\n]*)|([A-Za-z_][A-Za-z0-9_]*)/g,
      function (m, str, cmt, word) {
        if (str) return '<span class="str">' + str + '</span>';
        if (cmt) return '<span class="cmt">' + cmt + '</span>';
        if (word && KWSET[word.toLowerCase()]) return '<span class="kw">' + word + '</span>';
        return m;
      }
    );
  }

  /* --- static code blocks --- */
  function highlightStatic() {
    document.querySelectorAll('pre.sql').forEach(function (el) {
      el.innerHTML = highlight(el.textContent);
    });
  }

  /* --- live-highlight textareas (overlay technique, no IDE chrome) --- */
  var CSS =
    '.hlbox{position:relative;direction:ltr;text-align:left}' +
    '.hlbox-pre{position:absolute;inset:0;margin:0;pointer-events:none;overflow:hidden;' +
      'padding:10px 12px;border:1px solid transparent;border-radius:10px;' +
      "font:14.5px/1.6 ui-monospace,'SF Mono',Menlo,Consolas,monospace;" +
      'white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;color:#1a2233}' +
    /* .hlbox repeated => specificity (0,2,1) so a lesson ".ex textarea" rule can never
       restore an opaque background and hide the typed text */
    '.hlbox.hlbox>textarea{position:relative;display:block;width:100%;min-height:84px;margin:0;' +
      'padding:10px 12px;border:1px solid #e2e8f2;border-radius:10px;' +
      "font:14.5px/1.6 ui-monospace,'SF Mono',Menlo,Consolas,monospace;" +
      'white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;' +
      'background:transparent;color:transparent;caret-color:#1a2233;resize:vertical;outline:none}' +
    '.hlbox.focused>textarea{border-color:#2b4a8b;box-shadow:0 0 0 3px rgba(43,74,139,.12)}' +
    '.hlbox>textarea::selection{background:rgba(43,74,139,.22)}' +
    '.hlbox>textarea::placeholder{color:#9aa7bd}' +
    '.hlbox-pre .kw{color:#1d4ed8;font-weight:700}' +
    '.hlbox-pre .str{color:#b45309}' +
    '.hlbox-pre .cmt{color:#6b7280;font-style:italic}';

  function injectCSS() {
    if (document.getElementById('sql-hl-css')) return;
    var s = document.createElement('style');
    s.id = 'sql-hl-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function upgradeBox(ta) {
    if (ta._hl) return;
    ta._hl = true;
    ta.setAttribute('dir', 'ltr');
    ta.setAttribute('spellcheck', 'false');
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');

    var wrap = document.createElement('div');
    wrap.className = 'hlbox';
    var pre = document.createElement('pre');
    pre.className = 'hlbox-pre';
    pre.setAttribute('aria-hidden', 'true');
    ta.parentNode.insertBefore(wrap, ta);
    wrap.appendChild(pre);
    wrap.appendChild(ta);

    function sync() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; }
    function render() {
      var v = ta.value;
      pre.innerHTML = highlight(v.charAt(v.length - 1) === '\n' ? v + ' ' : v);
      sync();
    }
    ta.addEventListener('input', render);
    ta.addEventListener('scroll', sync);
    ta.addEventListener('focus', function () { wrap.classList.add('focused'); });
    ta.addEventListener('blur', function () { wrap.classList.remove('focused'); });
    render();
  }

  function go() {
    highlightStatic();
    var boxes = document.querySelectorAll('textarea.sql-box');
    if (boxes.length) { injectCSS(); boxes.forEach(upgradeBox); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
