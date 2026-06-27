# SQL Exam Prep — Database Systems 131112

Interactive, self-contained HTML lessons for learning SQL toward the
"Database Systems 131112" exam. Teaching text is in Hebrew (right-to-left);
all SQL is in English (left-to-right). No build step, no server, no CDN —
just open a file in a browser.

## Lessons

- [lessons/0001-select-from-where.html](lessons/0001-select-from-where.html) — `select` / `from` / `where` + `distinct`
- [lessons/0002-joins.html](lessons/0002-joins.html) — joins (`join … on`, comma + `where`, `natural join`)
- [lessons/0003-like-string-matching.html](lessons/0003-like-string-matching.html) — `like` pattern matching (`%`, `_`)
- [lessons/0004-group-by-having.html](lessons/0004-group-by-having.html) — `group by` / `having` / aggregate functions

Reference:

- [reference/glossary.html](reference/glossary.html) — Hebrew↔English glossary + the exam schemas

## Practice editor

Every lesson has practice boxes with a toggle (top-left): **autocomplete**,
**syntax highlighting**, or **plain**. What you type is saved locally and
restored on reload. Shared code is in `assets/` — `sql-blocks.js` (the controller)
plus the optional `sql-editor.*` mini-IDE.

## Note

The course's lecture slides and exam PDFs are copyrighted third-party material
and are intentionally **not** included in this repository.
