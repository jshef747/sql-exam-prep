/* Node self-check for the pure autocomplete logic. Run: node assets/sql-editor.test.js */
var E = require('./sql-editor.js');
var fails = 0;
function ok(name, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) fails++; }
function caretAfter(text, sub) { return text.indexOf(sub) + sub.length; }
function labels(r) { return r.items.map(function (i) { return i.label; }); }

// 1. keyword completion from a prefix
var t1 = 'sel';
var r1 = E.computeSuggestions(t1, 3, 'car-insurance');
ok('1 "sel" suggests select first', r1.items[0] && r1.items[0].label === 'select');
ok('1 replace range is the whole token', r1.start === 0 && r1.end === 3);

// 2. table context after FROM
var t2 = 'select * from ca';
var r2 = E.computeSuggestions(t2, t2.length, 'car-insurance');
ok('2 after FROM, "ca" -> car (table) first', r2.items[0] && r2.items[0].label === 'car' && r2.items[0].type === 'table');

// 3. column completion via alias  (c -> person)
var t3 = 'select c.ci from person c';
var r3 = E.computeSuggestions(t3, caretAfter(t3, 'c.ci'), 'car-insurance');
ok('3 alias "c.ci" -> city', labels(r3).indexOf('city') !== -1 && r3.items[0].type === 'col');
ok('3 replace range is only the partial after the dot', t3.slice(r3.start, r3.end) === 'ci');

// 4. column completion via real table name (no alias)
var t4 = 'select * from accident where accident.dam';
var r4 = E.computeSuggestions(t4, t4.length, 'car-insurance');
ok('4 "accident.dam" -> damage', labels(r4).indexOf('damage') !== -1);

// 5. general context: column prefix not after FROM
var t5 = 'select ci';
var r5 = E.computeSuggestions(t5, t5.length, 'car-insurance');
ok('5 "ci" includes city (column)', labels(r5).indexOf('city') !== -1);
ok('5 "ci" is not table-context (city before car)', labels(r5)[0] === 'city');

// 6. empty token in general context should NOT auto-open
var t6 = 'select ';
var r6 = E.computeSuggestions(t6, t6.length, 'car-insurance');
ok('6 empty general token -> auto false', r6.auto === false);

// 7. empty token right after FROM SHOULD auto-open with tables
var t7 = 'select * from ';
var r7 = E.computeSuggestions(t7, t7.length, 'car-insurance');
ok('7 after "from " auto true and lists tables', r7.auto === true && labels(r7).indexOf('car') !== -1);

// 8. alias map basics
var amap = E.buildAliasMap('select * from person p, car c where p.id = c.license', E.SCHEMAS['car-insurance']);
ok('8 alias p->person', amap['p'] === 'person');
ok('8 alias c->car', amap['c'] === 'car');
ok('8 table name maps to itself', amap['garage'] === 'garage');

// 9. "as" alias form
var amap2 = E.buildAliasMap('select * from accident as a', E.SCHEMAS['car-insurance']);
ok('9 "as a" -> accident', amap2['a'] === 'accident');

// 10. highlighter escapes < and > and colors keywords
var h = E.highlight("select * from car where year > 2020 and brand <> 'x'");
ok('10 highlight escapes >', h.indexOf('&gt;') !== -1);
ok('10 highlight escapes < (from <>)', h.indexOf('&lt;') !== -1);
ok('10 highlight wraps keyword select', h.indexOf('<span class="kw">select</span>') !== -1);
ok('10 highlight wraps string', h.indexOf('<span class="str">') !== -1);
ok('10 highlight wraps number 2020', h.indexOf('<span class="num">2020</span>') !== -1);

// 11. multi-word completion: "gro" -> "group by"
var t11 = 'select brand from car gro';
var r11 = E.computeSuggestions(t11, t11.length, 'car-insurance');
ok('11 "gro" suggests "group by"', labels(r11).indexOf('group by') !== -1);

// 12. cross-schema: bank schema columns resolve
var r12 = E.computeSuggestions('select bal', 10, 'bank');
ok('12 bank "bal" -> balance', labels(r12).indexOf('balance') !== -1);

// 13. mid-token caret: replace range must cover the WHOLE identifier (no "fnameame")
var t13 = 'select fname from person';
var r13 = E.computeSuggestions(t13, t13.indexOf('fname') + 2, 'car-insurance'); // caret after "fn"
ok('13 mid-token range covers full word', t13.slice(r13.start, r13.end) === 'fname');
ok('13 mid-token still suggests fname', labels(r13).indexOf('fname') !== -1);

// 14. selection: replace range must extend through selEnd (no stranded tail)
var t14 = 'select fnXX';
var selStart = t14.indexOf('fn') + 2;     // caret after "fn"
var r14 = E.computeSuggestions(t14, selStart, 'car-insurance', t14.length); // selection fn->end
ok('14 selection range reaches selEnd', r14.end === t14.length);
ok('14 selection prefix is still "fn"', r14.token === 'fn');

console.log('\n' + (fails ? (fails + ' FAILED') : 'ALL ' + 'TESTS PASSED'));
process.exit(fails ? 1 : 0);
