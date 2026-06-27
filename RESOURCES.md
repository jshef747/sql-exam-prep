# SQL (Database Systems 131112) Resources

## Knowledge

- **`src/תאור שפת SQL.pdf`** — the course's own SQL chapter (Chapter 3), in Hebrew, bank schema (branch/customer/deposit/borrow).
  The single most important source. Use for: exact syntax and notation the exam expects — select/from/where = π/σ/×, distinct, joins (inner/outer/full, join..on, using), tuple variables, like, set ops (union/intersect/minus), in/not in, some/all, contains, exists, order by, aggregates, group by, having, insert/delete/update, create/drop table, views, null.
- **`src/בקרת שלמות הנתונים.pdf`** — the course's Data-Integrity / DB-Design chapter (Chapter 4), Hebrew.
  Use for: `create table` with `primary key` / `foreign key ... references`, domain types, `create assertion ... check`, and the FD/normalization background (out of scope for the SQL mission but cited when keys appear).
- **`test/*.pdf`** — 12 real exams (2023–2025, several groups), Hebrew.
  Ground truth for what is actually asked. Use for: practice problems and verifying every lesson points at a real exam pattern.

## Reference docs (built in this workspace)
- `reference/glossary.html` — Hebrew↔English DB/SQL glossary + the four exam schemas. The canonical vocabulary; adhere to it in every lesson.

## Wisdom (Communities)
- **Course staff / TA office hours and the course forum (Moodle)** — highest-signal for *this* exam's conventions and grading. Use for: confirming accepted query style and edge-case expectations.
- [Stack Overflow `sql` tag](https://stackoverflow.com/questions/tagged/sql) — use for: "is there a cleaner way to write this query" once a correct version exists.
- [r/SQL](https://reddit.com/r/SQL) — general query-writing critique.

Note: the user has not stated a community preference yet — propose lightly, don't push.

## Gaps
- No official answer key / solutions for the exams in the workspace. Solutions are reconstructed by the teacher (agent) and should be sanity-checked against the slides' accepted syntax.
