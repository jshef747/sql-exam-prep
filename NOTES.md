# Teaching notes

## Hard formatting rules (user emphasised 3×)
- Hebrew teaching text + instructions = **RTL** (`dir="rtl"`).
- SQL queries, keywords, table/column names = **English, LTR**. Never Hebrew, never RTL.
- In HTML: every SQL block is `<pre dir="ltr" ...>` / inline `<code dir="ltr">`. Body is `dir="rtl"`.
- Comparison operators (`>`, `<`, `>=`) live inside LTR code spans so RTL bidi never mirrors them.
- All files/code/comments in English (global rule); only the *learner-facing lesson prose* is Hebrew.

## Lesson template
- Self-contained HTML page, system Hebrew fonts (no CDN). Open with: `open lessons/NNNN-*.html`
- Each lesson: ONE skill, knowledge first then interactive practice (write-query-then-reveal + MCQ with instant feedback), citations to `src/` slides, reminder to ask the teacher (agent) follow-ups.
- **JOIN SOLUTIONS: always show `join ... on` FIRST (preferred), then comma+`where` as a labeled secondary** (natural join where clean). User preference — see memory `sql-lessons-prefer-join-on`. Single-table answers unaffected.
- **PRACTICE MUST ESCALATE INTO REAL EXAM QUESTIONS.** Each lesson's practice = warm-up → practice → a "שאלות ממבחנים" tier with 1–2 real `test/` exam questions (badge 🎓, cite exam, full solution, correct `data-schema`). The mission is solving every exam. See memory `sql-lessons-include-exam-questions`. Map of exam Qs → skills is in the exam question-space section above.

## EVERY lesson uses the SQL-blocks controller — `assets/sql-blocks.js`
- ONE include in `<head>`: `<script src="../assets/sql-blocks.js" defer></script>`.
- Practice boxes: `<textarea class="sql-box" data-schema="car-insurance" spellcheck="false" placeholder="select ...">`.
- It ALWAYS syntax-highlights static `<pre class="sql">` (kw/str/cmt). Lessons must NOT add their own inline highlighter. Keep page handlers (toggle/pick).
- It shows a fixed 3-way TOGGLE (top-left, "בלוקי SQL:") letting the USER choose how practice boxes behave; choice persists via localStorage + URL hash and applies across lessons. Switching reloads the page.
  - `autocomplete` → dynamically loads the optional `sql-editor.{js,css}` mini-IDE (adds class `sql-edit`, reads `data-schema`).
  - `highlight` (DEFAULT) → live overlay highlighting only (transparent textarea over colored `<pre>`), no chrome, native Tab/Enter.
  - `plain` → normal textarea.
- PERSISTENCE: whatever the user types in each `sql-box` is saved on input/keyup/blur and restored on load — survives reloads AND mode switches. Stored as ONE JSON blob (keyed by page path, box index) in BOTH localStorage AND `window.name`. The `window.name` mirror is essential: Safari (and some setups) do NOT persist localStorage on `file://`, but `window.name` survives a same-tab refresh — that was the bug the user hit. To clear a box, delete its text. Works in all three modes.
- Graceful: if JS fails, boxes degrade to visible plain textareas. Asset paths are derived from the controller's own `src`, so it works at any folder depth over file://.
- `sql-editor.{js,css}` (+ test) and `sql-highlight.js` remain on disk; sql-blocks.js supersedes sql-highlight.js for lessons but loads sql-editor.js on demand for autocomplete mode.

## Optional (NOT wired into lessons): mini-IDE `assets/sql-editor.{js,css}` + `sql-editor.test.js`
- Kept on disk as an option, not used by default. To opt a lesson back in: add the editor css+js in <head>, and make practice boxes `<textarea class="sql-edit" data-schema="car-insurance|bank|library|popes|all">`. NOTE: editor.js also highlights pre.sql, so if you opt in, DROP the sql-highlight.js include in that lesson to avoid double-processing.
- Gives: overlay live highlighting, line-number gutter, schema-aware autocomplete (alias resolution), keyboard nav. Already hardened by an adversarial review (caretXY forced LTR for the RTL page, gutter metrics matched, Tab escape-hatch + IME guard, full-identifier replace range, specificity-hardened transparent overlay). Node-tested: `node assets/sql-editor.test.js` (25 asserts).

## The exam SQL question-space (from test/ — drives the curriculum)
Schemas seen: bank (branch/customer/deposit/borrow — in slides), car-insurance (person/owns/car/accident/garage), library (Books/Authors/Borrowers/Loans/Genres/Book_Genres), popes (Papacy/Info).

Recurring SQL patterns the user MUST master:
1. select-from-where + distinct  (≈ π σ ×)
2. multi-table joins (where-join, join..on, natural join, outer join)
3. LIKE substring ('tov', 'ha')
4. group by + having + aggregates (avg/min/max/sum/count, count distinct)
5. MAX/MIN "most/least/highest" — via `>= all`, `= (select max..)`, or RA self-join trick
6. outer join to include zero-count groups + order by desc
7. subqueries: in / not in / exists / not exists / some / all / contains
8. **division / "for all"** (all brands, all genres, all books-of-author-are-X) — the crown jewel
9. correlated comparison across groups (count in 2024 < count in 2023)
10. self-join counting (≥2 owners, ≥3 cars all year>2020)
11. DDL: create table + primary/foreign keys; create assertion
12. SQL ↔ relational-algebra equivalence (Part A MCQ) + translate RA→SQL

## Lesson arc (deliver one at a time, adjust to ZPD)
DONE (built + runnable + auto-graded):
1. ✅ select-from-where + distinct (car-insurance)
2. ✅ joins (multi-table → join..on → natural)
3. ✅ LIKE
4. ✅ group by / having / aggregates
5. ✅ MAX/MIN patterns
6. ✅ outer joins + zero-count + order by
7. ✅ subqueries (in/exists/some/all)

REMAINING — combined 5→3 (user-approved 2026-06-28):
8. division / "for all" (kept standalone — the crown jewel)
9. **counting & comparison** = (old 9 correlated cross-group 2024-vs-2023, full 6.5) + (old 10 self-join counting ≥N / "the most", incl. 9.2) merged
10. **exam Part A** = (old 11 DDL: create table/FK/create assertion, incl. cascade Q6) + (old 12 SQL↔relational-algebra equivalence + RA→SQL, incl. Q4) merged

Total course now 10 lessons (was 12).

## Missing material
- `test/...2025 סמסטר 2 מועד 1` Part B (Q9–Q11) is in a "separate appendix" not in the file. The moed-2 sibling exam has equivalent questions, so coverage is fine.

## User preferences
- Respond to user in English (global rule). Lessons in Hebrew.
- (Caveman/Ponytail modes are active globally — keep chat terse, but lessons are full, polished Hebrew.)
