/* sql-rewrite.js — make the SQL the lessons teach runnable in AlaSQL.
 *
 * AlaSQL supports `>= all (subquery)` in a WHERE clause but throws on the same
 * form inside HAVING (the headline MAX/MIN-of-an-aggregate pattern, e.g. exam
 * Q6.3). It also lacks general ANY/SOME. So before executing we rewrite the
 * quantified comparisons the course uses into the equivalent scalar-subquery
 * form, which AlaSQL runs correctly everywhere:
 *
 *   EXPR >= all (SELECT p FROM rest)  ->  EXPR >= (select max(_v) from (select p as _v from rest) _q)
 *   EXPR <= all (...)                 ->  EXPR <= (select min(_v) ...)
 *   EXPR >  any|some (...)            ->  EXPR >  (select min(_v) ...)
 *   EXPR <  any|some (...)            ->  EXPR <  (select max(_v) ...)
 *   EXPR =  any|some (...)            ->  EXPR in (...)
 *   EXPR <> all (...)                 ->  EXPR not in (...)
 *
 * Equivalence ignores the NULL/empty-set edge cases, which the exam queries
 * don't hit. Anything we don't recognise is left untouched.
 */
(function (root) {
  'use strict';

  function matchParen(s, i) {        // i = index of '(' ; returns index of matching ')'
    var depth = 0, inq = false;
    for (; i < s.length; i++) {
      var c = s[i];
      if (inq) { if (c === "'") inq = false; continue; }
      if (c === "'") { inq = true; continue; }
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) return i; }
    }
    return -1;
  }

  function topLevelFrom(s) {         // index of the FROM keyword at paren-depth 0
    var depth = 0, inq = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (inq) { if (c === "'") inq = false; continue; }
      if (c === "'") { inq = true; continue; }
      if (c === '(') { depth++; continue; }
      if (c === ')') { depth--; continue; }
      if (depth === 0 && (c === 'f' || c === 'F') &&
          /^from\b/i.test(s.slice(i)) && (i === 0 || /[\s)]/.test(s[i - 1]))) return i;
    }
    return -1;
  }

  function splitSelect(inner) {      // -> {proj, rest} where rest starts at FROM
    var s = inner.trim();
    var m = /^select\s+/i.exec(s);
    if (!m) return null;
    var body = s.slice(m[0].length).replace(/^distinct\s+/i, '');
    var fi = topLevelFrom(body);
    if (fi < 0) return null;
    return { proj: body.slice(0, fi).trim(), rest: body.slice(fi).trim() };
  }

  function buildScalar(op, q, inner) {
    if (op === '=' && q !== 'all') return 'in (' + inner + ')';
    if ((op === '<>' || op === '!=') && q === 'all') return 'not in (' + inner + ')';
    var agg;
    if (q === 'all') agg = (op === '>' || op === '>=') ? 'max' : (op === '<' || op === '<=') ? 'min' : null;
    else            agg = (op === '>' || op === '>=') ? 'min' : (op === '<' || op === '<=') ? 'max' : null;
    if (!agg) return null;
    var sp = splitSelect(inner);
    if (!sp) return null;
    return op + ' (select ' + agg + '(_v) from (select ' + sp.proj + ' as _v ' + sp.rest + ') _q)';
  }

  function rewriteQuantified(sql) {
    var re = /(>=|<=|<>|!=|>|<|=)\s*(all|any|some)\b\s*\(/gi;
    var out = '', last = 0, m;
    while ((m = re.exec(sql))) {
      var open = m.index + m[0].length - 1;
      var close = matchParen(sql, open);
      if (close < 0) continue;
      var repl = buildScalar(m[1], m[2].toLowerCase(), sql.slice(open + 1, close));
      if (repl === null) continue;               // leave unrecognised forms as-is
      out += sql.slice(last, m.index) + repl;
      last = close + 1;
      re.lastIndex = close + 1;
    }
    return out + sql.slice(last);
  }

  root.sqlRewriteAll = rewriteQuantified;
})(typeof window !== 'undefined' ? window : globalThis);
