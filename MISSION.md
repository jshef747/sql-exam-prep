# Mission: SQL for the "Database Systems 131112" exam (Tel-Aviv Academic College)

## Why
Jonathan needs to walk into the "Database Systems 131112" exam (Prof. Gideon Dror / Prof. Ofer Arieli) and correctly answer **every SQL query-writing question** in Part B, plus the SQL/relational-algebra multiple-choice questions in Part A. Part B query writing is worth ~35 pts; the whole exam hinges on being fluent at turning a Hebrew word-problem into a correct, standard `select ... from ... where ... group by ... having ...` query.

## Success looks like
- Read a Hebrew query requirement and write a correct, readable SQL query in standard structure, with no second attempt.
- Handle every recurring exam pattern fluently: joins across many tables, `LIKE` substring matching, `group by` + `having`, MAX/MIN ("the most/least/highest"), **division / "for all"** queries, outer joins that include zero-count groups, correlated comparisons across groups (e.g. 2024 vs 2023), self-joins ("owns ≥ 2 cars"), `create table` + foreign keys, and `create assertion`.
- Recognise which relational-algebra expression is equivalent to a given SQL query (Part A multiple choice), and translate a relational-algebra expression into SQL.
- Do all of this on whatever schema the exam invents (bank, car-insurance, library, popes, ...), not just memorised answers.

## Constraints
- **Teaching language is Hebrew, right-to-left.** All instruction and explanation is in Hebrew RTL.
- **SQL code is English, left-to-right, always.** SQL keywords, table names, column names and queries are never translated to Hebrew and never rendered RTL. This is a hard rule (the user emphasised it three times).
- Lessons are self-contained offline HTML, opened with one command, beautiful enough to revise from later.
- Grounded in the two course presentations in `src/` and the real exams in `test/` — not generic web SQL.

## Out of scope (for now)
- Normalization decomposition (3NF / BCNF), functional-dependency closure, candidate-key finding — these appear in the exams but are a separate topic from "SQL questions." Revisit only if the user asks.
- B+ trees / indexing.
- Concurrency control (2PL, timestamps, serializability).
- ER-diagram-to-schema mapping.
